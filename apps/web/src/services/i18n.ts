import type { LanguageCode } from '@betul/shared-types';

const dict = {
  en: {
    appTitle: 'Betul District Intelligence',
    appSubtitle: 'Madhya Pradesh • 5-Village Pilot Platform',
    demoNotice: 'Demonstration Data Mode — Official government records require verified import',
    navOverview: 'Overview',
    navPilot: '5-Village Pilot',
    navDepartments: 'Departments',
    navRecords: 'Data & Verification',
    navSchemes: 'Citizen Schemes',
    navDocuments: 'Documents & OCR',
    navAssistant: 'AI & Voice Assistant',
    navAdmin: 'Users & Audit',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    register: 'Create Account',
    welcome: 'Welcome',
  },
  hi: {
    appTitle: 'बैतूल जिला इंटेलिजेंस',
    appSubtitle: 'मध्य प्रदेश • 5-ग्राम पायलट पोर्टल',
    demoNotice: 'प्रदर्शन डेटा मोड — आधिकारिक सरकारी डेटा आयात के बाद सक्रिय होगा',
    navOverview: 'डैशबोर्ड',
    navPilot: '5-ग्राम पायलट',
    navDepartments: 'विभाग',
    navRecords: 'डेटा एवं सत्यापन',
    navSchemes: 'नागरिक योजनाएं',
    navDocuments: 'दस्तावेज़ एवं OCR',
    navAssistant: 'AI एवं वॉइस सहायक',
    navAdmin: 'उपयोगकर्ता एवं ऑडिट',
    signOut: 'लॉग आउट',
    signIn: 'लॉग इन',
    register: 'नया खाता बनाएं',
    welcome: 'स्वागत है',
  },
} as const;

export function t(lang: LanguageCode, key: keyof (typeof dict)['en']): string {
  return dict[lang][key] ?? dict.en[key];
}
