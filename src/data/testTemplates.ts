export interface ParameterTemplate {
  name: string;
  unit: string;
  referenceRange: string;
  defaultNormalValue: string;
  minNormal?: number;
  maxNormal?: number;
  isNumeric?: boolean;
  notes?: string;
}

export interface TestTemplate {
  id: string;
  name: string;
  category: string;
  sampleType: string;
  turnaroundTime: string;
  parameters: ParameterTemplate[];
}

export const TEST_TEMPLATES: TestTemplate[] = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Hematology',
    sampleType: 'EDTA Whole Blood (Purple Top)',
    turnaroundTime: '1 hour',
    parameters: [
      {
        name: 'Hemoglobin (Hb)',
        unit: 'g/dL',
        referenceRange: '13.0 – 17.0 (Male) | 12.0 – 15.0 (Female)',
        defaultNormalValue: '14.5',
        minNormal: 13.0,
        maxNormal: 17.0,
        isNumeric: true,
      },
      {
        name: 'Total Leukocyte Count (TLC/WBC)',
        unit: '/cu.mm',
        referenceRange: '4,000 – 11,000',
        defaultNormalValue: '7200',
        minNormal: 4000,
        maxNormal: 11000,
        isNumeric: true,
      },
      {
        name: 'Platelet Count',
        unit: 'Lakhs/cu.mm',
        referenceRange: '1.50 – 4.50',
        defaultNormalValue: '2.40',
        minNormal: 1.5,
        maxNormal: 4.5,
        isNumeric: true,
      },
      {
        name: 'Total RBC Count',
        unit: 'million/cu.mm',
        referenceRange: '4.5 – 5.5',
        defaultNormalValue: '4.8',
        minNormal: 4.5,
        maxNormal: 5.5,
        isNumeric: true,
      },
      {
        name: 'Packed Cell Volume (PCV / Hematocrit)',
        unit: '%',
        referenceRange: '40.0 – 50.0',
        defaultNormalValue: '43.2',
        minNormal: 40.0,
        maxNormal: 50.0,
        isNumeric: true,
      },
      {
        name: 'Mean Corpuscular Volume (MCV)',
        unit: 'fL',
        referenceRange: '80.0 – 100.0',
        defaultNormalValue: '88.5',
        minNormal: 80.0,
        maxNormal: 100.0,
        isNumeric: true,
      },
      {
        name: 'Mean Corpuscular Hemoglobin (MCH)',
        unit: 'pg',
        referenceRange: '27.0 – 32.0',
        defaultNormalValue: '29.8',
        minNormal: 27.0,
        maxNormal: 32.0,
        isNumeric: true,
      },
      {
        name: 'MCHC',
        unit: 'g/dL',
        referenceRange: '32.0 – 36.0',
        defaultNormalValue: '33.6',
        minNormal: 32.0,
        maxNormal: 36.0,
        isNumeric: true,
      },
      {
        name: 'Polymorphs / Neutrophils',
        unit: '%',
        referenceRange: '40 – 70',
        defaultNormalValue: '62',
        minNormal: 40,
        maxNormal: 70,
        isNumeric: true,
      },
      {
        name: 'Lymphocytes',
        unit: '%',
        referenceRange: '20 – 45',
        defaultNormalValue: '30',
        minNormal: 20,
        maxNormal: 45,
        isNumeric: true,
      },
      {
        name: 'Eosinophils',
        unit: '%',
        referenceRange: '1 – 6',
        defaultNormalValue: '3',
        minNormal: 1,
        maxNormal: 6,
        isNumeric: true,
      },
      {
        name: 'Monocytes',
        unit: '%',
        referenceRange: '2 – 8',
        defaultNormalValue: '4',
        minNormal: 2,
        maxNormal: 8,
        isNumeric: true,
      },
      {
        name: 'Basophils',
        unit: '%',
        referenceRange: '0 – 1',
        defaultNormalValue: '1',
        minNormal: 0,
        maxNormal: 1,
        isNumeric: true,
      },
      {
        name: 'ESR (Westergren Method)',
        unit: 'mm / 1st hr',
        referenceRange: '0 – 15 (Male) | 0 – 20 (Female)',
        defaultNormalValue: '8',
        minNormal: 0,
        maxNormal: 15,
        isNumeric: true,
      },
    ],
  },
  {
    id: 'diabetes',
    name: 'Diabetes Profile (Blood Sugar & HbA1c)',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma & EDTA Blood',
    turnaroundTime: '2 hours',
    parameters: [
      {
        name: 'Fasting Blood Glucose (FBS)',
        unit: 'mg/dL',
        referenceRange: '70 – 99 (Normal) | 100 – 125 (Impaired)',
        defaultNormalValue: '92',
        minNormal: 70,
        maxNormal: 100,
        isNumeric: true,
      },
      {
        name: 'Post-Prandial Glucose (PPBS 2hr)',
        unit: 'mg/dL',
        referenceRange: '< 140 (Normal) | 140 – 199 (Impaired)',
        defaultNormalValue: '124',
        minNormal: 70,
        maxNormal: 140,
        isNumeric: true,
      },
      {
        name: 'HbA1c (Glycosylated Hemoglobin)',
        unit: '%',
        referenceRange: '< 5.7 (Normal) | 5.7 – 6.4 (Prediabetes) | >= 6.5 (Diabetes)',
        defaultNormalValue: '5.4',
        minNormal: 4.0,
        maxNormal: 5.7,
        isNumeric: true,
      },
      {
        name: 'Estimated Average Glucose (eAG)',
        unit: 'mg/dL',
        referenceRange: '90 – 120',
        defaultNormalValue: '108',
        minNormal: 90,
        maxNormal: 120,
        isNumeric: true,
      },
    ],
  },
  {
    id: 'lipid',
    name: 'Lipid Profile (Cholesterol & Triglycerides)',
    category: 'Biochemistry',
    sampleType: 'Serum Gel Tube (Gold Top)',
    turnaroundTime: '3 hours',
    parameters: [
      {
        name: 'Serum Total Cholesterol',
        unit: 'mg/dL',
        referenceRange: '< 200.0 (Desirable) | 200 – 239 (Borderline)',
        defaultNormalValue: '178',
        minNormal: 120,
        maxNormal: 200,
        isNumeric: true,
      },
      {
        name: 'Serum Triglycerides',
        unit: 'mg/dL',
        referenceRange: '< 150.0 (Normal) | 150 – 199 (Borderline High)',
        defaultNormalValue: '135',
        minNormal: 50,
        maxNormal: 150,
        isNumeric: true,
      },
      {
        name: 'HDL Cholesterol (Good)',
        unit: 'mg/dL',
        referenceRange: '> 40.0 (Male) | > 50.0 (Female)',
        defaultNormalValue: '48',
        minNormal: 40,
        maxNormal: 70,
        isNumeric: true,
      },
      {
        name: 'LDL Cholesterol (Calculated / Bad)',
        unit: 'mg/dL',
        referenceRange: '< 100.0 (Optimal) | 100 – 129 (Near Optimal)',
        defaultNormalValue: '96',
        minNormal: 50,
        maxNormal: 100,
        isNumeric: true,
      },
      {
        name: 'VLDL Cholesterol',
        unit: 'mg/dL',
        referenceRange: '< 30.0',
        defaultNormalValue: '26',
        minNormal: 5,
        maxNormal: 30,
        isNumeric: true,
      },
      {
        name: 'Total Cholesterol / HDL Ratio',
        unit: 'Ratio',
        referenceRange: '< 4.5',
        defaultNormalValue: '3.7',
        minNormal: 1.0,
        maxNormal: 4.5,
        isNumeric: true,
      },
    ],
  },
  {
    id: 'lft',
    name: 'Liver Function Test (LFT Profile)',
    category: 'Biochemistry',
    sampleType: 'Serum (Yellow/Gold Top)',
    turnaroundTime: '3 hours',
    parameters: [
      {
        name: 'Bilirubin Total',
        unit: 'mg/dL',
        referenceRange: '0.2 – 1.2',
        defaultNormalValue: '0.8',
        minNormal: 0.2,
        maxNormal: 1.2,
        isNumeric: true,
      },
      {
        name: 'Bilirubin Direct (Conjugated)',
        unit: 'mg/dL',
        referenceRange: '0.0 – 0.3',
        defaultNormalValue: '0.2',
        minNormal: 0.0,
        maxNormal: 0.3,
        isNumeric: true,
      },
      {
        name: 'Bilirubin Indirect (Unconjugated)',
        unit: 'mg/dL',
        referenceRange: '0.1 – 0.9',
        defaultNormalValue: '0.6',
        minNormal: 0.1,
        maxNormal: 0.9,
        isNumeric: true,
      },
      {
        name: 'SGOT / AST',
        unit: 'U/L',
        referenceRange: '5 – 40',
        defaultNormalValue: '24',
        minNormal: 5,
        maxNormal: 40,
        isNumeric: true,
      },
      {
        name: 'SGPT / ALT',
        unit: 'U/L',
        referenceRange: '7 – 45',
        defaultNormalValue: '28',
        minNormal: 7,
        maxNormal: 45,
        isNumeric: true,
      },
      {
        name: 'Alkaline Phosphatase (ALP)',
        unit: 'U/L',
        referenceRange: '44 – 147',
        defaultNormalValue: '86',
        minNormal: 44,
        maxNormal: 147,
        isNumeric: true,
      },
      {
        name: 'Total Protein',
        unit: 'g/dL',
        referenceRange: '6.4 – 8.3',
        defaultNormalValue: '7.2',
        minNormal: 6.4,
        maxNormal: 8.3,
        isNumeric: true,
      },
      {
        name: 'Serum Albumin',
        unit: 'g/dL',
        referenceRange: '3.5 – 5.2',
        defaultNormalValue: '4.2',
        minNormal: 3.5,
        maxNormal: 5.2,
        isNumeric: true,
      },
      {
        name: 'A : G Ratio',
        unit: 'Ratio',
        referenceRange: '1.2 – 2.2',
        defaultNormalValue: '1.4',
        minNormal: 1.2,
        maxNormal: 2.2,
        isNumeric: true,
      },
    ],
  },
  {
    id: 'kft',
    name: 'Kidney Function Test (KFT / RFT with Electrolytes)',
    category: 'Biochemistry',
    sampleType: 'Serum (Yellow/Gold Top)',
    turnaroundTime: '2.5 hours',
    parameters: [
      {
        name: 'Blood Urea',
        unit: 'mg/dL',
        referenceRange: '15.0 – 45.0',
        defaultNormalValue: '28.0',
        minNormal: 15.0,
        maxNormal: 45.0,
        isNumeric: true,
      },
      {
        name: 'Blood Urea Nitrogen (BUN)',
        unit: 'mg/dL',
        referenceRange: '7.0 – 20.0',
        defaultNormalValue: '13.2',
        minNormal: 7.0,
        maxNormal: 20.0,
        isNumeric: true,
      },
      {
        name: 'Serum Creatinine',
        unit: 'mg/dL',
        referenceRange: '0.7 – 1.3 (Male) | 0.5 – 1.1 (Female)',
        defaultNormalValue: '0.9',
        minNormal: 0.5,
        maxNormal: 1.3,
        isNumeric: true,
      },
      {
        name: 'Serum Uric Acid',
        unit: 'mg/dL',
        referenceRange: '3.5 – 7.2 (Male) | 2.6 – 6.0 (Female)',
        defaultNormalValue: '4.8',
        minNormal: 2.6,
        maxNormal: 7.2,
        isNumeric: true,
      },
      {
        name: 'Serum Sodium (Na+)',
        unit: 'mmol/L',
        referenceRange: '135 – 145',
        defaultNormalValue: '139',
        minNormal: 135,
        maxNormal: 145,
        isNumeric: true,
      },
      {
        name: 'Serum Potassium (K+)',
        unit: 'mmol/L',
        referenceRange: '3.5 – 5.1',
        defaultNormalValue: '4.2',
        minNormal: 3.5,
        maxNormal: 5.1,
        isNumeric: true,
      },
      {
        name: 'Serum Calcium (Total)',
        unit: 'mg/dL',
        referenceRange: '8.8 – 10.2',
        defaultNormalValue: '9.4',
        minNormal: 8.8,
        maxNormal: 10.2,
        isNumeric: true,
      },
    ],
  },
  {
    id: 'thyroid',
    name: 'Thyroid Profile Total (T3, T4, TSH)',
    category: 'Endocrinology / Hormones',
    sampleType: 'Serum (Red/Gold Top)',
    turnaroundTime: '4 hours',
    parameters: [
      {
        name: 'Total Triiodothyronine (T3)',
        unit: 'ng/dL',
        referenceRange: '60.0 – 200.0',
        defaultNormalValue: '118.0',
        minNormal: 60.0,
        maxNormal: 200.0,
        isNumeric: true,
      },
      {
        name: 'Total Thyroxine (T4)',
        unit: 'µg/dL',
        referenceRange: '4.5 – 12.0',
        defaultNormalValue: '8.4',
        minNormal: 4.5,
        maxNormal: 12.0,
        isNumeric: true,
      },
      {
        name: 'Ultrasensitive TSH (3rd Gen)',
        unit: 'µIU/mL',
        referenceRange: '0.35 – 4.94',
        defaultNormalValue: '2.15',
        minNormal: 0.35,
        maxNormal: 4.94,
        isNumeric: true,
      },
    ],
  },
  {
    id: 'urine_rm',
    name: 'Urine Routine & Microscopic Examination (R/M)',
    category: 'Clinical Pathology',
    sampleType: 'Clean Catch Midstream Urine',
    turnaroundTime: '1 hour',
    parameters: [
      {
        name: 'Color & Appearance',
        unit: 'Visual',
        referenceRange: 'Pale Yellow, Clear',
        defaultNormalValue: 'Pale Yellow, Clear',
        isNumeric: false,
      },
      {
        name: 'Specific Gravity',
        unit: '',
        referenceRange: '1.005 – 1.030',
        defaultNormalValue: '1.018',
        minNormal: 1.005,
        maxNormal: 1.030,
        isNumeric: true,
      },
      {
        name: 'pH (Reaction)',
        unit: '',
        referenceRange: '5.0 – 7.5 (Acidic/Neutral)',
        defaultNormalValue: '6.0',
        minNormal: 5.0,
        maxNormal: 7.5,
        isNumeric: true,
      },
      {
        name: 'Chemical: Albumin / Protein',
        unit: 'Dipstick',
        referenceRange: 'Nil / Negative',
        defaultNormalValue: 'Nil',
        isNumeric: false,
      },
      {
        name: 'Chemical: Sugar / Glucose',
        unit: 'Dipstick',
        referenceRange: 'Nil / Negative',
        defaultNormalValue: 'Nil',
        isNumeric: false,
      },
      {
        name: 'Microscopic: Pus Cells',
        unit: '/ HPF',
        referenceRange: '0 – 4 / HPF',
        defaultNormalValue: '1-2',
        isNumeric: false,
      },
      {
        name: 'Microscopic: Red Blood Cells (RBCs)',
        unit: '/ HPF',
        referenceRange: 'Nil / 0-1',
        defaultNormalValue: 'Nil',
        isNumeric: false,
      },
      {
        name: 'Microscopic: Epithelial Cells',
        unit: '/ HPF',
        referenceRange: '1 – 4 (Few) / HPF',
        defaultNormalValue: 'Few (1-2)',
        isNumeric: false,
      },
      {
        name: 'Casts & Crystals',
        unit: '/ LPF',
        referenceRange: 'Absent / Nil',
        defaultNormalValue: 'Nil',
        isNumeric: false,
      },
    ],
  },
  {
    id: 'dengue',
    name: 'Dengue Serology Panel (NS1 + IgM + IgG)',
    category: 'Serology / Virology',
    sampleType: 'Serum',
    turnaroundTime: '1.5 hours',
    parameters: [
      {
        name: 'Dengue NS1 Antigen (Early Marker)',
        unit: 'Qualitative',
        referenceRange: 'Negative / Non-Reactive',
        defaultNormalValue: 'Negative',
        isNumeric: false,
      },
      {
        name: 'Dengue IgM Antibodies (Acute Phase)',
        unit: 'Qualitative',
        referenceRange: 'Negative / Non-Reactive',
        defaultNormalValue: 'Negative',
        isNumeric: false,
      },
      {
        name: 'Dengue IgG Antibodies (Past Exposure)',
        unit: 'Qualitative',
        referenceRange: 'Negative / Non-Reactive',
        defaultNormalValue: 'Negative',
        isNumeric: false,
      },
    ],
  },
  {
    id: 'widal',
    name: 'Widal Agglutination Test (Typhoid)',
    category: 'Serology',
    sampleType: 'Serum',
    turnaroundTime: '2 hours',
    parameters: [
      {
        name: 'S. Typhi "O" Titre',
        unit: 'Titre',
        referenceRange: '< 1:80 (Non-Reactive)',
        defaultNormalValue: '< 1:40 (Non-Reactive)',
        isNumeric: false,
      },
      {
        name: 'S. Typhi "H" Titre',
        unit: 'Titre',
        referenceRange: '< 1:80 (Non-Reactive)',
        defaultNormalValue: '< 1:40 (Non-Reactive)',
        isNumeric: false,
      },
      {
        name: 'S. Paratyphi "AH" Titre',
        unit: 'Titre',
        referenceRange: '< 1:80 (Non-Reactive)',
        defaultNormalValue: 'Nil',
        isNumeric: false,
      },
      {
        name: 'S. Paratyphi "BH" Titre',
        unit: 'Titre',
        referenceRange: '< 1:80 (Non-Reactive)',
        defaultNormalValue: 'Nil',
        isNumeric: false,
      },
    ],
  },
  {
    id: 'vitamins',
    name: 'Vitamins Profile (Vitamin D3 & Vitamin B12)',
    category: 'Biochemistry / ECLIA',
    sampleType: 'Serum',
    turnaroundTime: '6 hours',
    parameters: [
      {
        name: '25-OH Vitamin D Total',
        unit: 'ng/mL',
        referenceRange: '30 – 100 (Sufficient) | < 20 (Deficient)',
        defaultNormalValue: '38.4',
        minNormal: 30.0,
        maxNormal: 100.0,
        isNumeric: true,
      },
      {
        name: 'Vitamin B12 (Cyanocobalamin)',
        unit: 'pg/mL',
        referenceRange: '211 – 911 (Normal)',
        defaultNormalValue: '412',
        minNormal: 211,
        maxNormal: 911,
        isNumeric: true,
      },
    ],
  },
];

// Helper to check if a numeric value is abnormal
export const checkIsAbnormal = (
  paramName: string,
  valStr: string,
  template?: ParameterTemplate | string
): boolean => {
  if (!valStr || !valStr.trim()) return false;
  const valLower = valStr.toLowerCase().trim();

  // If qualitative: positive / reactive is abnormal
  if (valLower.includes('positive') || valLower.includes('reactive') || valLower.includes('elevated')) {
    return true;
  }

  if (template && typeof template === 'object') {
    if (template.isNumeric && template.minNormal !== undefined && template.maxNormal !== undefined) {
      const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) {
        return num < template.minNormal || num > template.maxNormal;
      }
    }
  } else if (typeof template === 'string') {
    const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      const parts = template.split(/[-–—to]/).map(s => parseFloat(s.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n));
      if (parts.length >= 2) {
        const min = Math.min(parts[0], parts[1]);
        const max = Math.max(parts[0], parts[1]);
        return num < min || num > max;
      }
      if (template.includes('<')) {
        const max = parseFloat(template.replace(/[^0-9.]/g, ''));
        if (!isNaN(max)) return num >= max;
      }
      if (template.includes('>')) {
        const min = parseFloat(template.replace(/[^0-9.]/g, ''));
        if (!isNaN(min)) return num <= min;
      }
    }
  }

  // Fallback pattern matching for common words
  if (paramName.toLowerCase().includes('hba1c')) {
    const num = parseFloat(valStr);
    if (!isNaN(num)) return num >= 5.7;
  }

  if (paramName.toLowerCase().includes('cholesterol') && !paramName.toLowerCase().includes('hdl')) {
    const num = parseFloat(valStr);
    if (!isNaN(num)) return num >= 200;
  }

  return false;
};
