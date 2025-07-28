from fastapi import FastAPI, Request, Response
from contextlib import asynccontextmanager
from app.core.base_service import BaseService 
from app.api import chat, upload, processing, list_files
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth_endpoint
from app.api.postgresql import user_profile 
from app.api import viewer
from fastapi.staticfiles import StaticFiles
import os
import logging
from app.api.delete import router as delete_router
from app.api.serve_files import router as serve_files_router
from app.api.postgresql import folders, documents, conversation, message, company, user_settings, emailverification
from app.api.postgresql import country
from app.core.circuit_breaker import CircuitBreakerOpenException
from fastapi.responses import JSONResponse



@asynccontextmanager
async def lifespan(app: FastAPI):
    await BaseService.initialize_pool()    
    yield
    await BaseService.close_pool()



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(lifespan=lifespan)

UPLOAD_DIR = os.path.abspath("uploaded_files") 

app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="uploaded_files")



@app.middleware("http")
async def ultra_cors_middleware(request: Request, call_next):
    logger.info(f"🚀 {request.method} {request.url.path} - Origin: {request.headers.get('origin', 'No Origin')}")
    
    if request.method == "OPTIONS":
        logger.info("✅ Handling OPTIONS preflight manually")
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "false"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response
    
    response = await call_next(request)
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "false"
    
    logger.info(f"✅ Response {request.method} {request.url.path}: {response.status_code}")
    return response

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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

UPLOAD_DIR = os.path.abspath("uploaded_files")
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="uploaded_files")

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
app.include_router(country.router, prefix="/api/v2/countries", tags=["countries"])
app.include_router(emailverification.router, prefix="/api/v2/email-verification", tags=["email_verification"])  # NUEVA LÍNEA