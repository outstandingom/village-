"""Replaceable Speech-to-Text provider interface (supports gpt-transcribe or local fallback)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class TranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_bytes: bytes, mime_type: str, language_hint: str = "auto") -> dict[str, Any]:
        """Transcribe audio bytes into text with confidence metadata."""


class LocalFallbackTranscriptionProvider(TranscriptionProvider):
    """Safe offline/dev adapter when external STT API key is not configured."""

    def transcribe(self, audio_bytes: bytes, mime_type: str, language_hint: str = "auto") -> dict[str, Any]:
        return {
            "provider": "local-fallback",
            "mimeType": mime_type,
            "sizeBytes": len(audio_bytes),
            "languageHint": language_hint,
            "transcript": "",
            "confidence": 0.0,
            "notice": "Configure TRANSCRIPTION_PROVIDER=gpt-transcribe and API key for server-side audio transcription, or use browser Web Speech API.",
        }
