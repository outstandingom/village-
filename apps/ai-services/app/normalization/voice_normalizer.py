"""Voice & mixed Hindi-English (Hinglish) transcript normalization with Betul domain vocabulary."""

from __future__ import annotations

import re
from typing import Any

# Configurable Betul District domain vocabulary
DOMAIN_VOCABULARY: dict[str, dict[str, Any]] = {
    "schemes": {
        "sch-pmayg": {
            "official": "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
            "aliases": ["pmay", "pmayg", "awaas", "awas", "ghar wali yojana", "makan yojana", "ghar chahiye"],
            "ambiguous_phrases": ["ghar wali yojana", "makan yojana", "ghar chahiye"],
        },
        "sch-pmkisan": {
            "official": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            "aliases": ["pm kisan", "kisan nidhi", "kisan paisa", "kheti yojana"],
            "ambiguous_phrases": ["kisan paisa", "kheti yojana"],
        },
        "sch-ujjwala": {
            "official": "Pradhan Mantri Ujjwala Yojana (LPG Connection)",
            "aliases": ["ujjwala", "ujwala", "gas yojana", "cylinder yojana", "lpg"],
            "ambiguous_phrases": ["gas yojana", "cylinder yojana"],
        },
        "sch-ladli-behna": {
            "official": "Mukhyamantri Ladli Behna Yojana (MP)",
            "aliases": ["ladli behna", "ladli bahna", "behna yojana", "mahila yojana"],
            "ambiguous_phrases": ["mahila yojana"],
        },
        "sch-mp-seekho-kamao": {
            "official": "Mukhyamantri Seekho Kamao Yojana",
            "aliases": ["seekho kamao", "sikho kamao", "rojgar yojana", "naukri", "employment"],
            "ambiguous_phrases": [],
        },
    },
    "villages": ["Khedi Sawligarh", "Badora", "Sohagpur", "Betul Bazar", "Jhallar"],
}

SPELLING_CORRECTIONS = {
    "ujwala": "ujjwala",
    "awas": "awaas",
    "sikho": "seekho",
    "betool": "betul",
    "baitaul": "betul",
    "khedi savligarh": "khedi sawligarh",
    "jhalar": "jhallar",
}


def detect_language(text: str) -> str:
    has_devanagari = bool(re.search(r"[\u0900-\u097F]", text))
    lower = text.lower()
    has_roman_hindi = bool(
        re.search(
            r"\b(mujhe|yojana|ghar|kisan|gaon|bharna|chahiye|naukri|madad|vibhag|krishi|makan|betul|hai|ka|ki)\b",
            lower,
        )
    )
    has_english = bool(
        re.search(
            r"\b(scheme|farmer|department|create|village|school|housing|pending|acres|graduate|employment|form)\b",
            lower,
        )
    )
    if (has_devanagari or has_roman_hindi) and has_english:
        return "hinglish"
    if has_devanagari or has_roman_hindi:
        return "hi"
    return "en"


def normalize_transcript(raw_transcript: str, language_hint: str = "auto") -> dict[str, Any]:
    cleaned = re.sub(r"\s+", " ", raw_transcript).strip()
    lower = cleaned.lower()
    for wrong, right in SPELLING_CORRECTIONS.items():
        lower = re.sub(rf"\b{re.escape(wrong)}\b", right, lower)

    detected_lang = detect_language(cleaned) if language_hint == "auto" else language_hint
    if detected_lang not in ("en", "hi", "hinglish"):
        detected_lang = detect_language(cleaned)

    # Check ambiguous colloquial scheme references first
    candidates: list[dict[str, Any]] = []
    needs_clarification = False
    clarification_prompt: str | None = None

    for scheme_id, info in DOMAIN_VOCABULARY["schemes"].items():
        for phrase in info["ambiguous_phrases"]:
            if phrase in lower and info["official"].lower() not in lower:
                candidates.append(
                    {
                        "type": "scheme",
                        "id": scheme_id,
                        "label": info["official"],
                        "confidence": 0.84,
                        "reason": f'Matched informal spoken phrase "{phrase}"',
                    }
                )
                needs_clarification = True

    if needs_clarification and candidates:
        top_label = candidates[0]["label"]
        clarification_prompt = (
            f"Are you referring to {top_label}? "
            "I can check whether it is relevant to your household once you confirm."
        )
        return {
            "rawTranscript": raw_transcript,
            "normalizedText": f"Possible inquiry for {top_label}",
            "detectedLanguage": detected_lang,
            "intent": "ambiguous",
            "confidence": 0.64,
            "needsClarification": True,
            "clarificationPrompt": clarification_prompt,
            "candidates": candidates,
            "extractedEntities": {"matchedSchemeIds": [c["id"] for c in candidates]},
        }

    # Department creation intent
    if re.search(r"(create|add|setup|banao|banaye).*(department|vibhag)", lower):
        m = re.search(r"(?:create|add|setup)\s+(?:an?\s+)?([a-zA-Z\s]{3,40}?)\s+department", cleaned, re.I)
        dept_name = m.group(1).strip() if m else "Custom District"
        return {
            "rawTranscript": raw_transcript,
            "normalizedText": f"Create {dept_name} Department for Betul District",
            "detectedLanguage": detected_lang,
            "intent": "create_department",
            "confidence": 0.92,
            "needsClarification": False,
            "candidates": [
                {
                    "type": "action",
                    "id": "create_department",
                    "label": f"Create {dept_name} Department",
                    "confidence": 0.92,
                    "reason": "Administrative department creation instruction",
                }
            ],
            "extractedEntities": {"departmentName": dept_name},
        }

    if re.search(r"(incomplete|missing|pending).*(agriculture|krishi|data)", lower):
        return {
            "rawTranscript": raw_transcript,
            "normalizedText": cleaned,
            "detectedLanguage": detected_lang,
            "intent": "village_status_query",
            "confidence": 0.93,
            "needsClarification": False,
            "candidates": [],
            "extractedEntities": {"departmentCode": "AGR"},
        }

    if re.search(r"(pending|show).*(housing|pmay|awaas).*(application|form)", lower):
        return {
            "rawTranscript": raw_transcript,
            "normalizedText": cleaned,
            "detectedLanguage": detected_lang,
            "intent": "housing_applications_query",
            "confidence": 0.92,
            "needsClarification": False,
            "candidates": [],
            "extractedEntities": {"schemeCode": "PMAY-G"},
        }

    if re.search(r"(compare|tulna).*(school|education|shiksha)", lower):
        return {
            "rawTranscript": raw_transcript,
            "normalizedText": cleaned,
            "detectedLanguage": detected_lang,
            "intent": "compare_villages",
            "confidence": 0.9,
            "needsClarification": False,
            "candidates": [],
            "extractedEntities": {"departmentCode": "EDU"},
        }

    if re.search(
        r"(farmer|kisan|acre|graduate|employment|rojgar|naukri|scheme|yojana|eligible|pmay|ujjwala|ladli|ayushman)",
        lower,
    ):
        acres_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:acre|acres|एकड़)", lower)
        return {
            "rawTranscript": raw_transcript,
            "normalizedText": cleaned,
            "detectedLanguage": detected_lang,
            "intent": "scheme_discovery",
            "confidence": 0.9,
            "needsClarification": False,
            "candidates": [],
            "extractedEntities": {
                "isFarmer": bool(re.search(r"(farmer|kisan|किसान)", lower)),
                "landholdingAcres": float(acres_m.group(1)) if acres_m else None,
                "isGraduate": bool(re.search(r"(graduate|graduation|degree|स्नातक)", lower)),
                "seekingEmployment": bool(re.search(r"(employment|job|rojgar|naukri|skill|रोजगार)", lower)),
                "mentionsHousing": bool(re.search(r"(housing|pmay|awaas|kutcha|घर)", lower)),
            },
        }

    return {
        "rawTranscript": raw_transcript,
        "normalizedText": cleaned,
        "detectedLanguage": detected_lang,
        "intent": "general_help",
        "confidence": 0.72,
        "needsClarification": False,
        "candidates": [],
        "extractedEntities": {},
    }
