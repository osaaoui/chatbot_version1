from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

router = APIRouter()
UPLOAD_DIR = "uploaded_files"

@router.get("/files/{filename}")
def serve_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        media_type="application/pdf",  # ✅ explicitly set
        filename=filename
    )
