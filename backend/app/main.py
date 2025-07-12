from fastapi import FastAPI
from app.api import chat, upload, processing, list_files
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth_endpoint
from app.api import viewer  # ✅ correct import
from fastapi.staticfiles import StaticFiles
import os
from app.api.delete import router as delete_router
from app.api.serve_files import router as serve_files_router
from app.api.postgresql import folders, documents


app = FastAPI()

UPLOAD_DIR = os.path.abspath("uploaded_files")  # ✅ ensure absolute path

# ✅ Mount /files to serve the actual PDF files
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="uploaded_files")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v2/chat")
app.include_router(upload.router, prefix="/api/v2/uploads")
app.include_router(processing.router, prefix="/api/v2/documents")
app.include_router(auth_endpoint.router, prefix="/api/auth", tags=["auth"])
app.include_router(list_files.router, prefix="/api")
app.include_router(viewer.router)  # ✅ register the router
app.include_router(delete_router, prefix="/api/v2/documents")
app.include_router(folders.router, prefix="/api/v2/folders", tags=["folders"])
app.include_router(documents.router, prefix="/api/v2/documentsv1", tags=["documents"])

# this is for the version with pdf-viewer-core

app.include_router(serve_files_router, prefix="/api")









