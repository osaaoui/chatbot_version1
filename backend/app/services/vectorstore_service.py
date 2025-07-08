import os
import re
import tempfile
import camelot
import pytesseract
from typing import List
from pdf2image import convert_from_path
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.docstore.document import Document
from app.core.config import settings
from app.services.metadata_store import mark_as_processed
from langchain_community.embeddings import HuggingFaceEmbeddings



CHROMA_DIR = "chroma_store"

def safe_collection_name(user_id: str) -> str:
    return user_id.replace("@", "_at_").replace(".", "_dot_")

def split_by_sections(text):
    section_keywords = [
        "Title", "Subtitle", "Abstract", "Summary", "Executive Summary", "Keywords",
        "Preface", "Foreword", "Introduction", "Background", "Context", "Problem Statement",
        "Objectives", "Scope", "Related Work", "Literature Review", "Theoretical Framework",
        "Hypothesis", "Assumptions", "Methodology", "Methods", "Data Collection",
        "Data Sources", "Experimental Setup", "Materials and Methods", "Evaluation",
        "Validation", "Analysis", "Results", "Findings", "Observations", "Discussion",
        "Interpretation", "Implications", "Limitations", "Recommendations", "Future Work",
        "Use Cases", "Conclusion", "Summary and Conclusion", "Closing Remarks",
        "Acknowledgments", "Funding", "Author Contributions", "CRediT Taxonomy",
        "Conflict of Interest", "Ethical Approval", "References", "Bibliography",
        "Works Cited", "Appendices", "Appendix", "Supplementary Materials",
        "Supporting Information", "Glossary", "Abbreviations", "Index"
    ]
    pattern = re.compile(
        r"\n\s*(\d{0,2}[\.\)]?\s*)?(" + "|".join(map(re.escape, section_keywords)) + r")\s*\n",
        re.IGNORECASE
    )
    splits = pattern.split(text)
    structured = []
    for i in range(2, len(splits), 3):
        title = splits[i].strip()
        content = splits[i + 1].strip() if i + 1 < len(splits) else ""
        if content:
            structured.append((title.title(), content))
    return structured

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
                if any(sym in text for sym in ["|", "+", "---"]):
                    tables_text.append({
                        "content": text.strip(),
                        "metadata": {
                            "source": original_filename,
                            "type": "ocr_table",
                            "page": i + 1
                        }
                    })
        except Exception as ocr_e:
            print(f"OCR extraction failed: {ocr_e}")
    return tables_text

def process_documents_for_user(filepaths: List[str], user_id: str) -> int:
    print(f"[PROCESS] Starting document processing for user: {user_id}")

    documents = []
    collection_name = safe_collection_name(user_id)
    user_store_dir = os.path.join(CHROMA_DIR, collection_name)  # ✅ safe path

    os.makedirs(user_store_dir, exist_ok=True)

    print(f"[RAG] Using vectorstore: {user_store_dir}, collection: {collection_name}")
    print(f"[PROCESS] Saving {len(documents)} documents to vectorstore at {user_store_dir}")

    existing_sources = set()
    if os.path.exists(os.path.join(user_store_dir, "chroma.sqlite3")):
        print(f"[SKIP] Found existing chroma.sqlite3 for {user_id}, checking for duplicates")
        try:
            vectorstore = Chroma(
                embedding_function=OpenAIEmbeddings(
                    model="text-embedding-3-large",
                    openai_api_key=settings.OPENAI_API_KEY
                ),
                persist_directory=user_store_dir,
                collection_name=collection_name
            )
            existing_sources = {
                meta.get("source")
                for meta in vectorstore.get(include=["metadatas"])['metadatas']
            }
        except Exception as e:
            print(f"Failed to load existing vectorstore: {e}")

    for filepath in filepaths:
        filename = os.path.basename(filepath)
        if filename in existing_sources:
            continue

        try:
            loader = PyPDFLoader(filepath)
            try:
                raw_docs = loader.load()
                print(f"[LOAD] Loaded {len(raw_docs)} raw pages from {filepath}")
            except Exception as e:
                print(f"[LOAD] Failed to load {filepath} with PyPDFLoader, trying fallback: {e}")
                return 0

            for doc in raw_docs:
                sections = split_by_sections(doc.page_content)
                if sections:
                    for title, text in sections:
                        documents.append(Document(
                            page_content=f"# {title}\n\n{text}",
                            metadata={**doc.metadata, "section": title, "source": filename}
                        ))
                else:
                    documents.append(Document(
                        page_content=doc.page_content,
                        metadata={**doc.metadata, "source": filename}
                    ))

            for item in extract_tables_from_pdf(filepath, filename):
                documents.append(Document(
                    page_content=item["content"],
                    metadata=item["metadata"]
                ))

            mark_as_processed(user_id, filename, len(documents))

        except Exception as e:
            print(f"Failed to process {filename}: {e}")

    if not documents:
        return 0

    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.OPENAI_API_KEY
        ),
        persist_directory=user_store_dir,
        collection_name=collection_name
    )
    vectorstore.persist()

    return len(documents)

def load_vectorstore(user_id: str):
    user_dir = os.path.join(CHROMA_DIR, safe_collection_name(user_id))  # ✅ safe path
    embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    return Chroma(persist_directory=user_dir, embedding_function=embeddings)


def get_vectorstore(user_id):
    user_store_dir = os.path.join(CHROMA_DIR, safe_collection_name(user_id))  # ✅ safe path
    return Chroma(
        collection_name=safe_collection_name(user_id),
        persist_directory=user_store_dir,
        embedding_function=OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.OPENAI_API_KEY
        )
    )



def get_retriever(user_id, search_kwargs=None):
    if search_kwargs is None:
        search_kwargs = {"k": 4}
    try:
        vectorstore = get_vectorstore(user_id)
        return vectorstore.as_retriever(search_kwargs=search_kwargs)
    except Exception as e:
        print(f"[RAG] Failed to load retriever for user {user_id}: {e}")
        return None

def delete_file_chunks(user_id: str, filename: str):
    collection_name = safe_collection_name(user_id)
    persist_directory = os.path.join(CHROMA_DIR, collection_name)  # ✅ safe path

    embedding_function = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embedding_function,
        persist_directory=persist_directory,
    )

    results = vectorstore.get()

    to_delete = []
    for i, meta in enumerate(results["metadatas"]):
        if meta.get("source") == filename:
            to_delete.append(results["ids"][i])

    if not to_delete:
        print(f"[INFO] No chunks found for {filename}")
        return

    vectorstore.delete(ids=to_delete)
    print(f"[INFO] Deleted {len(to_delete)} chunks for {filename}")
