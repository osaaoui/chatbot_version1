import os
import re
import camelot
import pytesseract
from typing import List, Optional
from pdf2image import convert_from_path
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain.docstore.document import Document
from app.core.config import settings
from app.services.metadata_store import mark_as_processed
from app.core.base_service import BaseService

try:
    from langchain_postgres import PGVector
    from langchain_postgres.vectorstores import DistanceStrategy
    USE_NEW_PGVECTOR = True
except ImportError:
    from langchain_community.vectorstores.pgvector import PGVector
    from langchain.vectorstores.pgvector import DistanceStrategy
    USE_NEW_PGVECTOR = False

try:
    import nltk
    from nltk.tokenize import sent_tokenize
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)
except ImportError:
    def sent_tokenize(text):
        import re
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

EMBEDDING_MODEL = OpenAIEmbeddings(
    model="text-embedding-3-large",
    openai_api_key=settings.OPENAI_API_KEY,
    dimensions=1536,
    chunk_size=1000,
    max_retries=3,
    request_timeout=30
)

COLLECTION_NAME = "documents"

class PGVectorService(BaseService):
    
    def __init__(self):
        super().__init__()

_pgvector_service = PGVectorService()

def safe_collection_name(user_id: str) -> str:
    return user_id.replace("@", "_at_").replace(".", "_dot_")

def enhanced_split_by_sections(text):
    section_keywords = [
        "Title", "Título", "Subtitle", "Subtítulo", "Abstract", "Resumen", "Summary", 
        "Executive Summary", "Resumen Ejecutivo", "Keywords", "Palabras Clave",
        "Preface", "Prefacio", "Foreword", "Prólogo", "Introduction", "Introducción", 
        "Background", "Antecedentes", "Context", "Contexto", "Problem Statement", "Planteamiento del Problema",
        "Objectives", "Objetivos", "Scope", "Alcance", "Related Work", "Trabajo Relacionado", 
        "Literature Review", "Revisión de Literatura", "Theoretical Framework", "Marco Teórico",
        "Hypothesis", "Hipótesis", "Assumptions", "Supuestos", "Methodology", "Metodología", 
        "Methods", "Métodos", "Data Collection", "Recolección de Datos",
        "Data Sources", "Fuentes de Datos", "Experimental Setup", "Configuración Experimental", 
        "Materials and Methods", "Materiales y Métodos", "Evaluation", "Evaluación",
        "Validation", "Validación", "Analysis", "Análisis", "Results", "Resultados", 
        "Findings", "Hallazgos", "Observations", "Observaciones", "Discussion", "Discusión",
        "Interpretation", "Interpretación", "Implications", "Implicaciones", "Limitations", "Limitaciones", 
        "Recommendations", "Recomendaciones", "Future Work", "Trabajo Futuro",
        "Use Cases", "Casos de Uso", "Conclusion", "Conclusión", "Summary and Conclusion", "Resumen y Conclusión", 
        "Closing Remarks", "Comentarios Finales",
        "Acknowledgments", "Agradecimientos", "Funding", "Financiamiento", "Author Contributions", "Contribuciones del Autor",
        "Conflict of Interest", "Conflicto de Intereses", "Ethical Approval", "Aprobación Ética", 
        "References", "Referencias", "Bibliography", "Bibliografía",
        "Works Cited", "Obras Citadas", "Appendices", "Apéndices", "Appendix", "Apéndice", 
        "Supplementary Materials", "Materiales Suplementarios",
        "Supporting Information", "Información de Apoyo", "Glossary", "Glosario", 
        "Abbreviations", "Abreviaciones", "Index", "Índice",
        "Requirements", "Requerimientos", "Specifications", "Especificaciones", 
        "Implementation", "Implementación", "Design", "Diseño", "Architecture", "Arquitectura",
        "Technical Details", "Detalles Técnicos", "Configuration", "Configuración",
        "Installation", "Instalación", "Usage", "Uso", "Examples", "Ejemplos",
        "Troubleshooting", "Solución de Problemas", "FAQ", "Preguntas Frecuentes"
    ]
    
    pattern = re.compile(
        r"\n\s*(\d{0,3}[\.\)]?\s*)?(" + "|".join(map(re.escape, section_keywords)) + r")(\s*:)?\s*\n",
        re.IGNORECASE
    )
    splits = pattern.split(text)
    structured = []
    
    for i in range(2, len(splits), 4):
        if i < len(splits):
            title = splits[i].strip()
            content = splits[i + 1].strip() if i + 1 < len(splits) else ""
            
            if content and len(content) > 30:
                content = re.sub(r'\n\s*\n', '\n\n', content)
                content = re.sub(r'\s+', ' ', content)
                structured.append((title.title(), content))
    
    return structured

def smart_chunk_text(text, max_chunk_size=1200, overlap=150):
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    sentences = sent_tokenize(text)
    
    current_chunk = ""
    current_size = 0
    
    for sentence in sentences:
        sentence_size = len(sentence)
        
        if current_size + sentence_size > max_chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            
            overlap_text = ""
            if overlap > 0:
                words = current_chunk.split()
                overlap_words = words[-overlap//10:]
                overlap_text = " ".join(overlap_words) + " "
            
            current_chunk = overlap_text + sentence + " "
            current_size = len(current_chunk)
        else:
            current_chunk += sentence + " "
            current_size += sentence_size + 1
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def chunk_table_rows(df, rows_per_chunk=10):
    chunks = []
    for i in range(0, len(df), rows_per_chunk):
        md_chunk = df.iloc[i:i + rows_per_chunk].to_markdown(index=False)
        chunks.append(md_chunk)
    return chunks

def extract_tables_from_pdf(file_path, original_filename):
    tables_text = []
    try:
        tables = camelot.read_pdf(file_path, pages='all', strip_text='\n')
        if not tables:
            raise ValueError("No tables found with Camelot, trying OCR fallback...")
        
        for i, table in enumerate(tables):
            df = table.df
            for j, chunk in enumerate(chunk_table_rows(df)):
                if len(chunk.strip()) > 20:
                    tables_text.append({
                        "content": chunk,
                        "metadata": {
                            "source": original_filename,
                            "type": "table",
                            "table_id": i,
                            "chunk_id": j
                        }
                    })
    except Exception:
        try:
            for i, image in enumerate(convert_from_path(file_path)):
                text = pytesseract.image_to_string(image)
                if any(sym in text for sym in ["|", "+", "---"]) and len(text.strip()) > 20:
                    tables_text.append({
                        "content": text.strip(),
                        "metadata": {
                            "source": original_filename,
                            "type": "ocr_table",
                            "page": i + 1
                        }
                    })
        except Exception:
            pass
    return tables_text

async def _check_existing_sources(user_id: str) -> set:
    try:
        async with _pgvector_service.get_connection() as conn:
          result = await conn.fetch("SELECT * FROM readuserembeddingsources($1, $2)", 
                         COLLECTION_NAME, user_id)
        return {row['source'] for row in result if row['source']}
    except Exception:
        return set()

def _create_vectorstore():
    if USE_NEW_PGVECTOR:
        return PGVector(
            connection=settings.PGVECTOR_URL,
            collection_name=COLLECTION_NAME,
            embeddings=EMBEDDING_MODEL,
            distance_strategy=DistanceStrategy.COSINE,
            pre_delete_collection=False,
            use_jsonb=True
        )
    else:
        return PGVector(
            connection_string=settings.PGVECTOR_URL,
            collection_name=COLLECTION_NAME,
            embedding_function=EMBEDDING_MODEL,
            distance_strategy=DistanceStrategy.COSINE
        )

async def process_documents_for_user(filepaths: List[str], user_id: str) -> int:
    try:
        existing_sources = await _check_existing_sources(user_id)
        
        documents = []
        
        for filepath in filepaths:
            filename = os.path.basename(filepath)
            
            if filename in existing_sources:
                continue
            
            try:
                loader = PyPDFLoader(filepath)
                try:
                    raw_docs = loader.load()
                except Exception:
                    continue
                
                for page_num, doc in enumerate(raw_docs):
                    page_content = doc.page_content.strip()
                    
                    if len(page_content) < 50:
                        continue
                    sections = enhanced_split_by_sections(page_content)
                    if sections:
                        for title, text in sections:
                            if len(text) > 1200:
                                section_chunks = smart_chunk_text(text, max_chunk_size=1200, overlap=150)
                                for i, chunk in enumerate(section_chunks):
                                    documents.append(Document(
                                        page_content=f"# {title}\n\n{chunk}",
                                        metadata={
                                            **doc.metadata,
                                            "section": title,
                                            "source": filename,
                                            "user_email": user_id,
                                            "chunk_index": i,
                                            "total_chunks": len(section_chunks),
                                            "page_number": page_num + 1,
                                            "content_type": "section_chunk"
                                        }
                                    ))
                            else:
                                documents.append(Document(
                                    page_content=f"# {title}\n\n{text}",
                                    metadata={
                                        **doc.metadata,
                                        "section": title,
                                        "source": filename,
                                        "user_email": user_id,
                                        "page_number": page_num + 1,
                                        "content_type": "section"
                                    }
                                ))
                    else:
                        if len(page_content) > 1200:
                            page_chunks = smart_chunk_text(page_content, max_chunk_size=1200, overlap=150)
                            for i, chunk in enumerate(page_chunks):
                                documents.append(Document(
                                    page_content=chunk,
                                    metadata={
                                        **doc.metadata,
                                        "source": filename,
                                        "user_email": user_id,
                                        "chunk_index": i,
                                        "total_chunks": len(page_chunks),
                                        "page_number": page_num + 1,
                                        "content_type": "page_chunk"
                                    }
                                ))
                        else:
                            documents.append(Document(
                                page_content=page_content,
                                metadata={
                                    **doc.metadata,
                                    "source": filename,
                                    "user_email": user_id,
                                    "page_number": page_num + 1,
                                    "content_type": "page"
                                }
                            ))
                
                for item in extract_tables_from_pdf(filepath, filename):
                    table_content = item["content"]
                    if len(table_content.strip()) > 20:
                        documents.append(Document(
                            page_content=f"[EXTRACTED TABLE]\n{table_content}",
                            metadata={
                                **item["metadata"],
                                "user_email": user_id,
                                "content_type": "table"
                            }
                        ))
                
                mark_as_processed(user_id, filename, len(documents))
                
            except Exception:
                continue
        
        if not documents:
            return 0
        valid_documents = [doc for doc in documents if len(doc.page_content.strip()) > 50]
        try:
            vectorstore = _create_vectorstore()
            vectorstore.add_documents(valid_documents)
            return len(valid_documents)
            
        except Exception:
            return 0
            
    except Exception:
        return 0

def load_vectorstore(user_id: str):
    return get_vectorstore(user_id)

def get_vectorstore(user_id: str):
    try:
        return _create_vectorstore()
    except Exception:
        return None

def get_retriever(user_id: str, search_kwargs: Optional[dict] = None):
    if search_kwargs is None:
        search_kwargs = {"k": 12}
    
    search_kwargs.setdefault("filter", {})
    search_kwargs["filter"]["user_email"] = user_id
    
    try:
        vectorstore = get_vectorstore(user_id)
        if not vectorstore:
            return None
        
        return vectorstore.as_retriever(search_kwargs=search_kwargs)
    except Exception:
        return None

async def delete_file_chunks(user_id: str, filename: str):
    try:
        await _delete_file_chunks_async(user_id, filename)
    except Exception:
        pass

async def _delete_file_chunks_async(user_id: str, filename: str):
    try:
        async with _pgvector_service.get_connection() as conn:
            rows_deleted = await conn.fetchval("SELECT deleteuserembeddingbysource($1, $2, $3)", 
                                  COLLECTION_NAME, user_id, filename)
            
    except Exception:
        pass

def process_documents_for_user_sync(filepaths: List[str], user_id: str) -> int:
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            raise RuntimeError("Use await process_documents_for_user() in async context")
        return loop.run_until_complete(process_documents_for_user(filepaths, user_id))
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(process_documents_for_user(filepaths, user_id))
        finally:
            loop.close()

def delete_file_chunks_sync(user_id: str, filename: str):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            raise RuntimeError("Use await delete_file_chunks() in async context")
        loop.run_until_complete(delete_file_chunks(user_id, filename))
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(delete_file_chunks(user_id, filename))
        finally:
            loop.close()