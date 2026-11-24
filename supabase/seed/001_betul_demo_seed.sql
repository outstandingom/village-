-- ============================================================================
-- Seed 001: Betul District Initialization & Clearly Labelled Demonstration Data
-- IMPORTANT: Village metrics below are marked is_demo_data = TRUE until
-- official district datasets are imported.
-- ============================================================================

INSERT INTO public.roles (code, name_en, name_hi, hierarchy_rank, is_privileged)
VALUES
  ('district_admin', 'District Administrator', 'जिला प्रशासक', 10, TRUE),
  ('department_head', 'Department Head', 'विभाग प्रमुख', 20, TRUE),
  ('department_officer', 'Department Officer', 'विभागीय अधिकारी', 30, FALSE),
  ('block_officer', 'Block Officer', 'विकासखंड अधिकारी', 40, FALSE),
  ('tehsil_officer', 'Tehsil Officer', 'तहसील अधिकारी', 40, FALSE),
  ('data_verification_officer', 'Data Verification Officer', 'डेटा सत्यापन अधिकारी', 50, FALSE),
  ('village_coordinator', 'Village Coordinator', 'ग्राम समन्वयक', 60, FALSE),
  ('field_employee', 'Field Employee', 'फील्ड कर्मचारी', 70, FALSE),
  ('citizen', 'Citizen', 'नागरिक', 100, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.organizations (code, name_en, name_hi, state_code)
VALUES ('MP-BETUL-ADMIN', 'Betul District Administration', 'बैतूल जिला प्रशासन', '23')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.districts (organization_id, lgd_code, name_en, name_hi, state_name)
SELECT id, '421', 'Betul', 'बैतूल', 'Madhya Pradesh'
FROM public.organizations WHERE code = 'MP-BETUL-ADMIN'
ON CONFLICT (lgd_code) DO NOTHING;

-- Five Pilot Villages in Betul District (Demo coordinates & LGD placeholders labelled is_demo_data = TRUE)
INSERT INTO public.villages (district_id, lgd_code, name_en, name_hi, is_pilot_village, latitude, longitude, is_demo_data)
SELECT d.id, v.lgd_code, v.name_en, v.name_hi, TRUE, v.lat, v.lng, TRUE
FROM public.districts d
CROSS JOIN (
  VALUES
    ('488101', 'Khedi Sawligarh', 'खेड़ी सावलीगढ़', 21.9125, 77.9612),
    ('488102', 'Badora', 'बडोरा', 21.8841, 77.9015),
    ('488103', 'Sohagpur', 'सोहागपुर', 21.9340, 77.8720),
    ('488104', 'Betul Bazar', 'बैतूल बाजार', 21.8620, 77.9345),
    ('488105', 'Jhallar', 'झल्लार', 21.7450, 77.7910)
) AS v(lgd_code, name_en, name_hi, lat, lng)
WHERE d.lgd_code = '421'
ON CONFLICT (lgd_code) DO NOTHING;

-- 18 Initial Configurable Department Categories
INSERT INTO public.departments (district_id, code, name_en, name_hi, category, description_en, description_hi, is_demo_data)
SELECT d.id, dept.code, dept.name_en, dept.name_hi, dept.category, dept.desc_en, dept.desc_hi, TRUE
FROM public.districts d
CROSS JOIN (
  VALUES
    ('REV', 'Revenue Administration', 'राजस्व प्रशासन', 'Revenue Administration', 'Land records, mutation, and revenue governance.', 'भूमि अभिलेख और राजस्व प्रशासन।'),
    ('PRI', 'Panchayati Raj', 'पंचायती राज', 'Panchayati Raj', 'Gram Panchayat governance and village works.', 'ग्राम पंचायत शासन और ग्राम कार्य।'),
    ('RUR', 'Rural Development', 'ग्रामीण विकास', 'Rural Development', 'Rural housing, MGNREGA, and livelihood schemes.', 'ग्रामीण आवास और आजीविका योजनाएं।'),
    ('AGR', 'Agriculture', 'कृषि विभाग', 'Agriculture', 'Farmer welfare, crops, seeds, soil health, and inputs.', 'किसान कल्याण, फसल और मृदा स्वास्थ्य।'),
    ('EDU', 'Education', 'शिक्षा विभाग', 'Education', 'Schools, attendance, scholarships, and learning outcomes.', 'विद्यालय, छात्रवृत्ति और शिक्षा गुणवत्ता।'),
    ('HLT', 'Health', 'स्वास्थ्य विभाग', 'Health', 'Primary health centres, maternal care, and immunization.', 'प्राथमिक स्वास्थ्य केंद्र और टीकाकरण।'),
    ('WCD', 'Women and Child Development', 'महिला एवं बाल विकास', 'Women and Child Development', 'Anganwadi nutrition, maternal and child welfare.', 'आंगनवाड़ी पोषण और महिला-बाल कल्याण।'),
    ('SJE', 'Social Justice and Empowerment', 'सामाजिक न्याय एवं अधिकारिता', 'Social Justice and Empowerment', 'Pensions, disability support, and social security.', 'पेंशन और सामाजिक सुरक्षा।'),
    ('FCS', 'Food and Civil Supplies', 'खाद्य एवं नागरिक आपूर्ति', 'Food and Civil Supplies', 'PDS ration shops and food security.', 'राशन प्रणाली और खाद्य सुरक्षा।'),
    ('DRW', 'Drinking Water', 'पेयजल विभाग', 'Drinking Water', 'Jal Jeevan Mission, handpumps, and water quality.', 'जल जीवन मिशन और पेयजल गुणवत्ता।'),
    ('ELC', 'Electricity', 'विद्युत विभाग', 'Electricity', 'Rural electrification, transformers, and feeders.', 'ग्रामीण विद्युतीकरण और फीडर।'),
    ('PWD', 'Public Works', 'लोक निर्माण विभाग', 'Public Works', 'Roads, bridges, and public buildings.', 'सड़क, पुल और सार्वजनिक भवन।'),
    ('ANH', 'Animal Husbandry', 'पशुपालन विभाग', 'Animal Husbandry', 'Livestock health, dairy, and vaccination.', 'पशुधन स्वास्थ्य और डेयरी।'),
    ('FOR', 'Forest', 'वन विभाग', 'Forest', 'Forest rights, conservation, and minor forest produce.', 'वन अधिकार और संरक्षण।'),
    ('IRR', 'Irrigation', 'सिंचाई विभाग', 'Irrigation', 'Canals, check dams, and micro-irrigation.', 'नहर, चेक डैम और सूक्ष्म सिंचाई।'),
    ('FSH', 'Fisheries', 'मत्स्य पालन', 'Fisheries', 'Village ponds and fisheries livelihood.', 'तालाब और मत्स्य पालन आजीविका।'),
    ('SDE', 'Skill Development and Employment', 'कौशल विकास एवं रोजगार', 'Skill Development and Employment', 'Youth skilling, apprenticeships, and placement.', 'युवा कौशल विकास और रोजगार।'),
    ('TRW', 'Tribal Welfare', 'जनजातीय कार्य विभाग', 'Tribal Welfare', 'Tribal hostels, scholarships, and welfare programs.', 'जनजातीय छात्रवृत्ति और कल्याण।')
) AS dept(code, name_en, name_hi, category, desc_en, desc_hi)
WHERE d.lgd_code = '421'
ON CONFLICT (district_id, code) DO NOTHING;
