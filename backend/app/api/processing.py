# app/api/processing.py
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import os
from app.services.vectorstore_service import process_document

UPLOAD_DIR = "uploaded_files"

router = APIRouter()

class ProcessRequest(BaseModel):
    filename: str
    user_id: str = "default"

@router.post("/process")
def process_file(req: ProcessRequest):
    filepath = os.path.join(UPLOAD_DIR, req.filename)

    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    total_chunks = process_document(filepath, req.user_id)
    return {
        "filename": req.filename,
        "message": "File processed and indexed",
        "total_chunks": total_chunks
    }
