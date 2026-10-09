/**
 * Clinical Pathology Panic / Critical Value Alert Rules
 * Based on ISO 15189:2022 & NABL Medical Laboratory Safety Guidelines.
 * 
 * Panic values are results that signal an immediate life-threatening condition
 * and require urgent notification to the ordering/referring physician.
 */

export interface CriticalAlertResult {
  isCritical: boolean;
  type?: 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  label?: string;
  clinicalImplication?: string;
  recommendedAction?: string;
}

/**
 * Checks whether a given parameter result constitutes a laboratory panic / critical value.
 */
export function checkPanicOrCriticalValue(
  parameterName: string,
  resultValue: string | number,
  unit?: string
): CriticalAlertResult {
  if (resultValue === undefined || resultValue === null) {
    return { isCritical: false };
  }

  const str = String(resultValue).trim();
  if (!str) return { isCritical: false };

  const lowerName = parameterName.toLowerCase();
  const lowerVal = str.toLowerCase();

  // 1. Qualitative Panic Findings
  if (
    lowerName.includes('troponin') &&
    (lowerVal.includes('positive') || lowerVal.includes('reactive') || lowerVal.includes('elevated'))
  ) {
    return {
      isCritical: true,
      type: 'CRITICAL_HIGH',
      label: 'CRITICAL HIGH (REACTIVE)',
      clinicalImplication: 'High sensitivity cardiac biomarker detected. Suspected Acute Coronary Syndrome / Myocardial Infarction.',
      recommendedAction: 'Alert attending physician immediately; urgent cardiology evaluation / ECG recommended.',
    };
  }

  if (
    (lowerName.includes('dengue ns1') || lowerName.includes('malaria') || lowerName.includes('chikungunya')) &&
    (lowerVal.includes('positive') || lowerVal.includes('reactive'))
  ) {
    return {
      isCritical: true,
      type: 'CRITICAL_HIGH',
      label: 'CRITICAL (REACTIVE)',
      clinicalImplication: 'Active acute infectious pathogen antigen detected.',
      recommendedAction: 'Immediate notification to referring clinician. Monitor platelet counts and hemodynamic stability.',
    };
  }

  // Parse numeric value if available
  const cleanNumericStr = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanNumericStr);
  if (isNaN(num)) {
    return { isCritical: false };
  }

  // 2. Hemoglobin (Hb)
  // Panic Low: < 7.0 g/dL (Transfusion threshold) | Panic High: > 20.0 g/dL (Polycythemia hyperviscosity)
  if (
    lowerName.includes('hemoglobin') ||
    lowerName === 'hb' ||
    lowerName.includes('haemoglobin')
  ) {
    if (num < 7.0) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe life-threatening anemia (Hb ${num} g/dL). High risk of hypoxemia and cardiac failure.`,
        recommendedAction: 'Urgent notification required. Immediate blood transfusion and clinical correlation recommended.',
      };
    }
    if (num > 20.0) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Severe erythrocytosis / polycythemia (Hb ${num} g/dL). High risk of thrombosis and hyperviscosity.`,
        recommendedAction: 'Immediate clinician alert. Check hydration status and consider therapeutic phlebotomy.',
      };
    }
  }

  // 3. Platelet Count
  // Panic Low: < 50,000 /cu.mm (or < 0.50 Lakhs) | Panic High: > 10.0 Lakhs (> 1,000,000)
  if (lowerName.includes('platelet')) {
    // If entered in Lakhs (e.g. 0.28 or 0.45)
    const isLakhs = (unit && unit.toLowerCase().includes('lakh')) || num < 20;
    const countInLakhs = isLakhs ? num : num / 100000;

    if (countInLakhs < 0.50) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe thrombocytopenia (${countInLakhs.toFixed(2)} Lakhs / ${Math.round(countInLakhs * 100000)} /cu.mm). Imminent risk of spontaneous internal hemorrhage.`,
        recommendedAction: 'Urgent doctor alert. Precaution for intramuscular injections and trauma. Platelet transfusion review.',
      };
    }
    if (countInLakhs > 10.0) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Extreme thrombocytosis (${countInLakhs.toFixed(2)} Lakhs). Severe risk of thromboembolism.`,
        recommendedAction: 'Alert referring doctor immediately. Evaluate for essential thrombocythemia / reactive states.',
      };
    }
  }

  // 4. Blood Glucose / Sugar (Fasting, PP, Random)
  // Panic Low: < 50 mg/dL (Hypoglycemic coma) | Panic High: > 350 mg/dL (DKA / HHS)
  if (
    lowerName.includes('glucose') ||
    lowerName.includes('sugar') ||
    lowerName.includes('rbs') ||
    lowerName.includes('fbs') ||
    lowerName.includes('ppbs')
  ) {
    if (num < 50) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe hypoglycemia (${num} mg/dL). High risk of neuroglycopenic coma and seizures.`,
        recommendedAction: 'Stat emergency notification. Administer oral glucose or IV Dextrose immediately.',
      };
    }
    if (num > 350) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Extreme hyperglycemia (${num} mg/dL). High risk of Diabetic Ketoacidosis (DKA) or Hyperosmolar Hyperglycemic State (HHS).`,
        recommendedAction: 'Urgent clinician alert. Check urine ketones, blood pH, electrolytes and initiate insulin protocol.',
      };
    }
  }

  // 5. Potassium (K+)
  // Panic Low: < 2.8 mmol/L (Severe Hypokalemia) | Panic High: > 6.2 mmol/L (Severe Hyperkalemia - Cardiac Arrest)
  if (lowerName.includes('potassium') || lowerName.includes('k+')) {
    if (num < 2.8) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe hypokalemia (${num} mmol/L). Severe risk of ventricular dysrhythmias and muscle paralysis.`,
        recommendedAction: 'Immediate doctor notification. Stat ECG and urgent potassium repletion under cardiac monitoring.',
      };
    }
    if (num > 6.2) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Severe hyperkalemia (${num} mmol/L). Extreme risk of fatal cardiac arrest, peaked T waves and VF.`,
        recommendedAction: 'Emergency clinician contact. Immediate ECG; prepare calcium gluconate, insulin-dextrose and nebulized salbutamol.',
      };
    }
  }

  // 6. Sodium (Na+)
  // Panic Low: < 120 mmol/L | Panic High: > 160 mmol/L
  if (lowerName.includes('sodium') || lowerName.includes('na+')) {
    if (num < 120) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe hyponatremia (${num} mmol/L). Risk of cerebral edema, seizures and coma.`,
        recommendedAction: 'Urgent notification. Controlled hypertonic saline correction to prevent osmotic demyelination.',
      };
    }
    if (num > 160) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Severe hypernatremia (${num} mmol/L). Severe cellular dehydration and neurological deficit.`,
        recommendedAction: 'Immediate clinician alert. Gradual hypotonic rehydration monitoring.',
      };
    }
  }

  // 7. Serum Creatinine
  // Panic High: > 3.5 mg/dL (Acute Kidney Injury / Uremic syndrome)
  if (lowerName.includes('creatinine') && !lowerName.includes('clearance')) {
    if (num > 3.5) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Severe renal impairment / Acute Kidney Injury (${num} mg/dL). High risk of uremia and fluid overload.`,
        recommendedAction: 'Notify attending physician immediately. Urgent nephrology consultation and dialysis evaluation.',
      };
    }
  }

  // 8. Total Bilirubin
  // Panic High: > 10.0 mg/dL (Hepatic failure / Kernicterus risk in neonates)
  if (lowerName.includes('bilirubin') && lowerName.includes('total')) {
    if (num > 10.0) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Severe hyperbilirubinemia (${num} mg/dL). Advanced hepatocellular injury or biliary obstruction.`,
        recommendedAction: 'Immediate clinician notification. Further hepatic imaging and coagulation profile review.',
      };
    }
  }

  // 9. Total Leukocyte Count (TLC / WBC)
  // Panic Low: < 2,000 /cu.mm (Agranulocytosis) | Panic High: > 30,000 /cu.mm (Severe Sepsis / Leukemia)
  if (
    lowerName.includes('leukocyte') ||
    lowerName.includes('tlc') ||
    lowerName.includes('wbc count')
  ) {
    if (num < 2000) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe leukopenia / agranulocytosis (${num} /cu.mm). Extreme susceptibility to overwhelming septic shock.`,
        recommendedAction: 'Urgent notification. Reverse barrier nursing, immediate empiric antibiotics if febrile.',
      };
    }
    if (num > 30000) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Extreme leukocytosis / hyperleukocytosis (${num} /cu.mm). Potential acute leukemia or severe sepsis.`,
        recommendedAction: 'Immediate clinician alert. Urgent peripheral blood smear examination for blast cells.',
      };
    }
  }

  // 10. Serum Calcium
  // Panic Low: < 6.5 mg/dL (Tetany, laryngospasm) | Panic High: > 13.0 mg/dL (Hypercalcemic crisis)
  if (lowerName.includes('calcium') && !lowerName.includes('ionized')) {
    if (num < 6.5) {
      return {
        isCritical: true,
        type: 'CRITICAL_LOW',
        label: 'CRITICAL LOW',
        clinicalImplication: `Severe hypocalcemia (${num} mg/dL). High risk of tetany, prolonged QT interval, and seizures.`,
        recommendedAction: 'Immediate notification. IV calcium gluconate standby and ECG monitoring.',
      };
    }
    if (num > 13.0) {
      return {
        isCritical: true,
        type: 'CRITICAL_HIGH',
        label: 'CRITICAL HIGH',
        clinicalImplication: `Hypercalcemic crisis (${num} mg/dL). Risk of coma, cardiac arrhythmias, and renal failure.`,
        recommendedAction: 'Stat doctor alert. Vigorous IV saline hydration and bisphosphonate / calcitonin protocol.',
      };
    }
  }

  return { isCritical: false };
}
