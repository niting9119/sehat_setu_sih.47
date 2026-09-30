import { describe, it, expect } from "vitest";
import {
  buildChronologicalTimeline,
  detectContradictions,
  detectMissingInformation,
  generateDraftClinicalSummary,
} from "../lib/timeline/builder";
import { ChiefComplaint, ExtractedMedicalDocument, AyushClinicalHistory } from "@/types/clinical";

describe("Clinical Intelligence, Timeline & Contradiction Engine", () => {
  const mockComplaints: ChiefComplaint[] = [
    {
      complaint: "Acute Chest Discomfort",
      duration: "<24h",
      severity: "severe",
      onset: "acute",
      progression: "worsening",
      associatedSymptoms: ["left_arm_radiation", "cold_sweats"],
      aggravatingFactors: ["walking"],
      relievingFactors: ["rest"],
      provenance: {
        sourceId: "voice_01",
        sourceType: "voice_intake",
        sourceName: "Patient Voice Intake",
        timestamp: "2026-09-29T10:00:00Z",
        confidence: 0.96,
        rawEvidenceSnippet: "I have heavy chest pain since morning",
      },
    },
  ];

  const mockDocs: ExtractedMedicalDocument[] = [
    {
      id: "doc_rx_01",
      fileName: "prescription_june2026.pdf",
      fileSize: 45000,
      documentType: "prescription",
      documentDate: "2026-06-15",
      issuingDoctorOrHospital: "Apollo Clinic",
      rawText: "Rx: Tab. Metformin 1000mg - BD",
      confidenceScore: 0.95,
      prescriptions: [
        {
          drugName: "Metformin",
          strength: "1000mg",
          form: "tablet",
          dosageInstructions: "BD",
          duration: "As prescribed",
          confidence: 0.95,
          rawLine: "Tab. Metformin 1000mg - BD",
        },
      ],
      labResults: [],
      summaryObservations: [],
      uploadedAt: "2026-09-29T10:05:00Z",
    },
    {
      id: "doc_lab_01",
      fileName: "lab_report_aug2026.pdf",
      fileSize: 32000,
      documentType: "lab_report",
      documentDate: "2026-08-20",
      issuingDoctorOrHospital: "Dr. Lal PathLabs",
      rawText: "HbA1c: 9.1 %",
      confidenceScore: 0.98,
      prescriptions: [],
      labResults: [
        {
          testName: "HbA1c",
          observedValue: "9.1 %",
          numericValue: 9.1,
          unit: "%",
          referenceRange: "4.0 - 5.6 %",
          isAbnormal: true,
          interpretationHint: "High",
          confidence: 0.98,
        },
      ],
      summaryObservations: [],
      uploadedAt: "2026-09-29T10:06:00Z",
    },
  ];

  const mockAyush: AyushClinicalHistory = {
    prakritiAssessment: {
      dominantDosha: "Pitta",
      characteristicsObserved: ["Tikshna Agni"],
      confidence: 0.85,
    },
    agniStatus: "Tikshna (Intense - Pitta)",
    koshthaType: "Madhyama (Medium/Regular)",
    traditionalRemediesUsed: [
      {
        id: "remedy_01",
        value: {
          formulationName: "Triphala Churna",
          ayushSystem: "Ayurveda",
          duration: "Ongoing",
          perceivedEffect: "Improved bowel regularity",
        },
        provenance: {
          sourceId: "touch_ayush_01",
          sourceType: "touch_form",
          sourceName: "AYUSH Intake Questionnaire",
          timestamp: "2026-09-29T10:02:00Z",
          confidence: 0.95,
          rawEvidenceSnippet: "Triphala Churna 1 spoon",
        },
        status: "unverified_ai",
      },
    ],
    dietaryHabitsPathyaApathya: {
      dietType: "Vegetarian",
      tastePreferences: ["Pungent"],
      mealTimingRegularity: "Regular",
    },
    sleepPatternNidra: {
      hoursPerNight: 7,
      quality: "Sound",
      daySleep: false,
    },
  };

  it("Test 1: Builds unified chronological timeline sorted newest first with provenance", () => {
    const timeline = buildChronologicalTimeline(mockComplaints, mockDocs, mockAyush);
    expect(timeline.length).toBeGreaterThanOrEqual(4);

    // Verify chronological order (descending date)
    for (let i = 0; i < timeline.length - 1; i++) {
      const dateA = new Date(timeline[i].date).getTime();
      const dateB = new Date(timeline[i + 1].date).getTime();
      expect(dateA).toBeGreaterThanOrEqual(dateB);
    }

    // Verify provenance attachment
    timeline.forEach((event) => {
      expect(event.provenance).toBeDefined();
      expect(event.provenance.sourceName.length).toBeGreaterThan(0);
      expect(event.provenance.confidence).toBeGreaterThan(0);
    });
  });

  it("Test 2: Detects medication dosage contradictions between patient statement and prescription", () => {
    const patientReported = ["Metformin 500mg"];
    const contradictions = detectContradictions(mockComplaints, mockDocs, patientReported);

    expect(contradictions.length).toBeGreaterThanOrEqual(1);
    const metContradiction = contradictions.find((c) => c.topic.includes("Metformin"));
    expect(metContradiction).toBeDefined();
    expect(metContradiction?.clinicianResolutionPrompt).toContain("500mg or 1000mg");
    expect(metContradiction?.clinicalImpactDescription).toContain("dosing risk");
  });

  it("Test 3: Detects missing clinical details and generates non-diagnostic clinician prompts", () => {
    const missing = detectMissingInformation(mockComplaints, mockDocs, mockAyush);
    expect(missing.length).toBeGreaterThanOrEqual(1);

    // Check prescription duration missing note
    const rxMissing = missing.find((m) => m.field.includes("Metformin"));
    expect(rxMissing).toBeDefined();
    expect(rxMissing?.suggestedInquiry).toContain("Metformin");

    // Check AYUSH duration missing note
    const ayushMissing = missing.find((m) => m.field.includes("Triphala"));
    expect(ayushMissing).toBeDefined();
  });

  it("Test 4: Synthesizes draft clinical summary with separate AI sections", () => {
    const timeline = buildChronologicalTimeline(mockComplaints, mockDocs, mockAyush);
    const contradictions = detectContradictions(mockComplaints, mockDocs, ["Metformin 500mg"]);
    const missing = detectMissingInformation(mockComplaints, mockDocs, mockAyush);

    const summary = generateDraftClinicalSummary(
      mockComplaints,
      mockDocs,
      timeline,
      contradictions,
      missing,
      mockAyush
    );

    expect(summary.chiefComplaintsSummary).toContain("Acute Chest Discomfort");
    expect(summary.medicationReconciliationSummary).toContain("Metformin");
    expect(summary.ayushIntegrativeSummary).toContain("Prakriti Dominance: Pitta");
    expect(summary.relevantInvestigationFindings).toContain("HbA1c: 9.1 %");
    expect(summary.potentialPrioritySignals.length).toBeGreaterThan(0);
    expect(summary.contradictionAlerts.length).toBeGreaterThan(0);
  });

  it("Test 5: Edge Case - Multi-document drug contradiction across separate clinics", () => {
    const conflictingDocs: ExtractedMedicalDocument[] = [
      {
        id: "doc_a",
        fileName: "clinic_a_prescription.pdf",
        fileSize: 20000,
        documentType: "prescription",
        documentDate: "2026-01-10",
        issuingDoctorOrHospital: "Clinic A",
        rawText: "Rx: Tab. Amlodipine 5mg - OD",
        confidenceScore: 0.95,
        prescriptions: [
          { drugName: "Amlodipine", strength: "5mg", form: "tablet", dosageInstructions: "OD", confidence: 0.95, rawLine: "Tab. Amlodipine 5mg - OD" },
        ],
        labResults: [],
        summaryObservations: [],
        uploadedAt: "2026-09-29T10:00:00Z",
      },
      {
        id: "doc_b",
        fileName: "clinic_b_prescription.pdf",
        fileSize: 22000,
        documentType: "prescription",
        documentDate: "2026-04-12",
        issuingDoctorOrHospital: "Clinic B",
        rawText: "Rx: Tab. Amlodipine 10mg - OD",
        confidenceScore: 0.95,
        prescriptions: [
          { drugName: "Amlodipine", strength: "10mg", form: "tablet", dosageInstructions: "OD", confidence: 0.95, rawLine: "Tab. Amlodipine 10mg - OD" },
        ],
        labResults: [],
        summaryObservations: [],
        uploadedAt: "2026-09-29T10:00:00Z",
      },
    ];

    const contradictions = detectContradictions([], conflictingDocs);
    expect(contradictions.length).toBe(1);
    expect(contradictions[0].topic).toContain("Multi-Prescription Conflict: Amlodipine");
    expect(contradictions[0].sourceA.statement).toContain("5mg");
    expect(contradictions[0].sourceB.statement).toContain("10mg");
  });

  it("Test 6: Boundary Test - Gracefully handles completely empty input arrays without throwing", () => {
    const emptyTimeline = buildChronologicalTimeline([], []);
    expect(emptyTimeline).toHaveLength(0);

    const emptyContradictions = detectContradictions([], []);
    expect(emptyContradictions).toHaveLength(0);

    const emptyMissing = detectMissingInformation([], []);
    expect(emptyMissing).toHaveLength(0);

    const emptySummary = generateDraftClinicalSummary([], [], [], [], []);
    expect(emptySummary.chiefComplaintsSummary).toContain("No active complaints logged.");
  });

  it("Test 7: Discharge Summary Integration - Flags in-hospital encounters as priority timeline events", () => {
    const dischargeDoc: ExtractedMedicalDocument = {
      id: "doc_disch_01",
      fileName: "discharge_cardiac.pdf",
      fileSize: 45000,
      documentType: "discharge_summary",
      documentDate: "2026-07-01",
      issuingDoctorOrHospital: "Care Hospital",
      rawText: "Discharge Summary: Patient admitted with hypertensive urgency.",
      confidenceScore: 0.98,
      prescriptions: [],
      labResults: [],
      summaryObservations: ["Inpatient admission for blood pressure stabilization."],
      uploadedAt: "2026-09-29T10:00:00Z",
    };

    const timeline = buildChronologicalTimeline([], [dischargeDoc]);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].isFlaggedPriority).toBe(true);
    expect(timeline[0].category).toBe("hospitalization");
  });

  it("Test 8: Detects vague complaint durations and generates specific inquiry prompts", () => {
    const vagueComplaint: ChiefComplaint = {
      complaint: "Dizziness and fatigue",
      duration: "Recent",
      severity: "moderate",
      onset: "gradual",
      progression: "fluctuating",
      associatedSymptoms: [],
      aggravatingFactors: [],
      relievingFactors: [],
      provenance: {
        sourceId: "touch_02",
        sourceType: "touch_form",
        sourceName: "Touch Intake",
        timestamp: "2026-09-29T10:00:00Z",
        confidence: 0.9,
        rawEvidenceSnippet: "Recent dizziness",
      },
    };

    const missing = detectMissingInformation([vagueComplaint], []);
    expect(missing.some((m) => m.field.includes("Dizziness"))).toBe(true);
  });
});
