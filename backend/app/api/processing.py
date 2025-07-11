# app/api/processing.py
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import os
from fastapi.responses import JSONResponse

from app.services.vectorstore_service import process_documents_for_user
from typing import List
from app.services.metadata_store import (
    has_already_been_processed,
    mark_as_processed,
    get_total_chunks,
    load_metadata
)
print("[BOOT] Registered /api/v2/documents/process route")

UPLOAD_DIR = "uploaded_files"


router = APIRouter()

class ProcessRequest(BaseModel):
    filenames: List[str]
    user_id: str

@router.get("/user-documents/{user_id}")
def get_user_documents(user_id: str):
    metadata = load_metadata()
    user_docs = [
        entry for entry in metadata
        if entry["user_id"] == user_id
        and os.path.exists(os.path.join(UPLOAD_DIR, f"{user_id}__{entry['filename']}"))  # ✅ File must still exist
    ]
    return JSONResponse(content=user_docs)





@router.post("/process")
def process_documents(req: ProcessRequest):
    print(f"[API] 🔄 Called process_documents for user={req.user_id}")
    print(f"[API] 🔄 Filenames: {req.filenames}")
    if not req.filenames:
        raise HTTPException(status_code=400, detail="No filenames provided")

    processed_files = []
    total_chunks = 0

    for filename in req.filenames:
        filepath = os.path.join(UPLOAD_DIR, filename)
        if not os.path.isfile(filepath):
            continue  # skip missing files

        if has_already_been_processed(req.user_id, filename):
            continue  # skip previously processed files

        chunks = process_documents_for_user([filepath], req.user_id)

        mark_as_processed(req.user_id, filename, chunks)
        total_chunks += chunks
        processed_files.append(filename)

    return {
        "processed_files": processed_files,
        "total_chunks": total_chunks,
        "overall_message": "Processing completed" if processed_files else "All files were already processed"
    }

