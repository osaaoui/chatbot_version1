from fastapi import APIRouter, Query
import os
import json

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
PROCESSED_METADATA_PATH = os.path.join(UPLOAD_DIR, "processed_metadata.json")
from app.services.metadata_store import has_already_been_processed


@router.get("/files")
def list_user_files(user_id: str = Query(...)):
    try:
        # Load processed file metadata
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

                # Status comes from processed_metadata.json if present
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
