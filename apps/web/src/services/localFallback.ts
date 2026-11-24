import type { AssistantResponse } from '@betul/ai-contracts';
import type {
  AuditLogEntry,
  CitizenProfile,
  DataRecord,
  DataSchemaVersion,
  Department,
  GovernmentScheme,
  SchemeApplication,
  SchemeMatchResult,
  UploadedDocument,
  UserProfile,
  Village,
} from '@betul/shared-types';

const BETUL_DISTRICT_ID = 'dist-betul-421';

export const DEMO_USERS: Record<string, UserProfile> = {
  'collector.betul@demo.gov.in': {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'agri.officer@demo.gov.in': {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'field.khedi@demo.gov.in': {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'ramesh.farmer@demo.in': {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const now = new Date().toISOString();

const villages: Village[] = [
  { id: 'vil-khedi', districtId: BETUL_DISTRICT_ID, blockName: 'Betul', tehsilName: 'Betul', gramPanchayatName: 'Khedi Sawligarh', nameEn: 'Khedi Sawligarh', nameHi: 'खेड़ी सावलीगढ़', lgdCode: '488101', isPilotVillage: true, latitude: 21.9125, longitude: 77.9612, isDemoData: true, assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-hlt', 'dept-drw'] },
  { id: 'vil-badora', districtId: BETUL_DISTRICT_ID, blockName: 'Betul', tehsilName: 'Betul', gramPanchayatName: 'Badora', nameEn: 'Badora', nameHi: 'बडोरा', lgdCode: '488102', isPilotVillage: true, latitude: 21.8841, longitude: 77.9015, isDemoData: true, assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-drw'] },
  { id: 'vil-sohagpur', districtId: BETUL_DISTRICT_ID, blockName: 'Betul', tehsilName: 'Betul', gramPanchayatName: 'Sohagpur', nameEn: 'Sohagpur', nameHi: 'सोहागपुर', lgdCode: '488103', isPilotVillage: true, latitude: 21.934, longitude: 77.872, isDemoData: true, assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-hlt'] },
  { id: 'vil-betulbazar', districtId: BETUL_DISTRICT_ID, blockName: 'Betul', tehsilName: 'Betul', gramPanchayatName: 'Betul Bazar', nameEn: 'Betul Bazar', nameHi: 'बैतूल बाजार', lgdCode: '488104', isPilotVillage: true, latitude: 21.862, longitude: 77.9345, isDemoData: true, assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-rur', 'dept-hlt', 'dept-wcd'] },
  { id: 'vil-jhallar', districtId: BETUL_DISTRICT_ID, blockName: 'Bhainsdehi', tehsilName: 'Bhainsdehi', gramPanchayatName: 'Jhallar', nameEn: 'Jhallar', nameHi: 'झल्लार', lgdCode: '488105', isPilotVillage: true, latitude: 21.745, longitude: 77.791, isDemoData: true, assignedDepartmentIds: ['dept-agr', 'dept-edu', 'dept-trw', 'dept-drw'] },
];

const departments: Department[] = [
  ['dept-rev', 'REV', 'Revenue Administration', 'राजस्व प्रशासन'],
  ['dept-pri', 'PRI', 'Panchayati Raj', 'पंचायती राज'],
  ['dept-rur', 'RUR', 'Rural Development', 'ग्रामीण विकास'],
  ['dept-agr', 'AGR', 'Agriculture', 'कृषि विभाग'],
  ['dept-edu', 'EDU', 'Education', 'शिक्षा विभाग'],
  ['dept-hlt', 'HLT', 'Health', 'स्वास्थ्य विभाग'],
  ['dept-wcd', 'WCD', 'Women and Child Development', 'महिला एवं बाल विकास'],
  ['dept-sje', 'SJE', 'Social Justice and Empowerment', 'सामाजिक न्याय एवं अधिकारिता'],
  ['dept-fcs', 'FCS', 'Food and Civil Supplies', 'खाद्य एवं नागरिक आपूर्ति'],
  ['dept-drw', 'DRW', 'Drinking Water', 'पेयजल विभाग'],
  ['dept-elc', 'ELC', 'Electricity', 'विद्युत विभाग'],
  ['dept-pwd', 'PWD', 'Public Works', 'लोक निर्माण विभाग'],
  ['dept-anh', 'ANH', 'Animal Husbandry', 'पशुपालन विभाग'],
  ['dept-for', 'FOR', 'Forest', 'वन विभाग'],
  ['dept-irr', 'IRR', 'Irrigation', 'सिंचाई विभाग'],
  ['dept-fsh', 'FSH', 'Fisheries', 'मत्स्य पालन'],
  ['dept-sde', 'SDE', 'Skill Development and Employment', 'कौशल विकास एवं रोजगार'],
  ['dept-trw', 'TRW', 'Tribal Welfare', 'जनजातीय कार्य विभाग'],
].map(([id, code, nameEn, nameHi]) => ({
  id,
  districtId: BETUL_DISTRICT_ID,
  code,
  nameEn,
  nameHi,
  category: nameEn,
  descriptionEn: `${nameEn} services and village data tracking for Betul District.`,
  descriptionHi: `${nameHi} सेवाएं और ग्राम डेटा ट्रैकिंग।`,
  isActive: true,
  assignedVillageIds: ['vil-khedi', 'vil-badora'],
  isDemoData: true,
  createdAt: now,
  updatedAt: now,
}));

const schemas: DataSchemaVersion[] = [
  {
    id: 'schema-agr-v1',
    departmentId: 'dept-agr',
    schemaName: 'Village Crop & Irrigation Survey',
    version: 1,
    isActive: true,
    createdAt: now,
    createdBy: 'user-admin-1',
    fields: [
      { key: 'total_farmers', labelEn: 'Registered Farmers Count', labelHi: 'पंजीकृत किसान', type: 'number', required: true, min: 0 },
      { key: 'primary_crop', labelEn: 'Primary Crop', labelHi: 'मुख्य फसल', type: 'select', required: true, options: ['Soybean', 'Wheat', 'Maize', 'Gram', 'Cotton'] },
      { key: 'irrigated_area_acres', labelEn: 'Irrigated Area (Acres)', labelHi: 'सिंचित क्षेत्र (एकड़)', type: 'number', required: true, min: 0 },
      { key: 'remarks', labelEn: 'Field Remarks', labelHi: 'टिप्पणी', type: 'textarea', required: false },
    ],
  },
  {
    id: 'schema-edu-v1',
    departmentId: 'dept-edu',
    schemaName: 'School Infrastructure Audit',
    version: 1,
    isActive: true,
    createdAt: now,
    createdBy: 'user-admin-1',
    fields: [
      { key: 'schools_count', labelEn: 'Government Schools Count', labelHi: 'सरकारी स्कूल', type: 'number', required: true, min: 0 },
      { key: 'functional_classrooms', labelEn: 'Functional Classrooms', labelHi: 'कक्षाएं', type: 'number', required: true, min: 0 },
      { key: 'drinking_water_available', labelEn: 'Clean Drinking Water Available', labelHi: 'स्वच्छ पेयजल', type: 'boolean', required: true },
    ],
  },
];

const records: DataRecord[] = [
  { id: 'rec-1', departmentId: 'dept-agr', villageId: 'vil-khedi', schemaId: 'schema-agr-v1', schemaVersion: 1, submittedBy: 'user-field-1', submittedByName: 'Sunita Deshmukh (Demo)', source: 'field_web', referenceDate: '2026-11-15', payload: { total_farmers: 482, primary_crop: 'Soybean', irrigated_area_acres: 640 }, status: 'verified', version: 1, isDemoData: true, createdAt: now, updatedAt: now },
  { id: 'rec-2', departmentId: 'dept-agr', villageId: 'vil-badora', schemaId: 'schema-agr-v1', schemaVersion: 1, submittedBy: 'user-field-1', submittedByName: 'Sunita Deshmukh (Demo)', source: 'field_web', referenceDate: '2026-11-18', payload: { total_farmers: 345, primary_crop: 'Wheat', irrigated_area_acres: 410 }, status: 'submitted', version: 1, isDemoData: true, createdAt: now, updatedAt: now },
  { id: 'rec-3', departmentId: 'dept-edu', villageId: 'vil-khedi', schemaId: 'schema-edu-v1', schemaVersion: 1, submittedBy: 'user-field-1', submittedByName: 'Sunita Deshmukh (Demo)', source: 'field_web', referenceDate: '2026-11-12', payload: { schools_count: 3, functional_classrooms: 14, drinking_water_available: true }, status: 'verified', version: 1, isDemoData: true, createdAt: now, updatedAt: now },
];

const schemes: GovernmentScheme[] = [
  {
    id: 'sch-pmayg', code: 'PMAY-G', nameEn: 'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)', nameHi: 'प्रधानमंत्री आवास योजना - ग्रामीण', aliases: ['pmay', 'ghar wali yojana'], departmentCategory: 'Rural Development', level: 'central', summaryEn: 'Assistance for rural households in kutcha houses to construct a pucca house.', summaryHi: 'कच्चे मकान वाले ग्रामीण परिवारों को पक्का मकान हेतु सहायता।', benefitDetailsEn: 'Up to ₹1.20 lakh in plain areas (subject to official verification).', benefitDetailsHi: '₹1.20 लाख तक सहायता।', requiredDocuments: ['Aadhaar', 'Bank Passbook', 'SECC/Awaas+'], applicationUrl: 'https://pmayg.nic.in/', sourceDocument: 'MoRD Guidelines', effectiveFrom: '2016-04-01', lastVerifiedDate: '2026-10-01', isActive: true,
    rules: [
      { field: 'housingStatus', operator: 'in', value: ['kutcha', 'homeless'], labelEn: 'Lives in kutcha house or homeless', labelHi: 'कच्चे मकान में निवास' },
      { field: 'annualIncomeBand', operator: 'in', value: ['below_1L', '1L_to_2_5L'], labelEn: 'Low-income rural household', labelHi: 'निम्न आय परिवार' },
    ],
  },
  {
    id: 'sch-pmkisan', code: 'PM-KISAN', nameEn: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', nameHi: 'प्रधानमंत्री किसान सम्मान निधि', aliases: ['pm kisan'], departmentCategory: 'Agriculture', level: 'central', summaryEn: 'Direct income support to landholding farmer families.', summaryHi: 'भूमिधारक किसान परिवारों को प्रत्यक्ष आय सहायता।', benefitDetailsEn: '₹6,000/year in three installments via DBT.', benefitDetailsHi: '₹6,000 प्रति वर्ष डीबीटी।', requiredDocuments: ['Aadhaar', 'Khasra/Khatauni', 'Bank Account'], applicationUrl: 'https://pmkisan.gov.in/', sourceDocument: 'MoAFW Guidelines', effectiveFrom: '2019-02-01', lastVerifiedDate: '2026-10-15', isActive: true,
    rules: [
      { field: 'occupation', operator: 'in', value: ['farmer', 'agriculture'], labelEn: 'Occupation is Farmer', labelHi: 'व्यवसाय किसान है' },
      { field: 'landholdingAcres', operator: 'gte', value: 0.1, labelEn: 'Holds cultivable land', labelHi: 'कृषि भूमि उपलब्ध है' },
    ],
  },
  {
    id: 'sch-ladli-behna', code: 'MP-LADLI-BEHNA', nameEn: 'Mukhyamantri Ladli Behna Yojana (MP)', nameHi: 'मुख्यमंत्री लाड़ली बहना योजना', aliases: ['ladli behna'], departmentCategory: 'Women and Child Development', level: 'state', summaryEn: 'Monthly financial support for eligible women residents of Madhya Pradesh.', summaryHi: 'म.प्र. की पात्र महिलाओं हेतु मासिक सहायता।', benefitDetailsEn: 'Direct monthly bank transfer as per MP Govt notification.', benefitDetailsHi: 'मासिक डीबीटी सहायता।', requiredDocuments: ['Samagra ID', 'Aadhaar', 'Bank Account'], applicationUrl: 'https://cmladlibahna.mp.gov.in/', sourceDocument: 'MP WCD Guidelines', effectiveFrom: '2023-03-05', lastVerifiedDate: '2026-10-10', isActive: true,
    rules: [
      { field: 'gender', operator: 'eq', value: 'female', labelEn: 'Woman applicant', labelHi: 'महिला आवेदक' },
      { field: 'age', operator: 'gte', value: 21, labelEn: 'Age 21 or above', labelHi: 'आयु 21+ वर्ष' },
    ],
  },
  {
    id: 'sch-mp-seekho-kamao', code: 'MP-MMSKY', nameEn: 'Mukhyamantri Seekho Kamao Yojana', nameHi: 'मुख्यमंत्री सीखो कमाओ योजना', aliases: ['seekho kamao', 'employment'], departmentCategory: 'Skill Development and Employment', level: 'state', summaryEn: 'Skill training with monthly stipend for youth in Madhya Pradesh.', summaryHi: 'युवाओं के लिए स्टाइपेंड सहित कौशल प्रशिक्षण।', benefitDetailsEn: '₹8,000–₹10,000/month training stipend.', benefitDetailsHi: '₹8,000–₹10,000 प्रतिमाह स्टाइपेंड।', requiredDocuments: ['Samagra ID', 'Marksheet', 'Aadhaar'], applicationUrl: 'https://mmsky.mp.gov.in/', sourceDocument: 'MP Skill Dept', effectiveFrom: '2023-07-01', lastVerifiedDate: '2026-10-05', isActive: true,
    rules: [
      { field: 'seekingEmployment', operator: 'eq', value: true, labelEn: 'Seeking skill training / employment', labelHi: 'रोजगार की तलाश' },
      { field: 'educationLevel', operator: 'in', value: ['12th', 'iti', 'diploma', 'graduate', 'postgraduate'], labelEn: '12th / ITI / Graduate qualification', labelHi: '12वीं / स्नातक योग्यता' },
    ],
  },
  {
    id: 'sch-ayushman', code: 'PMJAY', nameEn: 'Ayushman Bharat PM-JAY Healthcare Cover', nameHi: 'आयुष्मान भारत स्वास्थ्य सुरक्षा योजना', aliases: ['ayushman'], departmentCategory: 'Health', level: 'central', summaryEn: 'Cashless hospital cover for eligible families.', summaryHi: 'पात्र परिवारों को कैशलेस इलाज सुविधा।', benefitDetailsEn: 'Up to ₹5 lakh/family/year at empanelled hospitals.', benefitDetailsHi: '₹5 लाख प्रति वर्ष कैशलेस उपचार।', requiredDocuments: ['Aadhaar', 'Samagra/Ration Card'], applicationUrl: 'https://beneficiary.nha.gov.in/', sourceDocument: 'NHA Guidelines', effectiveFrom: '2018-09-23', lastVerifiedDate: '2026-10-12', isActive: true,
    rules: [
      { field: 'bplCardHolder', operator: 'eq', value: true, labelEn: 'BPL / priority household', labelHi: 'बीपीएल / प्राथमिकता परिवार' },
    ],
  },
];

let citizenProfile: CitizenProfile | null = null;
const applications: SchemeApplication[] = [];
const documents: UploadedDocument[] = [];
const auditLogs: AuditLogEntry[] = [];
const usersList: UserProfile[] = Object.values(DEMO_USERS);

function evaluateLocalEligibility(profile: Partial<CitizenProfile>): SchemeMatchResult[] {
  return schemes.map((scheme) => {
    const matchedConditions: string[] = [];
    const failedConditions: string[] = [];
    const missingFields: string[] = [];

    for (const rule of scheme.rules) {
      const val = profile[rule.field];
      if (val === undefined || val === null || val === '') {
        missingFields.push(`${rule.field} (${rule.labelEn})`);
        continue;
      }
      let ok = false;
      if (rule.operator === 'eq') ok = String(val).toLowerCase() === String(rule.value).toLowerCase();
      if (rule.operator === 'gte') ok = Number(val) >= Number(rule.value);
      if (rule.operator === 'in' && Array.isArray(rule.value)) {
        ok = rule.value.map((x) => String(x).toLowerCase()).includes(String(val).toLowerCase());
      }
      if (ok) matchedConditions.push(rule.labelEn);
      else failedConditions.push(rule.labelEn);
    }

    const outcome =
      failedConditions.length > 0
        ? 'likely_ineligible'
        : missingFields.length > 0
          ? 'additional_info_required'
          : 'potentially_eligible';

    return {
      scheme,
      outcome,
      confidence: outcome === 'potentially_eligible' ? 0.95 : 0.75,
      matchedConditions,
      failedConditions,
      missingFields,
      disclaimer:
        'Preliminary rule-based match only. Final eligibility requires official departmental verification.',
    };
  });
}

export async function handleLocalApiFallback<T>(
  path: string,
  options: RequestInit,
  currentUser: UserProfile | null,
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const body =
    typeof options.body === 'string' && options.body ? (JSON.parse(options.body) as Record<string, unknown>) : {};

  if (path.startsWith('/analytics/overview')) {
    return {
      roleScope: currentUser?.role ?? 'citizen',
      isDemoData: true,
      cards: {
        pilotVillages: villages.length,
        departments: departments.length,
        totalRecords: records.length,
        verifiedRecords: records.filter((r) => r.status === 'verified').length,
        pendingVerification: records.filter((r) => r.status !== 'verified').length,
        activeSchemes: schemes.length,
        myApplications: applications.length,
        departmentsAvailable: departments.length,
      },
      villageChart: villages.map((v) => ({
        village: v.nameEn,
        verified: records.filter((r) => r.villageId === v.id && r.status === 'verified').length,
        pending: records.filter((r) => r.villageId === v.id && r.status !== 'verified').length,
      })),
    } as T;
  }

  if (path.startsWith('/villages')) {
    return {
      villages: villages.map((v) => ({
        ...v,
        metrics:
          currentUser?.role === 'citizen'
            ? undefined
            : {
                totalRecords: records.filter((r) => r.villageId === v.id).length,
                verifiedRecords: records.filter((r) => r.villageId === v.id && r.status === 'verified').length,
                pendingRecords: records.filter((r) => r.villageId === v.id && r.status !== 'verified').length,
                completionPercent: 40,
              },
      })),
    } as T;
  }

  if (path === '/departments' && method === 'GET') {
    return {
      departments: departments.map((d) => ({
        ...d,
        schemasCount: schemas.filter((s) => s.departmentId === d.id).length,
        recordsCount: records.filter((r) => r.departmentId === d.id).length,
      })),
    } as T;
  }

  if (path === '/departments' && method === 'POST') {
    const code = String(body.code ?? 'NEW').toUpperCase();
    const dept: Department = {
      id: `dept-${code.toLowerCase()}-${Date.now()}`,
      districtId: BETUL_DISTRICT_ID,
      code,
      nameEn: String(body.nameEn ?? code),
      nameHi: String(body.nameHi ?? body.nameEn ?? code),
      category: String(body.category ?? body.nameEn ?? code),
      descriptionEn: String(body.descriptionEn ?? ''),
      descriptionHi: String(body.descriptionEn ?? ''),
      isActive: true,
      assignedVillageIds: ['vil-khedi'],
      isDemoData: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    departments.push(dept);
    return { department: dept } as T;
  }

  const schemaMatch = path.match(/^\/departments\/([^/]+)\/schemas$/);
  if (schemaMatch) {
    return { schemas: schemas.filter((s) => s.departmentId === schemaMatch[1]) } as T;
  }

  if (path === '/records' && method === 'GET') {
    return { records } as T;
  }

  if (path === '/records' && method === 'POST') {
    const rec: DataRecord = {
      id: `rec-${Date.now()}`,
      departmentId: String(body.departmentId),
      villageId: String(body.villageId),
      schemaId: String(body.schemaId),
      schemaVersion: 1,
      submittedBy: currentUser?.id ?? 'local',
      submittedByName: currentUser?.fullName ?? 'User',
      source: 'field_web',
      referenceDate: String(body.referenceDate),
      payload: (body.payload as Record<string, unknown>) ?? {},
      status: 'submitted',
      version: 1,
      isDemoData: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    records.unshift(rec);
    return { record: rec } as T;
  }

  const verifyRecMatch = path.match(/^\/records\/([^/]+)\/verify$/);
  if (verifyRecMatch && method === 'PATCH') {
    const found = records.find((r) => r.id === verifyRecMatch[1]);
    if (found) found.status = body.decision as DataRecord['status'];
    return { record: found } as T;
  }

  if (path === '/schemes/profile' && method === 'GET') {
    return { profile: citizenProfile } as T;
  }

  if (path === '/schemes/profile' && method === 'PUT') {
    citizenProfile = {
      id: 'cit-local',
      userId: currentUser?.id ?? 'local',
      districtId: BETUL_DISTRICT_ID,
      fullName: String(body.fullName ?? 'Betul Resident'),
      age: Number(body.age ?? 35),
      gender: body.gender as CitizenProfile['gender'],
      occupation: String(body.occupation ?? 'farmer'),
      educationLevel: String(body.educationLevel ?? '10th'),
      annualIncomeBand: body.annualIncomeBand as CitizenProfile['annualIncomeBand'],
      landholdingAcres: Number(body.landholdingAcres ?? 0),
      housingStatus: body.housingStatus as CitizenProfile['housingStatus'],
      bplCardHolder: Boolean(body.bplCardHolder),
      seekingEmployment: Boolean(body.seekingEmployment),
      consentGiven: true,
      updatedAt: new Date().toISOString(),
    };
    return { profile: citizenProfile, matches: evaluateLocalEligibility(citizenProfile) } as T;
  }

  if (path === '/schemes/applications' && method === 'GET') {
    return { applications } as T;
  }

  if (path === '/schemes/applications' && method === 'POST') {
    const sch = schemes.find((s) => s.id === body.schemeId);
    const app: SchemeApplication = {
      id: `app-${Date.now()}`,
      citizenUserId: currentUser?.id ?? 'local',
      schemeId: String(body.schemeId),
      schemeName: sch?.nameEn ?? String(body.schemeId),
      status: 'application_submitted',
      submittedAt: new Date().toISOString(),
    };
    applications.unshift(app);
    return { application: app } as T;
  }

  if (path === '/documents' && method === 'GET') {
    return { documents } as T;
  }

  if (path === '/documents/upload' && method === 'POST' && options.body instanceof FormData) {
    const file = options.body.get('file') as File | null;
    if (!file) throw new Error('Please attach a file.');
    const text = file.type.startsWith('text/') ? await file.text() : `Uploaded ${file.name} (${file.size} bytes)`;
    const doc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      uploadedBy: currentUser?.id ?? 'local',
      originalFilename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      sha256Hash: `local-${file.name}-${file.size}`,
      category: 'official_document',
      languageDetected: 'en',
      extractedText: text.slice(0, 4000),
      extractedFields: { filename: file.name },
      extractionConfidence: 0.85,
      processingStatus: 'pending_review',
      verificationStatus: 'pending_review',
      warnings: ['Extracted fields require authorized officer review before updating official records.'],
      createdAt: new Date().toISOString(),
    };
    documents.unshift(doc);
    return { document: doc } as T;
  }

  if (path === '/assistant/query' && method === 'POST') {
    const msg = String(body.message ?? '').toLowerCase();
    const nowIso = new Date().toISOString();
    let reply =
      'Hello! Ask me about Betul government schemes, pilot village status, or speak in Hindi/English (e.g., "Mujhe ghar wali yojana ka form bharna hai").';
    let needsClarification = false;
    let clarificationOptions: string[] | undefined;

    if (/(ghar\s*wali\s*yojana|makan\s*yojana)/i.test(msg)) {
      needsClarification = true;
      clarificationOptions = ['Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)'];
      reply =
        'Are you referring to Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)? I can check whether it is relevant to your household once you confirm.';
    } else if (/(farmer|kisan|acre|graduate|employment|pmay|scheme|yojana)/i.test(msg)) {
      const matches = evaluateLocalEligibility(
        citizenProfile ?? { occupation: 'farmer', landholdingAcres: 2, housingStatus: 'kutcha', annualIncomeBand: 'below_1L', bplCardHolder: true },
      ).filter((m) => m.outcome === 'potentially_eligible');
      reply = `Based on active scheme rules:\n${matches.map((m) => `• ${m.scheme.nameEn} — ${m.scheme.benefitDetailsEn}`).join('\n')}\n\nNote: Preliminary check only; final eligibility requires departmental verification.`;
    }

    const res: AssistantResponse = {
      conversationId: 'conv-web',
      reply,
      intent: needsClarification ? 'ambiguous' : 'scheme_discovery',
      confidence: needsClarification ? 0.64 : 0.9,
      needsClarification,
      clarificationOptions,
      citations: [{ source: 'Betul Scheme Rules & Voice Normalizer', timestamp: nowIso, scope: currentUser?.role ?? 'citizen' }],
      telemetry: { provider: 'web-deterministic', model: 'betul-local-v1', latencyMs: 12, estimatedTokens: 60, cacheHit: true },
    };
    return res as T;
  }

  if (path === '/admin/users') return { users: usersList } as T;
  if (path === '/admin/audit-logs') return { logs: auditLogs } as T;

  return {} as T;
}
