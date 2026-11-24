import crypto from 'node:crypto';
import type {
  AuditLogEntry,
  CitizenProfile,
  DataRecord,
  DataSchemaVersion,
  Department,
  GovernmentScheme,
  SchemeApplication,
  SystemRole,
  UploadedDocument,
  UserProfile,
  Village,
} from '@betul/shared-types';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export interface PendingAdminAction {
  token: string;
  userId: string;
  actionType: 'create_department';
  payload: Record<string, unknown>;
  expiresAt: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export const BETUL_DISTRICT_ID = 'dist-betul-421';

function createInitialVillages(): Village[] {
  return [
    {
      id: 'vil-khedi',
      districtId: BETUL_DISTRICT_ID,
      blockName: 'Betul',
      tehsilName: 'Betul',
      gramPanchayatName: 'Khedi Sawligarh',
      nameEn: 'Khedi Sawligarh',
      nameHi: 'खेड़ी सावलीगढ़',
      lgdCode: '488101',
      isPilotVillage: true,
      latitude: 21.9125,
      longitude: 77.9612,
      populationDemo: 4120,
      householdsDemo: 840,
      isDemoData: true,
      assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-hlt', 'dept-drw'],
      coordinatorUserId: 'user-field-1',
    },
    {
      id: 'vil-badora',
      districtId: BETUL_DISTRICT_ID,
      blockName: 'Betul',
      tehsilName: 'Betul',
      gramPanchayatName: 'Badora',
      nameEn: 'Badora',
      nameHi: 'बडोरा',
      lgdCode: '488102',
      isPilotVillage: true,
      latitude: 21.8841,
      longitude: 77.9015,
      populationDemo: 3250,
      householdsDemo: 675,
      isDemoData: true,
      assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-drw'],
      coordinatorUserId: 'user-field-1',
    },
    {
      id: 'vil-sohagpur',
      districtId: BETUL_DISTRICT_ID,
      blockName: 'Betul',
      tehsilName: 'Betul',
      gramPanchayatName: 'Sohagpur',
      nameEn: 'Sohagpur',
      nameHi: 'सोहागपुर',
      lgdCode: '488103',
      isPilotVillage: true,
      latitude: 21.934,
      longitude: 77.872,
      populationDemo: 2890,
      householdsDemo: 590,
      isDemoData: true,
      assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-hlt'],
    },
    {
      id: 'vil-betulbazar',
      districtId: BETUL_DISTRICT_ID,
      blockName: 'Betul',
      tehsilName: 'Betul',
      gramPanchayatName: 'Betul Bazar',
      nameEn: 'Betul Bazar',
      nameHi: 'बैतूल बाजार',
      lgdCode: '488104',
      isPilotVillage: true,
      latitude: 21.862,
      longitude: 77.9345,
      populationDemo: 5340,
      householdsDemo: 1120,
      isDemoData: true,
      assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-hlt', 'dept-wcd'],
    },
    {
      id: 'vil-jhallar',
      districtId: BETUL_DISTRICT_ID,
      blockName: 'Bhainsdehi',
      tehsilName: 'Bhainsdehi',
      gramPanchayatName: 'Jhallar',
      nameEn: 'Jhallar',
      nameHi: 'झल्लार',
      lgdCode: '488105',
      isPilotVillage: true,
      latitude: 21.745,
      longitude: 77.791,
      populationDemo: 2410,
      householdsDemo: 510,
      isDemoData: true,
      assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-trw', 'dept-drw'],
    },
  ];
}

function createInitialDepartments(): Department[] {
  const now = new Date().toISOString();
  const base: Array<[string, string, string, string, string, string, string[]]> = [
    ['dept-rev', 'REV', 'Revenue Administration', 'राजस्व प्रशासन', 'Revenue Administration', 'Land records, mutation, and revenue governance.', ['vil-khedi', 'vil-badora']],
    ['dept-pri', 'PRI', 'Panchayati Raj', 'पंचायती राज', 'Panchayati Raj', 'Gram Panchayat governance and local works.', ['vil-khedi', 'vil-badora', 'vil-sohagpur']],
    ['dept-rur', 'RUR', 'Rural Development', 'ग्रामीण विकास', 'Rural Development', 'Rural housing (PMAY-G), MGNREGA, and livelihoods.', ['vil-khedi', 'vil-badora', 'vil-betulbazar']],
    ['dept-agr', 'AGR', 'Agriculture', 'कृषि विभाग', 'Agriculture', 'Farmer welfare, crops, soil health, and irrigation.', ['vil-khedi', 'vil-badora', 'vil-sohagpur', 'vil-betulbazar', 'vil-jhallar']],
    ['dept-edu', 'EDU', 'Education', 'शिक्षा विभाग', 'Education', 'Schools, attendance, infrastructure, and scholarships.', ['vil-khedi', 'vil-badora', 'vil-sohagpur', 'vil-betulbazar', 'vil-jhallar']],
    ['dept-hlt', 'HLT', 'Health', 'स्वास्थ्य विभाग', 'Health', 'Primary health centres, maternal care, and immunization.', ['vil-khedi', 'vil-sohagpur', 'vil-betulbazar']],
    ['dept-wcd', 'WCD', 'Women and Child Development', 'महिला एवं बाल विकास', 'Women and Child Development', 'Anganwadi nutrition and women welfare.', ['vil-betulbazar']],
    ['dept-sje', 'SJE', 'Social Justice and Empowerment', 'सामाजिक न्याय एवं अधिकारिता', 'Social Justice and Empowerment', 'Pensions, disability support, and social security.', ['vil-khedi']],
    ['dept-fcs', 'FCS', 'Food and Civil Supplies', 'खाद्य एवं नागरिक आपूर्ति', 'Food and Civil Supplies', 'PDS ration shops and food security.', ['vil-khedi', 'vil-badora']],
    ['dept-drw', 'DRW', 'Drinking Water', 'पेयजल विभाग', 'Drinking Water', 'Jal Jeevan Mission, tap connections, and water quality.', ['vil-khedi', 'vil-badora', 'vil-jhallar']],
    ['dept-elc', 'ELC', 'Electricity', 'विद्युत विभाग', 'Electricity', 'Rural electrification, transformers, and feeder uptime.', ['vil-badora']],
    ['dept-pwd', 'PWD', 'Public Works', 'लोक निर्माण विभाग', 'Public Works', 'Rural roads, culverts, and public buildings.', ['vil-khedi']],
    ['dept-anh', 'ANH', 'Animal Husbandry', 'पशुपालन विभाग', 'Animal Husbandry', 'Livestock vaccination and dairy support.', ['vil-sohagpur']],
    ['dept-for', 'FOR', 'Forest', 'वन विभाग', 'Forest', 'Forest rights and minor forest produce.', ['vil-jhallar']],
    ['dept-irr', 'IRR', 'Irrigation', 'सिंचाई विभाग', 'Irrigation', 'Canals, check dams, and micro-irrigation.', ['vil-khedi', 'vil-jhallar']],
    ['dept-fsh', 'FSH', 'Fisheries', 'मत्स्य पालन', 'Fisheries', 'Village ponds and fisheries livelihood.', ['vil-badora']],
    ['dept-sde', 'SDE', 'Skill Development and Employment', 'कौशल विकास एवं रोजगार', 'Skill Development and Employment', 'Youth skilling, apprenticeships, and placement.', ['vil-betulbazar']],
    ['dept-trw', 'TRW', 'Tribal Welfare', 'जनजातीय कार्य विभाग', 'Tribal Welfare', 'Tribal hostels, scholarships, and welfare.', ['vil-jhallar']],
  ];

  return base.map(([id, code, nameEn, nameHi, category, descriptionEn, assignedVillageIds]) => ({
    id,
    districtId: BETUL_DISTRICT_ID,
    code,
    nameEn,
    nameHi,
    category,
    descriptionEn,
    descriptionHi: descriptionEn,
    headUserId: id === 'dept-agr' ? 'user-officer-agr' : undefined,
    headName: id === 'dept-agr' ? 'Rajesh Verma (Demo Dept Officer)' : undefined,
    isActive: true,
    assignedVillageIds,
    isDemoData: true,
    createdAt: now,
    updatedAt: now,
  }));
}

function createInitialSchemas(): DataSchemaVersion[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'schema-agr-v1',
      departmentId: 'dept-agr',
      schemaName: 'Village Crop & Irrigation Survey',
      version: 1,
      isActive: true,
      createdAt: now,
      createdBy: 'user-admin-1',
      fields: [
        { key: 'total_farmers', labelEn: 'Registered Farmers Count', labelHi: 'पंजीकृत किसानों की संख्या', type: 'number', required: true, min: 0 },
        { key: 'primary_crop', labelEn: 'Primary Crop', labelHi: 'मुख्य फसल', type: 'select', required: true, options: ['Soybean', 'Wheat', 'Maize', 'Gram', 'Cotton', 'Paddy'] },
        { key: 'irrigated_area_acres', labelEn: 'Irrigated Area (Acres)', labelHi: 'सिंचित क्षेत्र (एकड़)', type: 'number', required: true, min: 0, unit: 'acres' },
        { key: 'soil_health_cards_issued', labelEn: 'Soil Health Cards Issued', labelHi: 'जारी मृदा स्वास्थ्य कार्ड', type: 'number', required: false, min: 0 },
        { key: 'remarks', labelEn: 'Field Remarks', labelHi: 'फील्ड टिप्पणी', type: 'textarea', required: false },
      ],
    },
    {
      id: 'schema-edu-v1',
      departmentId: 'dept-edu',
      schemaName: 'School Infrastructure & Attendance Audit',
      version: 1,
      isActive: true,
      createdAt: now,
      createdBy: 'user-admin-1',
      fields: [
        { key: 'schools_count', labelEn: 'Government Schools Count', labelHi: 'सरकारी स्कूलों की संख्या', type: 'number', required: true, min: 0 },
        { key: 'functional_classrooms', labelEn: 'Functional Classrooms', labelHi: 'उपयोगी कक्षाएं', type: 'number', required: true, min: 0 },
        { key: 'drinking_water_available', labelEn: 'Clean Drinking Water Available', labelHi: 'स्वच्छ पेयजल उपलब्ध', type: 'boolean', required: true },
        { key: 'girls_toilet_functional', labelEn: 'Functional Girls Toilet', labelHi: 'बालिका शौचालय चालू', type: 'boolean', required: true },
        { key: 'enrolled_students', labelEn: 'Enrolled Students', labelHi: 'नामांकित छात्र', type: 'number', required: true, min: 0 },
      ],
    },
    {
      id: 'schema-rur-v1',
      departmentId: 'dept-rur',
      schemaName: 'PMAY-G Rural Housing Progress',
      version: 1,
      isActive: true,
      createdAt: now,
      createdBy: 'user-admin-1',
      fields: [
        { key: 'eligible_households', labelEn: 'Eligible Kutcha Households', labelHi: 'पात्र कच्चे मकान परिवार', type: 'number', required: true, min: 0 },
        { key: 'sanctioned_houses', labelEn: 'Sanctioned Houses', labelHi: 'स्वीकृत आवास', type: 'number', required: true, min: 0 },
        { key: 'completed_houses', labelEn: 'Completed Houses', labelHi: 'पूर्ण आवास', type: 'number', required: true, min: 0 },
        { key: 'pending_verification', labelEn: 'Pending Geo-Tag Verification', labelHi: 'लंबित जियो-टैग सत्यापन', type: 'number', required: true, min: 0 },
      ],
    },
  ];
}

function createInitialRecords(): DataRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'rec-1',
      departmentId: 'dept-agr',
      villageId: 'vil-khedi',
      schemaId: 'schema-agr-v1',
      schemaVersion: 1,
      submittedBy: 'user-field-1',
      submittedByName: 'Sunita Deshmukh (Demo Field Worker)',
      source: 'field_web',
      referenceDate: '2026-11-15',
      payload: {
        total_farmers: 482,
        primary_crop: 'Soybean',
        irrigated_area_acres: 640,
        soil_health_cards_issued: 390,
        remarks: 'Kharif survey completed (Demonstration Data).',
      },
      status: 'verified',
      verifierId: 'user-officer-agr',
      verifierNotes: 'Verified against block agriculture register (Demo).',
      version: 1,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rec-2',
      departmentId: 'dept-agr',
      villageId: 'vil-badora',
      schemaId: 'schema-agr-v1',
      schemaVersion: 1,
      submittedBy: 'user-field-1',
      submittedByName: 'Sunita Deshmukh (Demo Field Worker)',
      source: 'field_web',
      referenceDate: '2026-11-18',
      payload: {
        total_farmers: 345,
        primary_crop: 'Wheat',
        irrigated_area_acres: 410,
        soil_health_cards_issued: 210,
        remarks: 'Irrigation canal check pending (Demonstration Data).',
      },
      status: 'submitted',
      version: 1,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rec-3',
      departmentId: 'dept-edu',
      villageId: 'vil-khedi',
      schemaId: 'schema-edu-v1',
      schemaVersion: 1,
      submittedBy: 'user-field-1',
      submittedByName: 'Sunita Deshmukh (Demo Field Worker)',
      source: 'field_web',
      referenceDate: '2026-11-12',
      payload: {
        schools_count: 3,
        functional_classrooms: 14,
        drinking_water_available: true,
        girls_toilet_functional: true,
        enrolled_students: 412,
      },
      status: 'verified',
      verifierId: 'user-admin-1',
      version: 1,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rec-4',
      departmentId: 'dept-edu',
      villageId: 'vil-badora',
      schemaId: 'schema-edu-v1',
      schemaVersion: 1,
      submittedBy: 'user-field-1',
      submittedByName: 'Sunita Deshmukh (Demo Field Worker)',
      source: 'field_web',
      referenceDate: '2026-11-12',
      payload: {
        schools_count: 2,
        functional_classrooms: 9,
        drinking_water_available: true,
        girls_toilet_functional: false,
        enrolled_students: 295,
      },
      status: 'verified',
      verifierId: 'user-admin-1',
      version: 1,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rec-5',
      departmentId: 'dept-edu',
      villageId: 'vil-jhallar',
      schemaId: 'schema-edu-v1',
      schemaVersion: 1,
      submittedBy: 'user-admin-1',
      submittedByName: 'District Admin (Demo)',
      source: 'admin_entry',
      referenceDate: '2026-11-10',
      payload: {
        schools_count: 2,
        functional_classrooms: 7,
        drinking_water_available: false,
        girls_toilet_functional: true,
        enrolled_students: 228,
      },
      status: 'requires_correction',
      verifierNotes: 'Confirm handpump repair status before verification.',
      version: 1,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rec-6',
      departmentId: 'dept-rur',
      villageId: 'vil-khedi',
      schemaId: 'schema-rur-v1',
      schemaVersion: 1,
      submittedBy: 'user-field-1',
      submittedByName: 'Sunita Deshmukh (Demo Field Worker)',
      source: 'field_web',
      referenceDate: '2026-11-19',
      payload: {
        eligible_households: 68,
        sanctioned_houses: 45,
        completed_houses: 31,
        pending_verification: 14,
      },
      status: 'under_review',
      version: 1,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createInitialSchemes(): GovernmentScheme[] {
  return [
    {
      id: 'sch-pmayg',
      code: 'PMAY-G',
      nameEn: 'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)',
      nameHi: 'प्रधानमंत्री आवास योजना - ग्रामीण',
      aliases: ['pmay', 'pmayg', 'ghar wali yojana', 'awaas yojana', 'rural housing', 'makan yojana'],
      departmentCategory: 'Rural Development',
      level: 'central',
      summaryEn: 'Financial assistance for rural households living in kutcha or dilapidated houses to construct a pucca house.',
      summaryHi: 'कच्चे या जर्जर मकान में रहने वाले ग्रामीण परिवारों को पक्का मकान बनाने हेतु वित्तीय सहायता।',
      benefitDetailsEn: 'Unit assistance up to ₹1.20 lakh in plain areas (subject to official SECC verification and scheme guidelines).',
      benefitDetailsHi: 'मैदानी क्षेत्रों में ₹1.20 लाख तक की सहायता (आधिकारिक सत्यापन के अधीन)।',
      requiredDocuments: ['Aadhaar Card', 'Job Card / MGNREGA ID', 'Bank Passbook', 'SECC / Awaas+ Verification'],
      applicationUrl: 'https://pmayg.nic.in/',
      sourceDocument: 'MoRD PMAY-G Framework Guidelines',
      effectiveFrom: '2016-04-01',
      lastVerifiedDate: '2026-10-01',
      isActive: true,
      rules: [
        {
          field: 'housingStatus',
          operator: 'in',
          value: ['kutcha', 'homeless'],
          labelEn: 'Household currently lives in a kutcha house or is homeless',
          labelHi: 'परिवार कच्चे मकान में रहता है या बेघर है',
        },
        {
          field: 'housingStatus',
          operator: 'eq',
          value: 'pucca',
          labelEn: 'Exclusion: Already owns a pucca house',
          labelHi: 'अपवर्जन: पहले से पक्का मकान है',
          isExclusion: true,
        },
        {
          field: 'annualIncomeBand',
          operator: 'in',
          value: ['below_1L', '1L_to_2_5L'],
          labelEn: 'Household falls within rural low-income bracket',
          labelHi: 'परिवार निम्न आय वर्ग में आता है',
        },
      ],
    },
    {
      id: 'sch-pmkisan',
      code: 'PM-KISAN',
      nameEn: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      nameHi: 'प्रधानमंत्री किसान सम्मान निधि',
      aliases: ['pm kisan', 'kisan nidhi', 'kisan paisa', 'kheti yojana', 'farmer support'],
      departmentCategory: 'Agriculture',
      level: 'central',
      summaryEn: 'Direct income support to eligible landholding farmer families across India.',
      summaryHi: 'पात्र भूमिधारक किसान परिवारों को प्रत्यक्ष आय सहायता।',
      benefitDetailsEn: '₹6,000 per year in three equal installments directly to Aadhaar-seeded bank accounts.',
      benefitDetailsHi: 'तीन समान किश्तों में ₹6,000 प्रति वर्ष सीधे बैंक खाते में।',
      requiredDocuments: ['Aadhaar Card', 'Land Ownership Record (Khasra/Khatauni)', 'Bank Account (DBT enabled)'],
      applicationUrl: 'https://pmkisan.gov.in/',
      sourceDocument: 'Dept of Agriculture & Farmers Welfare Guidelines',
      effectiveFrom: '2019-02-01',
      lastVerifiedDate: '2026-10-15',
      isActive: true,
      rules: [
        {
          field: 'occupation',
          operator: 'in',
          value: ['farmer', 'agriculture', 'cultivator'],
          labelEn: 'Applicant occupation is Farmer / Cultivator',
          labelHi: 'आवेदक का व्यवसाय किसान है',
        },
        {
          field: 'landholdingAcres',
          operator: 'gte',
          value: 0.1,
          labelEn: 'Holds cultivable land (> 0 acres)',
          labelHi: 'कृषि योग्य भूमि उपलब्ध है',
        },
        {
          field: 'annualIncomeBand',
          operator: 'eq',
          value: 'above_5L',
          labelEn: 'Exclusion: High-income taxpayer bracket (requires tax status check)',
          labelHi: 'अपवर्जन: उच्च आयकर दाता वर्ग',
          isExclusion: true,
        },
      ],
    },
    {
      id: 'sch-ujjwala',
      code: 'PMUY',
      nameEn: 'Pradhan Mantri Ujjwala Yojana (LPG Connection)',
      nameHi: 'प्रधानमंत्री उज्ज्वला योजना',
      aliases: ['ujjwala', 'gas yojana', 'cylinder yojana', 'lpg'],
      departmentCategory: 'Food and Civil Supplies',
      level: 'central',
      summaryEn: 'Deposit-free LPG connections for adult women from eligible BPL / low-income households.',
      summaryHi: 'पात्र बीपीएल / निम्न आय परिवारों की वयस्क महिलाओं को निशुल्क एलपीजी कनेक्शन।',
      benefitDetailsEn: 'Deposit-free LPG connection with financial support for first refill and stove as per norms.',
      benefitDetailsHi: 'नियमानुसार निशुल्क गैस कनेक्शन और चूल्हा सहायता।',
      requiredDocuments: ['Aadhaar Card', 'Ration Card / BPL Proof', 'Bank Account', 'Address Proof'],
      applicationUrl: 'https://www.pmuy.gov.in/',
      sourceDocument: 'Ministry of Petroleum & Natural Gas PMUY 2.0',
      effectiveFrom: '2021-08-10',
      lastVerifiedDate: '2026-09-20',
      isActive: true,
      rules: [
        {
          field: 'gender',
          operator: 'eq',
          value: 'female',
          labelEn: 'Adult woman applicant',
          labelHi: 'वयस्क महिला आवेदक',
        },
        {
          field: 'age',
          operator: 'gte',
          value: 18,
          labelEn: 'Age 18 years or above',
          labelHi: 'आयु 18 वर्ष या अधिक',
        },
        {
          field: 'bplCardHolder',
          operator: 'eq',
          value: true,
          labelEn: 'BPL / priority household category',
          labelHi: 'बीपीएल / प्राथमिकता परिवार',
        },
      ],
    },
    {
      id: 'sch-ladli-behna',
      code: 'MP-LADLI-BEHNA',
      nameEn: 'Mukhyamantri Ladli Behna Yojana (MP)',
      nameHi: 'मुख्यमंत्री लाड़ली बहना योजना',
      aliases: ['ladli behna', 'mahila yojana', 'behna yojana'],
      departmentCategory: 'Women and Child Development',
      level: 'state',
      summaryEn: 'Monthly financial assistance for eligible women residents of Madhya Pradesh for economic self-reliance.',
      summaryHi: 'मध्य प्रदेश की पात्र महिलाओं के आर्थिक स्वावलंबन हेतु मासिक वित्तीय सहायता।',
      benefitDetailsEn: 'Direct monthly bank transfer as per current MP State Government notification.',
      benefitDetailsHi: 'म.प्र. शासन की अधिसूचना अनुसार मासिक डीबीटी सहायता।',
      requiredDocuments: ['Samagra ID', 'Aadhaar Card', 'DBT-enabled Bank Account', 'MP Domicile'],
      applicationUrl: 'https://cmladlibahna.mp.gov.in/',
      sourceDocument: 'MP WCD Department Official Guidelines',
      effectiveFrom: '2023-03-05',
      lastVerifiedDate: '2026-10-10',
      isActive: true,
      rules: [
        {
          field: 'gender',
          operator: 'eq',
          value: 'female',
          labelEn: 'Woman resident of Madhya Pradesh',
          labelHi: 'मध्य प्रदेश की महिला निवासी',
        },
        {
          field: 'age',
          operator: 'gte',
          value: 21,
          labelEn: 'Age 21 years or above',
          labelHi: 'आयु 21 वर्ष या अधिक',
        },
        {
          field: 'annualIncomeBand',
          operator: 'in',
          value: ['below_1L', '1L_to_2_5L'],
          labelEn: 'Annual family income up to ₹2.5 lakh',
          labelHi: 'वार्षिक पारिवारिक आय ₹2.5 लाख तक',
        },
      ],
    },
    {
      id: 'sch-mp-seekho-kamao',
      code: 'MP-MMSKY',
      nameEn: 'Mukhyamantri Seekho Kamao Yojana (Youth Skill & Employment)',
      nameHi: 'मुख्यमंत्री सीखो कमाओ योजना',
      aliases: ['seekho kamao', 'rojgar yojana', 'employment', 'graduate job', 'skill development', 'naukri'],
      departmentCategory: 'Skill Development and Employment',
      level: 'state',
      summaryEn: 'On-the-job skill training with monthly stipend for educated youth in Madhya Pradesh.',
      summaryHi: 'मध्य प्रदेश के शिक्षित युवाओं को मासिक स्टाइपेंड के साथ कौशल प्रशिक्षण।',
      benefitDetailsEn: 'Stipend of ₹8,000–₹10,000/month during training based on educational qualification (12th / ITI / Graduate).',
      benefitDetailsHi: 'शैक्षणिक योग्यता अनुसार प्रशिक्षण के दौरान ₹8,000–₹10,000 प्रतिमाह स्टाइपेंड।',
      requiredDocuments: ['Samagra ID', 'Aadhaar Card', 'Education Marksheet (12th/ITI/Graduate)', 'Bank Account'],
      applicationUrl: 'https://mmsky.mp.gov.in/',
      sourceDocument: 'MP Technical Education & Skill Development Dept',
      effectiveFrom: '2023-07-01',
      lastVerifiedDate: '2026-10-05',
      isActive: true,
      rules: [
        {
          field: 'age',
          operator: 'gte',
          value: 18,
          labelEn: 'Age 18 to 29 years',
          labelHi: 'आयु 18 से 29 वर्ष',
        },
        {
          field: 'age',
          operator: 'lte',
          value: 29,
          labelEn: 'Age not exceeding 29 years',
          labelHi: 'आयु 29 वर्ष से अधिक नहीं',
        },
        {
          field: 'seekingEmployment',
          operator: 'eq',
          value: true,
          labelEn: 'Actively seeking skill training / employment',
          labelHi: 'कौशल प्रशिक्षण / रोजगार की तलाश में',
        },
        {
          field: 'educationLevel',
          operator: 'in',
          value: ['12th', 'iti', 'diploma', 'graduate', 'postgraduate'],
          labelEn: 'Minimum 12th / ITI / Diploma / Graduate qualification',
          labelHi: 'न्यूनतम 12वीं / आईटीआई / स्नातक योग्यता',
        },
      ],
    },
    {
      id: 'sch-ayushman',
      code: 'PMJAY',
      nameEn: 'Ayushman Bharat PM-JAY Healthcare Cover',
      nameHi: 'आयुष्मान भारत स्वास्थ्य सुरक्षा योजना',
      aliases: ['ayushman', 'health card', 'hospital yojana', 'ilaj yojana'],
      departmentCategory: 'Health',
      level: 'central',
      summaryEn: 'Cashless secondary and tertiary hospitalization coverage for eligible families.',
      summaryHi: 'पात्र परिवारों के लिए कैशलेस अस्पताल उपचार सुविधा।',
      benefitDetailsEn: 'Up to ₹5 lakh per family per year at empanelled hospitals.',
      benefitDetailsHi: 'सूचीबद्ध अस्पतालों में प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस इलाज।',
      requiredDocuments: ['Aadhaar Card', 'Samagra / Ration Card', 'PMJAY Eligibility Verification'],
      applicationUrl: 'https://beneficiary.nha.gov.in/',
      sourceDocument: 'National Health Authority Guidelines',
      effectiveFrom: '2018-09-23',
      lastVerifiedDate: '2026-10-12',
      isActive: true,
      rules: [
        {
          field: 'bplCardHolder',
          operator: 'eq',
          value: true,
          labelEn: 'BPL / SECC / Priority household beneficiary',
          labelHi: 'बीपीएल / प्राथमिकता परिवार लाभार्थी',
        },
      ],
    },
    {
      id: 'sch-legacy-inactive',
      code: 'OLD-SOLAR-2021',
      nameEn: 'Expired Pilot Solar Lantern Distribution (2021)',
      nameHi: 'समाप्त सोलर लालटेन वितरण योजना (2021)',
      aliases: ['solar lantern', 'old solar'],
      departmentCategory: 'Electricity',
      level: 'district',
      summaryEn: 'Historical 2021 pilot scheme — closed and no longer accepting applications.',
      summaryHi: '2021 की समाप्त योजना — अब बंद है।',
      benefitDetailsEn: 'Closed.',
      benefitDetailsHi: 'बंद।',
      requiredDocuments: [],
      applicationUrl: '',
      sourceDocument: 'Betul Archive Circular 2021',
      effectiveFrom: '2021-01-01',
      effectiveUntil: '2022-03-31',
      lastVerifiedDate: '2025-01-10',
      isActive: false,
      rules: [],
    },
  ];
}

function createInitialUsers(): StoredUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'user-admin-1',
      email: 'collector.betul@demo.gov.in',
      fullName: 'Ananya Sharma (Demo District Admin)',
      phone: '9826000001',
      track: 'government',
      role: 'district_admin',
      requestedDesignation: 'District Administrator',
      verificationStatus: 'approved',
      districtId: BETUL_DISTRICT_ID,
      departmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-hlt'],
      assignedVillageIds: ['vil-khedi', 'vil-badora', 'vil-sohagpur', 'vil-betulbazar', 'vil-jhallar'],
      preferredLanguage: 'en',
      isDemoData: true,
      passwordHash: hashPassword('BetulAdmin@2026'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-officer-agr',
      email: 'agri.officer@demo.gov.in',
      fullName: 'Rajesh Verma (Demo Agriculture Officer)',
      phone: '9826000002',
      track: 'government',
      role: 'department_officer',
      requestedDesignation: 'Department Officer - Agriculture',
      verificationStatus: 'approved',
      districtId: BETUL_DISTRICT_ID,
      departmentIds: ['dept-agr'],
      assignedVillageIds: ['vil-khedi', 'vil-badora', 'vil-sohagpur'],
      preferredLanguage: 'en',
      isDemoData: true,
      passwordHash: hashPassword('BetulOfficer@2026'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-field-1',
      email: 'field.khedi@demo.gov.in',
      fullName: 'Sunita Deshmukh (Demo Field Employee)',
      phone: '9826000003',
      track: 'field',
      role: 'field_employee',
      requestedDesignation: 'Village Data Collector',
      verificationStatus: 'approved',
      districtId: BETUL_DISTRICT_ID,
      departmentIds: ['dept-agr', 'dept-edu', 'dept-rur'],
      assignedVillageIds: ['vil-khedi', 'vil-badora'],
      preferredLanguage: 'hi',
      isDemoData: true,
      passwordHash: hashPassword('BetulField@2026'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-citizen-1',
      email: 'ramesh.farmer@demo.in',
      fullName: 'Ramesh Patel (Demo Citizen)',
      phone: '9826000004',
      track: 'citizen',
      role: 'citizen',
      verificationStatus: 'approved',
      districtId: BETUL_DISTRICT_ID,
      departmentIds: [],
      assignedVillageIds: ['vil-khedi'],
      preferredLanguage: 'hi',
      isDemoData: true,
      passwordHash: hashPassword('BetulCitizen@2026'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-pending-1',
      email: 'pending.officer@demo.gov.in',
      fullName: 'Vikram Tiwari (Pending Verification)',
      phone: '9826000005',
      track: 'government',
      role: 'citizen', // Never granted privileged role until verified!
      requestedDesignation: 'Block Officer',
      verificationStatus: 'pending_verification',
      districtId: BETUL_DISTRICT_ID,
      departmentIds: [],
      assignedVillageIds: [],
      preferredLanguage: 'en',
      isDemoData: true,
      passwordHash: hashPassword('BetulPending@2026'),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export class PlatformStore {
  users: StoredUser[] = [];
  villages: Village[] = [];
  departments: Department[] = [];
  schemas: DataSchemaVersion[] = [];
  records: DataRecord[] = [];
  schemes: GovernmentScheme[] = [];
  citizenProfiles: Map<string, CitizenProfile> = new Map();
  schemeApplications: SchemeApplication[] = [];
  documents: UploadedDocument[] = [];
  auditLogs: AuditLogEntry[] = [];
  pendingActions: Map<string, PendingAdminAction> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.users = createInitialUsers();
    this.villages = createInitialVillages();
    this.departments = createInitialDepartments();
    this.schemas = createInitialSchemas();
    this.records = createInitialRecords();
    this.schemes = createInitialSchemes();
    this.citizenProfiles = new Map([
      [
        'user-citizen-1',
        {
          id: 'cit-1',
          userId: 'user-citizen-1',
          fullName: 'Ramesh Patel (Demo Citizen)',
          age: 42,
          gender: 'male',
          districtId: BETUL_DISTRICT_ID,
          villageId: 'vil-khedi',
          occupation: 'farmer',
          educationLevel: '10th',
          householdSize: 5,
          annualIncomeBand: 'below_1L',
          landholdingAcres: 2,
          housingStatus: 'kutcha',
          category: 'obc',
          bplCardHolder: true,
          seekingEmployment: false,
          consentGiven: true,
          updatedAt: new Date().toISOString(),
        },
      ],
    ]);
    this.schemeApplications = [
      {
        id: 'app-1',
        citizenUserId: 'user-citizen-1',
        schemeId: 'sch-pmayg',
        schemeName: 'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)',
        villageId: 'vil-khedi',
        status: 'under_review',
        submittedAt: new Date().toISOString(),
        notes: 'Demo housing application pending Panchayat verification.',
      },
    ];
    this.documents = [];
    this.auditLogs = [];
    this.pendingActions = new Map();
  }

  addAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): void {
    this.auditLogs.unshift({
      ...entry,
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    });
    if (this.auditLogs.length > 500) {
      this.auditLogs.length = 500;
    }
  }

  toPublicUser(user: StoredUser): UserProfile {
    const { passwordHash: _ignored, ...pub } = user;
    return pub;
  }

  findUserByRole(role: SystemRole): StoredUser | undefined {
    return this.users.find((u) => u.role === role && u.verificationStatus === 'approved');
  }
}

export const store = new PlatformStore();
