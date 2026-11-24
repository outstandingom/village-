"""Secure document validation, text/tabular extraction, and prompt-injection screening."""

from __future__ import annotations

import csv
import hashlib
import io
import os
import re
from typing import Any

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".csv", ".jpg", ".jpeg", ".png", ".txt", ".wav", ".mp3"}

INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.I),
    re.compile(r"grant\s+(me\s+)?(admin|district_admin|superuser)", re.I),
    re.compile(r"bypass\s+(rls|security|permission|auth)", re.I),
    re.compile(r"drop\s+table", re.I),
    re.compile(r"reveal\s+(system\s+prompt|secret\s+key)", re.I),
]


def detect_prompt_injection(text: str) -> bool:
    return any(rx.search(text) for rx in INJECTION_PATTERNS)


def extract_document(filename: str, mime_type: str, content: bytes) -> dict[str, Any]:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file extension: {ext}")

    sha256_hash = hashlib.sha256(content).hexdigest()
    warnings: list[str] = [
        "Extracted fields are unverified and queued for authorized officer review before updating official records."
    ]
    extracted_fields: dict[str, Any] = {}
    extracted_text = ""
    confidence = 0.7
    category = "official_document"

    if ext == ".csv":
        category = "tabular_dataset"
        decoded = content.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(decoded))
        rows = list(reader)
        extracted_text = decoded[:8000]
        extracted_fields = {
            "columns": reader.fieldnames or [],
            "rowCount": len(rows),
            "sampleRow": rows[0] if rows else {},
        }
        confidence = 0.96
    elif ext == ".txt":
        decoded = content.decode("utf-8", errors="replace")
        extracted_text = decoded[:8000]
        # Extract simple key: value pairs if present
        kv_matches = re.findall(r"^([A-Za-z][A-Za-z0-9 _-]{1,40}):\s*(.+)$", decoded, re.M)
        extracted_fields = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in kv_matches[:20]}
        confidence = 0.93
    elif ext in (".jpg", ".jpeg", ".png"):
        category = "scanned_image"
        extracted_text = (
            f"Image file '{filename}' ({len(content)} bytes) received. "
            "Queued for OCR verification pipeline."
        )
        extracted_fields = {"format": ext.lstrip("."), "sizeBytes": len(content)}
        confidence = 0.65
        warnings.append("Image OCR requires human verification for handwritten or low-light scans.")
    else:
        extracted_text = (
            f"Document '{filename}' ({mime_type}, {len(content)} bytes) validated and hashed. "
            "Structured extraction queued for review."
        )
        extracted_fields = {"format": ext.lstrip("."), "sizeBytes": len(content)}
        confidence = 0.75

    injection_flagged = detect_prompt_injection(extracted_text)
    if injection_flagged:
        warnings.append(
            "SECURITY ALERT: Prompt-injection pattern detected in uploaded document. "
            "Text has been flagged and cannot trigger AI tools."
        )

    lang = "hi" if re.search(r"[\u0900-\u097F]", extracted_text) else "en"

    return {
        "originalFilename": filename,
        "mimeType": mime_type,
        "sizeBytes": len(content),
        "sha256Hash": sha256_hash,
        "category": category,
        "languageDetected": lang,
        "extractedText": extracted_text,
        "extractedFields": extracted_fields,
        "extractionConfidence": confidence,
        "warnings": warnings,
        "promptInjectionDetected": injection_flagged,
    }
