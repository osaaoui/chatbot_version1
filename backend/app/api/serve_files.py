from fastapi import APIRouter
from fastapi.responses import FileResponse
from fastapi import HTTPException
import os

router = APIRouter()
UPLOAD_DIR = "uploaded_files"

@router.get("/files/{filename}")
def serve_file(filename: str):
    print(f"🔍 Looking for: {filename} in {UPLOAD_DIR}")
    
    # Check if file exists exactly
    direct_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.isfile(direct_path):
        print(f"✅ Direct match found: {direct_path}")
        return FileResponse(direct_path, media_type="application/pdf", filename=filename)
    
    # Try to find a prefixed version
    for f in os.listdir(UPLOAD_DIR):
        if f.endswith(f"__{filename}"):
            full_path = os.path.join(UPLOAD_DIR, f)
            print(f"✅ Found prefixed file: {full_path}")
            return FileResponse(full_path, media_type="application/pdf", filename=filename)

    raise HTTPException(status_code=404, detail="File not found")


