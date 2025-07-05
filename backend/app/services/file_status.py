import os
import json
from datetime import datetime

UPLOAD_DIR = "uploaded_files"
PROCESSED_METADATA_PATH = os.path.join(UPLOAD_DIR, "processed_metadata.json")

def mark_files_as_processed(user_id: str, filenames: list[str], total_chunks: dict):
    if os.path.exists(PROCESSED_METADATA_PATH):
        with open(PROCESSED_METADATA_PATH, "r") as f:
            data = json.load(f)
    else:
        data = {}

    for name in filenames:
        key = f"{user_id}__{name}"
        data[key] = {
            "status": "processed",
            "chunks": total_chunks.get(name, 0),
            "timestamp": datetime.utcnow().isoformat()
        }

    with open(PROCESSED_METADATA_PATH, "w") as f:
        json.dump(data, f, indent=2)

