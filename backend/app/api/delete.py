# app/api/delete.py
from fastapi import APIRouter, HTTPException, Depends, Query
from app.services.vectorstore_service import delete_file_chunks
from app.services.metadata_store import load_metadata, save_metadata
from app.services.auth_service import get_current_user as authenticate_token  # ✅ fixed
import os

UPLOAD_DIR = "uploaded_files"
router = APIRouter()

@router.delete("/delete/{filename}")
def delete_document(
    filename: str,
    user_id: str = Query(...),
    token: dict = Depends(authenticate_token),  # ✅ token is a dict with 'email', possibly 'role'
):
    # ✅ Verify admin privileges
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # ✅ Delete from Chroma vectorstore
    delete_file_chunks(user_id, filename)

    # ✅ Delete from metadata store
    metadata = load_metadata()
    updated = [m for m in metadata if not (m["filename"] == filename and m["user_id"] == user_id)]
    save_metadata(updated)

    # ✅ Delete actual uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{user_id}__{filename}")
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"[DELETE] Removed file from disk: {file_path}")
    else:
        print(f"[DELETE] File not found on disk: {file_path}")


    return {"detail": f"{filename} deleted successfully"}
