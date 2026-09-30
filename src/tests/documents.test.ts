import { describe, it, expect } from "vitest";
import {
  classifyDocumentType,
  extractPrescriptionDrugs,
  extractLabResults,
  processMedicalDocument,
} from "../lib/documents/extractor";

describe("Medical Document Intelligence Engine", () => {
  it("Test 1: Correctly classifies document types (Prescription, Lab Report, Discharge Summary)", () => {
    const rxText = "Dr. Rajesh Sharma, MD\nRx:\nTab. Metformin 500mg - BD x 30 days\nTab. Telmisartan 40mg - OD";
    expect(classifyDocumentType(rxText)).toBe("prescription");

    const labText = "Apex Diagnostic Centre\nPathology Report\nObserved Value Reference Range\nFasting Blood Sugar: 145 mg/dL 70-100";
    expect(classifyDocumentType(labText)).toBe("lab_report");

    const dischargeText = "City Multi-Specialty Hospital\nDischarge Summary\nAdmission Date: 12/04/2026\nDischarge Date: 16/04/2026\nHospital Course: Uneventful";
    expect(classifyDocumentType(dischargeText)).toBe("discharge_summary");
  });

  it("Test 2: Extracts prescription drugs with dosage, strength, and frequency", () => {
    const sampleRx = `
      Dr. Ananya Roy MBBS
      Date: 2026-08-14
      Rx:
      Tab. Metformin 500mg - BD x 30 days
      Cap. Omeprazole 20mg - OD for 14 days
      Syr. Ambroxol 15ml - TID x 5 days
    `;

    const drugs = extractPrescriptionDrugs(sampleRx);
    expect(drugs.length).toBeGreaterThanOrEqual(2);

    const metformin = drugs.find((d) => d.drugName.toLowerCase().includes("metformin"));
    expect(metformin).toBeDefined();
    expect(metformin?.strength).toBe("500mg");
    expect(metformin?.form).toBe("tablet");

    const omeprazole = drugs.find((d) => d.drugName.toLowerCase().includes("omeprazole"));
    expect(omeprazole).toBeDefined();
    expect(omeprazole?.form).toBe("capsule");
  });

  it("Test 3: Evaluates Lab Results against Standard Reference Intervals and flags abnormal/critical values", () => {
    const sampleLab = `
      PATIENT INVESTIGATION REPORT
      Fasting Blood Sugar: 168 mg/dL
      HbA1c: 8.4 %
      Hemoglobin: 9.8 g/dL
      Serum Creatinine: 1.1 mg/dL
    `;

    const results = extractLabResults(sampleLab);
    expect(results.length).toBeGreaterThanOrEqual(3);

    // Fasting Glucose (168 mg/dL -> Abnormal High)
    const fbs = results.find((r) => r.testName.includes("Glucose"));
    expect(fbs).toBeDefined();
    expect(fbs?.numericValue).toBe(168);
    expect(fbs?.isAbnormal).toBe(true);
    expect(fbs?.interpretationHint).toBe("High");

    // HbA1c (8.4% -> Abnormal High)
    const hba1c = results.find((r) => r.testName === "HbA1c");
    expect(hba1c).toBeDefined();
    expect(hba1c?.isAbnormal).toBe(true);

    // Creatinine (1.1 mg/dL -> Normal within 0.6-1.2)
    const creat = results.find((r) => r.testName.includes("Creatinine"));
    expect(creat).toBeDefined();
    expect(creat?.isAbnormal).toBe(false);
    expect(creat?.interpretationHint).toBe("Normal");
  });

  it("Test 4: End-to-end processing generates structured document with bounding boxes and observations", () => {
    const rawOcr = `
      Metro Healthcare Diagnostic Services
      Date: 2026-05-10
      Dr. S. K. Gupta
      HbA1c: 11.2 %
      Fasting Blood Sugar: 280 mg/dL
    `;

    const doc = processMedicalDocument("report_may2026.pdf", rawOcr, 54000);
    expect(doc.fileName).toBe("report_may2026.pdf");
    expect(doc.documentType).toBe("lab_report");
    expect(doc.labResults.length).toBeGreaterThanOrEqual(2);
    expect(doc.ocrBoundingBoxes?.length).toBeGreaterThan(0);
    expect(doc.summaryObservations.length).toBeGreaterThan(0);

    // Critical high evaluation
    const critGlucose = doc.labResults.find((r) => r.testName.includes("Glucose"));
    expect(critGlucose?.interpretationHint).toBe("Critical");
  });

  it("Test 5: Edge Case - Gracefully processes corrupted, noisy, or empty OCR without throwing", () => {
    const noisyText = "%$#^@! 987823 ??? \n\n --- blank ---";
    const doc = processMedicalDocument("corrupt_scan.jpg", noisyText, 1200);

    expect(doc.prescriptions).toHaveLength(0);
    expect(doc.labResults).toHaveLength(0);
    expect(doc.confidenceScore).toBeLessThan(0.9);
  });

  it("Test 6: Critical Low Lab Values - Correctly identifies severe anemia and thrombocytopenia", () => {
    const criticalLabReport = `
      Critical Care Diagnostic Lab
      Hemoglobin: 6.4 g/dL
      Platelet Count: 0.3 lakh/cumm
      Serum Potassium: 2.5 mEq/L
    `;
    const results = extractLabResults(criticalLabReport);
    expect(results).toHaveLength(3);

    const hb = results.find((r) => r.testName === "Hemoglobin");
    expect(hb?.interpretationHint).toBe("Critical");
    expect(hb?.isAbnormal).toBe(true);

    const platelets = results.find((r) => r.testName === "Platelet Count");
    expect(platelets?.interpretationHint).toBe("Critical");

    const potassium = results.find((r) => r.testName === "Serum Potassium");
    expect(potassium?.interpretationHint).toBe("Critical");
  });

  it("Test 7: Multi-drug polypharmacy extraction with adherence instructions", () => {
    const polyRx = `
      Dr. V. Ramanathan MD (Cardiology)
      Rx:
      Tab. Atorvastatin 20mg - HS x 90 days
      Tab. Ramipril 5mg - OD
      Tab. Metoprolol 50mg - BD x 30 days
      Cap. Pantoprazole 40mg - OD before breakfast
    `;
    const drugs = extractPrescriptionDrugs(polyRx);
    expect(drugs.length).toBe(4);
    expect(drugs.map((d) => d.drugName.toLowerCase())).toContain("atorvastatin");
    expect(drugs.map((d) => d.drugName.toLowerCase())).toContain("ramipril");
    expect(drugs.map((d) => d.drugName.toLowerCase())).toContain("metoprolol");
    expect(drugs.map((d) => d.drugName.toLowerCase())).toContain("pantoprazole");
  });

  it("Test 8: Discharge Summary Extraction - In-hospital course and discharge medications", () => {
    const dischargeText = `
      APOLLO MULTISPECIALTY HOSPITAL
      DISCHARGE SUMMARY
      Admission Date: 2026-03-01
      Discharge Date: 2026-03-05
      Hospital Course: Patient admitted with hypertensive crisis, stabilized on ACE inhibitors.
      Discharge Medications:
      Tab. Telmisartan 40mg - OD x 30 days
      Tab. Amlodipine 5mg - OD
    `;
    const doc = processMedicalDocument("discharge_apollo.pdf", dischargeText, 80000);
    expect(doc.documentType).toBe("discharge_summary");
    expect(doc.prescriptions.length).toBe(2);
    expect(doc.documentDate).toBe("2026-03-01");
  });
});
