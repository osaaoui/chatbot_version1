import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/files")
def list_user_files(user_id: str = Query(...)):
    user_files = []
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(user_id + "__"):
            user_files.append(filename.split("__", 1)[1])  # Remove user_id from filename
    return {"files": user_files}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as f:
            content = await file.read()
            f.write(content)
        return JSONResponse(content={"message": f"File '{file.filename}' uploaded successfully."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
