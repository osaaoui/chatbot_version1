from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.base_service import BaseService 
from app.api import chat, upload, processing, list_files
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth_endpoint
from app.api.postgresql import user_profile 
from app.api import viewer
from fastapi.staticfiles import StaticFiles
import os
from app.api.delete import router as delete_router
from app.api.serve_files import router as serve_files_router
from app.api.postgresql import folders, documents, conversation, message, company, user_settings
from app.core.circuit_breaker import CircuitBreakerOpenException
from fastapi.responses import JSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    await BaseService.initialize_pool()    
    yield
    await BaseService.close_pool()

app = FastAPI(lifespan=lifespan)

UPLOAD_DIR = os.path.abspath("uploaded_files") 

app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="uploaded_files")



@app.middleware("http")
async def circuit_breaker_middleware(request, call_next):
    try:
        response = await call_next(request)
        return response
    except CircuitBreakerOpenException as e:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "Service temporarily unavailable",
                "error": "CIRCUIT_BREAKER_OPEN"
            }
        )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4321", "https://tiabot.softiabot.com/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v2/chat")
app.include_router(upload.router, prefix="/api/v2/uploads")
app.include_router(processing.router, prefix="/api/v2/documents")
app.include_router(auth_endpoint.router, prefix="/api/auth", tags=["auth"])
app.include_router(list_files.router, prefix="/api")
app.include_router(viewer.router)
app.include_router(delete_router, prefix="/api/v2/documents")
app.include_router(folders.router, prefix="/api/v2/folders", tags=["folders"])
app.include_router(documents.router, prefix="/api/v2/documentsv1", tags=["documents"])
app.include_router(conversation.router, prefix="/api/v2/conversations", tags=["conversations"])
app.include_router(message.router, prefix="/api/v2/messages", tags=["messages"])
app.include_router(user_profile.router, prefix="/api/auth", tags=["user_profile"])
app.include_router(company.router, prefix="/api/v2/companies", tags=["companies"])
app.include_router(user_settings.router, prefix="/api/v2/settings", tags=["user_settings"])
app.include_router(serve_files_router, prefix="/api")  
