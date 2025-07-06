from fastapi import FastAPI
from app.api import chat, upload, processing, list_files
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth_endpoint
from app.api import viewer  # ✅ correct import
from fastapi.staticfiles import StaticFiles
import os

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
app.include_router(upload.router, prefix="/api/v2/documents")
app.include_router(processing.router, prefix="/api/v2/documents")
app.include_router(auth_endpoint.router, prefix="/api/auth", tags=["auth"])
app.include_router(list_files.router)  # ← include here
app.include_router(viewer.router)  # ✅ register the router







