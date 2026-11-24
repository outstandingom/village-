"""FastAPI application for Betul District AI, Voice Normalization & Document Intelligence."""

from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.document_processing.extractor import extract_document
from app.normalization.voice_normalizer import normalize_transcript

app = FastAPI(
    title="Betul District AI & Document Processing Service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class VoiceNormalizeInput(BaseModel):
    rawTranscript: str = Field(..., min_length=1, max_length=4000)
    languageHint: str = Field(default="auto")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "betul-ai-services"}


@app.post("/api/v1/voice/normalize")
def voice_normalize(body: VoiceNormalizeInput) -> dict:
    return normalize_transcript(body.rawTranscript, body.languageHint)


@app.post("/api/v1/documents/extract")
async def documents_extract(file: UploadFile = File(...)) -> dict:
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 15 MB limit.")
    try:
        return extract_document(
            filename=file.filename or "upload.bin",
            mime_type=file.content_type or "application/octet-stream",
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
