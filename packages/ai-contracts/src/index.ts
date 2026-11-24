export interface VoiceNormalizationRequest {
  rawTranscript: string;
  languageHint: 'en' | 'hi' | 'hinglish' | 'auto';
}

export interface VoiceCandidateMatch {
  type: 'scheme' | 'department' | 'village' | 'action';
  id: string;
  label: string;
  confidence: number;
  reason: string;
}

export interface VoiceNormalizationResponse {
  rawTranscript: string;
  normalizedText: string;
  detectedLanguage: 'en' | 'hi' | 'hinglish';
  intent:
    | 'create_department'
    | 'scheme_discovery'
    | 'village_status_query'
    | 'housing_applications_query'
    | 'compare_villages'
    | 'general_help'
    | 'ambiguous';
  confidence: number;
  needsClarification: boolean;
  clarificationPrompt?: string;
  candidates: VoiceCandidateMatch[];
  extractedEntities: Record<string, unknown>;
}

export interface ProposedAdminAction {
  actionToken: string;
  actionType: 'create_department';
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  requiresAdminRole: boolean;
}

export interface AssistantCitation {
  source: string;
  timestamp: string;
  scope: string;
}

export interface AssistantResponse {
  conversationId: string;
  reply: string;
  intent: string;
  confidence: number;
  needsClarification: boolean;
  clarificationOptions?: string[];
  proposedAction?: ProposedAdminAction;
  executedAction?: {
    actionType: string;
    resourceId: string;
    summary: string;
  };
  citations: AssistantCitation[];
  telemetry: {
    provider: string;
    model: string;
    latencyMs: number;
    estimatedTokens: number;
    cacheHit: boolean;
  };
}

export interface DocumentExtractionResponse {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  category: string;
  languageDetected: string;
  extractedText: string;
  extractedFields: Record<string, unknown>;
  extractionConfidence: number;
  warnings: string[];
  promptInjectionDetected: boolean;
}
