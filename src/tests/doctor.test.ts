import { describe, it, expect } from "vitest";
import {
  verifyItem,
  modifyItem,
  rejectItem,
  finalizeVerifiedClinicalRecord,
} from "../lib/doctor/verification";
import { VerifiableItem, PatientCaseSession } from "@/types/clinical";

describe("Physician Verification, State Isolation & Audit Trail Engine", () => {
  const sampleItem: VerifiableItem<{ drugName: string; dosage: string }> = {
    id: "item_med_01",
    value: { drugName: "Metformin", dosage: "500mg" },
    provenance: {
      sourceId: "rx_doc_01",
      sourceType: "document_ocr",
      sourceName: "prescription.pdf",
      timestamp: "2026-09-29T10:00:00Z",
      confidence: 0.92,
      rawEvidenceSnippet: "Tab. Metformin 500mg",
    },
    status: "unverified_ai",
  };

  it("Test 1: 1-Click Verification transitions status and records immutable audit entry", () => {
    const { updatedItem, auditEntry } = verifyItem(sampleItem, "Dr. Sunita Sharma, MD", "Matches patient statement");

    expect(updatedItem.status).toBe("verified_clinician");
    expect(updatedItem.verifiedBy).toBe("Dr. Sunita Sharma, MD");
    expect(updatedItem.clinicianNotes).toBe("Matches patient statement");
    expect(Date.parse(updatedItem.verifiedAt!)).not.toBeNaN();

    expect(auditEntry.action).toBe("ITEM_VERIFIED");
    expect(auditEntry.actor.name).toBe("Dr. Sunita Sharma, MD");
    expect(auditEntry.actor.role).toBe("physician");
    expect(auditEntry.previousValue).toBe("unverified_ai");
    expect(auditEntry.newValue).toBe("verified_clinician");
  });

  it("Test 2: Clinician Modification updates value, status, and retains provenance & previous value audit", () => {
    const newValue = { drugName: "Metformin", dosage: "1000mg" };
    const { updatedItem, auditEntry } = modifyItem(
      sampleItem,
      newValue,
      "Patient recently increased dose under endocrinologist guidance",
      "Dr. Sunita Sharma, MD"
    );

    expect(updatedItem.status).toBe("modified_clinician");
    expect(updatedItem.value.dosage).toBe("1000mg");
    expect(updatedItem.provenance.sourceName).toBe("prescription.pdf"); // Provenance preserved

    expect(auditEntry.action).toBe("ITEM_MODIFIED");
    expect(auditEntry.previousValue).toContain("500mg");
    expect(auditEntry.newValue).toContain("1000mg");
    expect(auditEntry.details).toContain("endocrinologist guidance");
  });

  it("Test 3: Clinician Rejection flags incorrect AI extraction with clinical reason", () => {
    const { updatedItem, auditEntry } = rejectItem(
      sampleItem,
      "OCR hallucination; handwritten note was for Paracetamol not Metformin",
      "Dr. Sunita Sharma, MD"
    );

    expect(updatedItem.status).toBe("rejected_clinician");
    expect(updatedItem.clinicianNotes).toContain("REJECTED: OCR hallucination");
    expect(auditEntry.action).toBe("ITEM_REJECTED");
    expect(auditEntry.newValue).toBe("rejected_clinician");
  });

  it("Test 4: Finalize verified clinical record differentiates verified, modified, rejected, and unverified counts", () => {
    const mockSession: PatientCaseSession = {
      caseId: "CASE-9021",
      createdAt: "2026-09-29T10:00:00Z",
      updatedAt: "2026-09-29T10:15:00Z",
      demographics: {
        id: "p_1",
        abhaId: "12-3456-7890-1234",
        fullName: "Rahul Verma",
        age: 48,
        gender: "male",
        preferredLanguage: "hi",
      },
      chiefComplaints: [
        {
          complaint: "Chest heaviness",
          duration: "2 days",
          severity: "severe",
          onset: "acute",
          progression: "worsening",
          associatedSymptoms: [],
          aggravatingFactors: [],
          relievingFactors: [],
          provenance: sampleItem.provenance,
        },
      ],
      modernHistory: {
        pastMedicalConditions: [
          {
            id: "cond_1",
            value: "Hypertension",
            provenance: sampleItem.provenance,
            status: "verified_clinician",
            verifiedBy: "Dr. Sunita",
          },
        ],
        pastSurgicalHistory: [],
        currentMedications: [
          {
            id: "med_1",
            value: { drugName: "Telmisartan", dosage: "40mg", adherence: "regular" },
            provenance: sampleItem.provenance,
            status: "modified_clinician",
            clinicianNotes: "Changed from 20mg to 40mg",
          },
          {
            id: "med_2",
            value: { drugName: "Aspirin", dosage: "75mg", adherence: "stopped" },
            provenance: sampleItem.provenance,
            status: "rejected_clinician",
            clinicianNotes: "Patient stopped 6 months ago",
          },
        ],
        knownAllergies: [],
        familyHistory: [],
        socialHistory: { tobaccoUse: "never", alcoholUse: "never", physicalActivityLevel: "moderate" },
      },
      ayushHistory: {
        agniStatus: "Sama (Balanced)",
        traditionalRemediesUsed: [
          {
            id: "ayush_1",
            value: {
              formulationName: "Arjuna Ksheerapaka",
              ayushSystem: "Ayurveda",
              duration: "2 weeks",
              perceivedEffect: "Cardiac support",
            },
            provenance: sampleItem.provenance,
            status: "verified_clinician",
          },
        ],
        dietaryHabitsPathyaApathya: { dietType: "Vegetarian", tastePreferences: [], mealTimingRegularity: "Regular" },
        sleepPatternNidra: { hoursPerNight: 7, quality: "Sound", daySleep: false },
      },
      uploadedDocuments: [],
      timeline: [],
      contradictions: [],
      missingInformation: [],
      redFlags: [],
      draftSummary: {
        generatedAt: "2026-09-29T10:10:00Z",
        chiefComplaintsSummary: "Chest heaviness",
        symptomTimelineSummary: "",
        medicationReconciliationSummary: "",
        ayushIntegrativeSummary: "",
        relevantInvestigationFindings: "",
        potentialPrioritySignals: [],
        missingDataNotes: [],
        contradictionAlerts: [],
      },
      auditTrail: [],
      consentObtained: {
        isConsented: true,
        timestamp: "2026-09-29T10:00:00Z",
        consentMethod: "digital_touch_signed",
      },
    };

    const finalRecord = finalizeVerifiedClinicalRecord(
      mockSession,
      "Dr. Sunita Sharma, MD",
      "Patient presents with acute chest heaviness. Baseline hypertension managed. Advised urgent ECG."
    );

    expect(finalRecord.isComplete).toBe(true);
    expect(finalRecord.verifiedCount).toBe(2);
    expect(finalRecord.modifiedCount).toBe(1);
    expect(finalRecord.rejectedCount).toBe(1);
    expect(finalRecord.unverifiedCount).toBe(0);
    expect(finalRecord.fhirReadySummary).toContain("PHYSICIAN-VERIFIED PRE-CONSULTATION CASE RECORD");
    expect(finalRecord.fhirReadySummary).toContain("Arjuna Ksheerapaka");
    expect(finalRecord.fhirReadySummary).toContain("DISCARDED");
  });

  it("Test 5: Edge Case - Detects incomplete verification when unverified AI items remain", () => {
    const unverifiedSession: PatientCaseSession = {
      caseId: "CASE-1122",
      createdAt: "2026-09-29T10:00:00Z",
      updatedAt: "2026-09-29T10:00:00Z",
      demographics: { id: "p_2", fullName: "Amit Patel", age: 35, gender: "male", preferredLanguage: "en" },
      chiefComplaints: [],
      modernHistory: {
        pastMedicalConditions: [
          { id: "c1", value: "Asthma", provenance: sampleItem.provenance, status: "unverified_ai" },
        ],
        pastSurgicalHistory: [],
        currentMedications: [],
        knownAllergies: [],
        familyHistory: [],
        socialHistory: { tobaccoUse: "never", alcoholUse: "never", physicalActivityLevel: "active" },
      },
      ayushHistory: {
        agniStatus: "Sama (Balanced)",
        traditionalRemediesUsed: [],
        dietaryHabitsPathyaApathya: { dietType: "Vegetarian", tastePreferences: [], mealTimingRegularity: "Regular" },
        sleepPatternNidra: { hoursPerNight: 8, quality: "Sound", daySleep: false },
      },
      uploadedDocuments: [],
      timeline: [],
      contradictions: [],
      missingInformation: [],
      redFlags: [],
      draftSummary: {
        generatedAt: "2026-09-29T10:00:00Z",
        chiefComplaintsSummary: "",
        symptomTimelineSummary: "",
        medicationReconciliationSummary: "",
        ayushIntegrativeSummary: "",
        relevantInvestigationFindings: "",
        potentialPrioritySignals: [],
        missingDataNotes: [],
        contradictionAlerts: [],
      },
      auditTrail: [],
      consentObtained: { isConsented: true, timestamp: "2026-09-29T10:00:00Z", consentMethod: "verbal_recorded" },
    };

    const finalRecord = finalizeVerifiedClinicalRecord(unverifiedSession, "Dr. Sunita", "Reviewing");
    expect(finalRecord.isComplete).toBe(false);
    expect(finalRecord.unverifiedCount).toBe(1);
  });

  it("Test 6: Sequential multi-stage edits create distinct timestamped audit trail records", () => {
    // First verification
    const stage1 = verifyItem(sampleItem, "Dr. Resident MD", "Initial review");
    // Subsequent modification by senior consultant
    const stage2 = modifyItem(stage1.updatedItem, { drugName: "Metformin ER", dosage: "500mg" }, "Changed to extended release formulation", "Dr. Senior Consultant MD");

    expect(stage1.auditEntry.actor.name).toBe("Dr. Resident MD");
    expect(stage1.auditEntry.action).toBe("ITEM_VERIFIED");

    expect(stage2.auditEntry.actor.name).toBe("Dr. Senior Consultant MD");
    expect(stage2.auditEntry.action).toBe("ITEM_MODIFIED");
    expect(stage2.updatedItem.status).toBe("modified_clinician");
    expect(stage2.updatedItem.value.drugName).toBe("Metformin ER");
  });
});
