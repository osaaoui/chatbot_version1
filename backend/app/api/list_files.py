from fastapi import APIRouter, Query, Depends
import os
import json
from app.services.metadata_store import has_already_been_processed
from app.services.vectorstore_service import safe_collection_name
from app.core.config import settings
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from app.services.auth_service import get_current_user
from fastapi import Depends


router = APIRouter()

UPLOAD_DIR = "uploaded_files"
PROCESSED_METADATA_PATH = os.path.join(UPLOAD_DIR, "processed_metadata.json")
CHROMA_DIR = "chroma_store"

@router.get("/files")
def list_user_files(user_id: str = Query(...)):
    try:
        if os.path.exists(PROCESSED_METADATA_PATH):
            with open(PROCESSED_METADATA_PATH, "r") as f:
                processed_data = json.load(f)
        else:
            processed_data = {}

        user_files = []

        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(user_id + "__"):
                original_name = filename.split("__", 1)[1]
                file_key = f"{user_id}__{original_name}"
                status = (
                    processed_data[file_key]["status"]
                    if file_key in processed_data
                    else "uploaded"
                )
                user_files.append({
                    "name": original_name,
                    "status": status
                })

        return {"files": user_files}

    except Exception as e:
        return {"files": [], "error": str(e)}


@router.get("/user-documents")
def list_user_documents(user: dict = Depends(get_current_user)):
    print(f"[DEBUG] /user-documents called by {user['email']}")
    user_dir = os.path.join(CHROMA_DIR, user["email"])
    collection_name = safe_collection_name(user["email"])

    if not os.path.exists(os.path.join(user_dir, "chroma.sqlite3")):
        return []

    try:
        vectorstore = Chroma(
            embedding_function=OpenAIEmbeddings(
                model="text-embedding-3-large",
                openai_api_key=settings.OPENAI_API_KEY
            ),
            persist_directory=user_dir,
            collection_name=collection_name
        )

        docs = vectorstore.get(include=["metadatas"])
        filenames = sorted(set(
            meta.get("source")
            for meta in docs["metadatas"]
            if meta.get("source")
        ))
        return filenames

    except Exception as e:
        print(f"Error loading documents for user {user['email']}: {e}")
        return []
