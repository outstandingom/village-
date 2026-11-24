import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(120),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  track: z.enum(['government', 'citizen', 'field']),
  requestedDesignation: z.string().max(100).optional(),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  villageId: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, _ or -'),
  nameEn: z.string().min(2).max(120),
  nameHi: z.string().min(2).max(120),
  category: z.string().min(2).max(100),
  descriptionEn: z.string().min(5).max(600),
  descriptionHi: z.string().max(600).optional().default(''),
  headUserId: z.string().optional(),
  assignedVillageIds: z.array(z.string()).default([]),
});

export const dynamicFieldSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'Field key must be snake_case'),
  labelEn: z.string().min(2).max(120),
  labelHi: z.string().min(1).max(120),
  type: z.enum(['text', 'number', 'select', 'date', 'boolean', 'textarea']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
  helpTextEn: z.string().optional(),
  helpTextHi: z.string().optional(),
});

export const createSchemaVersionSchema = z.object({
  departmentId: z.string().min(1),
  schemaName: z.string().min(3).max(120),
  fields: z.array(dynamicFieldSchema).min(1).max(50),
});

export const submitDataRecordSchema = z.object({
  departmentId: z.string().min(1),
  villageId: z.string().min(1),
  schemaId: z.string().min(1),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format'),
  source: z.enum(['field_web', 'offline_sync', 'document_extraction', 'admin_entry']).default('field_web'),
  payload: z.record(z.unknown()),
  submitNow: z.boolean().default(true),
});

export const verifyRecordSchema = z.object({
  decision: z.enum(['under_review', 'requires_correction', 'verified', 'rejected']),
  notes: z.string().max(1000).optional(),
});

export const citizenProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  age: z.coerce.number().int().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  villageId: z.string().optional(),
  occupation: z.string().max(100).optional(),
  educationLevel: z.string().max(100).optional(),
  householdSize: z.coerce.number().int().min(1).max(30).optional(),
  annualIncomeBand: z.enum(['below_1L', '1L_to_2_5L', '2_5L_to_5L', 'above_5L']).optional(),
  landholdingAcres: z.coerce.number().min(0).max(500).optional(),
  housingStatus: z.enum(['kutcha', 'semi_pucca', 'pucca', 'homeless']).optional(),
  category: z.enum(['general', 'sc', 'st', 'obc']).optional(),
  bplCardHolder: z.boolean().optional(),
  isSeniorCitizen: z.boolean().optional(),
  isWomanHeadOfHousehold: z.boolean().optional(),
  seekingEmployment: z.boolean().optional(),
  consentGiven: z.boolean().refine((v) => v === true, 'Consent is required to evaluate schemes'),
});

export const aiQuerySchema = z.object({
  message: z.string().min(1).max(2000),
  language: z.enum(['en', 'hi']).default('en'),
  conversationId: z.string().optional(),
  confirmedActionToken: z.string().optional(),
});

export const voiceNormalizeSchema = z.object({
  rawTranscript: z.string().min(1).max(4000),
  languageHint: z.enum(['en', 'hi', 'hinglish', 'auto']).default('auto'),
});
