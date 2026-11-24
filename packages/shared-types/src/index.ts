export type LanguageCode = 'en' | 'hi';

export type RegistrationTrack = 'government' | 'citizen' | 'field';

export type SystemRole =
  | 'district_admin'
  | 'department_head'
  | 'department_officer'
  | 'block_officer'
  | 'tehsil_officer'
  | 'village_coordinator'
  | 'field_employee'
  | 'data_verification_officer'
  | 'citizen';

export type AccountVerificationStatus =
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'revoked';

export type RecordStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'requires_correction'
  | 'verified'
  | 'rejected'
  | 'archived';

export type SchemeLevel = 'central' | 'state' | 'district';

export type EligibilityOutcome =
  | 'potentially_eligible'
  | 'additional_info_required'
  | 'likely_ineligible'
  | 'application_submitted'
  | 'application_approved'
  | 'benefit_received';

export type DocumentProcessingStatus =
  | 'uploaded'
  | 'scanning'
  | 'extracting'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'failed';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  track: RegistrationTrack;
  role: SystemRole;
  requestedDesignation?: string;
  verificationStatus: AccountVerificationStatus;
  districtId: string;
  departmentIds: string[];
  assignedVillageIds: string[];
  preferredLanguage: LanguageCode;
  isDemoData?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Village {
  id: string;
  districtId: string;
  blockName: string;
  tehsilName: string;
  gramPanchayatName: string;
  nameEn: string;
  nameHi: string;
  lgdCode: string;
  isPilotVillage: boolean;
  latitude: number;
  longitude: number;
  populationDemo?: number;
  householdsDemo?: number;
  isDemoData: boolean;
  assignedDepartmentIds: string[];
  coordinatorUserId?: string;
}

export interface DynamicFormField {
  key: string;
  labelEn: string;
  labelHi: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
  helpTextEn?: string;
  helpTextHi?: string;
}

export interface DataSchemaVersion {
  id: string;
  departmentId: string;
  schemaName: string;
  version: number;
  fields: DynamicFormField[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Department {
  id: string;
  districtId: string;
  code: string;
  nameEn: string;
  nameHi: string;
  category: string;
  descriptionEn: string;
  descriptionHi: string;
  headUserId?: string;
  headName?: string;
  isActive: boolean;
  assignedVillageIds: string[];
  isDemoData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataRecord {
  id: string;
  departmentId: string;
  villageId: string;
  schemaId: string;
  schemaVersion: number;
  submittedBy: string;
  submittedByName: string;
  source: 'field_web' | 'offline_sync' | 'document_extraction' | 'admin_entry';
  referenceDate: string;
  payload: Record<string, unknown>;
  status: RecordStatus;
  verifierId?: string;
  verifierNotes?: string;
  version: number;
  isDemoData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CitizenProfile {
  id: string;
  userId: string;
  fullName: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  districtId: string;
  villageId?: string;
  occupation?: string;
  educationLevel?: string;
  householdSize?: number;
  annualIncomeBand?: 'below_1L' | '1L_to_2_5L' | '2_5L_to_5L' | 'above_5L';
  landholdingAcres?: number;
  housingStatus?: 'kutcha' | 'semi_pucca' | 'pucca' | 'homeless';
  category?: 'general' | 'sc' | 'st' | 'obc';
  bplCardHolder?: boolean;
  isSeniorCitizen?: boolean;
  isWomanHeadOfHousehold?: boolean;
  seekingEmployment?: boolean;
  consentGiven: boolean;
  updatedAt: string;
}

export interface SchemeRuleCondition {
  field: keyof CitizenProfile;
  operator: 'eq' | 'neq' | 'lte' | 'gte' | 'in' | 'exists';
  value: string | number | boolean | Array<string | number>;
  labelEn: string;
  labelHi: string;
  isExclusion?: boolean;
}

export interface GovernmentScheme {
  id: string;
  code: string;
  nameEn: string;
  nameHi: string;
  aliases: string[];
  departmentCategory: string;
  level: SchemeLevel;
  summaryEn: string;
  summaryHi: string;
  benefitDetailsEn: string;
  benefitDetailsHi: string;
  requiredDocuments: string[];
  applicationUrl: string;
  sourceDocument: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  lastVerifiedDate: string;
  isActive: boolean;
  rules: SchemeRuleCondition[];
}

export interface SchemeMatchResult {
  scheme: GovernmentScheme;
  outcome: EligibilityOutcome;
  confidence: number;
  matchedConditions: string[];
  failedConditions: string[];
  missingFields: string[];
  disclaimer: string;
}

export interface SchemeApplication {
  id: string;
  citizenUserId: string;
  schemeId: string;
  schemeName: string;
  villageId?: string;
  status: 'application_submitted' | 'under_review' | 'application_approved' | 'rejected' | 'benefit_received';
  submittedAt: string;
  notes?: string;
}

export interface UploadedDocument {
  id: string;
  uploadedBy: string;
  departmentId?: string;
  villageId?: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  category: string;
  languageDetected: string;
  extractedText: string;
  extractedFields: Record<string, unknown>;
  extractionConfidence: number;
  processingStatus: DocumentProcessingStatus;
  verificationStatus: 'pending_review' | 'verified' | 'rejected';
  verifierId?: string;
  verifierNotes?: string;
  warnings: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  actorRole: SystemRole;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'denied' | 'error';
  details: Record<string, unknown>;
  createdAt: string;
}
