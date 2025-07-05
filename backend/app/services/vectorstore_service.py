# app/services/vectorstore_service.py

import os
import re
import tempfile
import camelot
import pytesseract
from pdf2image import convert_from_path
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings

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

    section_pattern = re.compile(
        r"\n\s*(\d{0,2}[\.\)]?\s*)?(" + "|".join(map(re.escape, section_keywords)) + r")\s*\n",
        re.IGNORECASE
    )

    splits = section_pattern.split(text)

    structured_sections = []
    for i in range(2, len(splits), 3):
        section_title = splits[i].strip()
        section_text = splits[i + 1].strip() if i + 1 < len(splits) else ""
        if section_text:
            structured_sections.append((section_title.title(), section_text))
    return structured_sections


def chunk_table_rows(df, rows_per_chunk=10):
    chunks = []
    num_chunks = (len(df) + rows_per_chunk - 1) // rows_per_chunk
    for i in range(num_chunks):
        chunk_df = df.iloc[i*rows_per_chunk:(i+1)*rows_per_chunk]
        md_chunk = chunk_df.to_markdown(index=False)
        chunks.append(md_chunk)
    return chunks


def extract_tables_from_pdf(file_path, original_filename):
    tables_text = []
    try:
        tables = camelot.read_pdf(file_path, pages='all', strip_text='\n')
        if len(tables) == 0:
            raise ValueError("No tables found with Camelot, trying OCR fallback...")

        for i, table in enumerate(tables):
            df = table.df
            chunks = chunk_table_rows(df)
            for j, chunk in enumerate(chunks):
                tables_text.append({
                    "content": chunk,
                    "metadata": {
                        "source": original_filename,
                        "type": "table",
                        "table_id": i,
                        "chunk_id": j
                    }
                })
    except Exception as e:
        # fallback to OCR
        try:
            images = convert_from_path(file_path)
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                if "|" in text or "+" in text or "---" in text:
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


def process_document(file_path: str, user_id: str):
    documents = []
    original_filename = os.path.basename(file_path)
    user_store_dir = os.path.join(CHROMA_DIR, user_id)
    os.makedirs(user_store_dir, exist_ok=True)
    collection_name = safe_collection_name(user_id)  # ✅ sanitize email


    try:
        loader = PyPDFLoader(file_path)
        raw_docs = loader.load()

        for doc in raw_docs:
            sections = split_by_sections(doc.page_content)
            if sections:
                for section_title, section_text in sections:
                    documents.append(Document(
                        page_content=f"# {section_title}\n\n{section_text}",
                        metadata={**doc.metadata, "section": section_title, "source": original_filename}
                    ))
            else:
                documents.append(Document(
                    page_content=doc.page_content,
                    metadata={**doc.metadata, "source": original_filename}
                ))

        table_chunks = extract_tables_from_pdf(file_path, original_filename)
        for item in table_chunks:
            documents.append(Document(
                page_content=item["content"],
                metadata=item["metadata"]
            ))

    except Exception as e:
        print(f"Error during document parsing: {e}")
        raise e

    # Save to vectorstore

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

def get_vectorstore(user_id):
    """
    Load Chroma vectorstore for a user.
    """
    user_store_dir = os.path.join(CHROMA_DIR, user_id)
    return Chroma(
        collection_name=safe_collection_name(user_id),
        persist_directory=user_store_dir,
        embedding_function=OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.OPENAI_API_KEY
        )
    )


def get_retriever(user_id, search_kwargs=None):
    """
    Return retriever for user's vectorstore.
    """
    if search_kwargs is None:
        search_kwargs = {"k": 4}

    try:
        vectorstore = get_vectorstore(user_id)
        return vectorstore.as_retriever(search_kwargs=search_kwargs)
    except Exception as e:
        print(f"[RAG] Failed to load retriever for user {user_id}: {e}")
        return None

