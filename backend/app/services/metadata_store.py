# services/metadata_store.py
import os
import json
from datetime import datetime

METADATA_FILE = "processed_metadata.json"  # or /mnt/data if persistent volume

def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return []
    with open(METADATA_FILE, "r") as f:
        return json.load(f)

def save_metadata(data):
    with open(METADATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

def has_already_been_processed(user_id: str, filename: str) -> bool:
    data = load_metadata()
    return any(entry for entry in data if entry["user_id"] == user_id and entry["filename"] == filename)

def mark_as_processed(user_id: str, filename: str, total_chunks: int):
    data = load_metadata()

    # prevent duplicates
    for d in data:
        if d["user_id"] == user_id and d["filename"] == filename:
            return  # already marked, skip

    data.append({
        "user_id": user_id,
        "filename": filename,
        "processed_at": datetime.utcnow().isoformat(),
        "total_chunks": total_chunks,
    })
    save_metadata(data)


def get_total_chunks(user_id: str, filename: str) -> int:
    data = load_metadata()
    for entry in data:
        if entry["user_id"] == user_id and entry["filename"] == filename:
            return entry.get("total_chunks", 0)
    return 0

