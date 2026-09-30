/**
 * SEHAT SETU — Layer 1: Clinical Intelligence Layer
 * Domain Models & Clinical Type Definitions
 * Aligned with FHIR R4 & ABDM (Ayushman Bharat Digital Mission) Health Document Specifications
 */

export type SourceType = "voice_intake" | "touch_form" | "document_ocr" | "doctor_entry" | "inferred_pattern";

export interface ClinicalProvenance {
  sourceId: string;
  sourceType: SourceType;
  sourceName: string; // e.g. "Voice Session #1", "Prescription_2024_08_12.pdf", "Touch Questionnaire"
  locationOrOffset?: string; // e.g. "Page 1, Box [x:120, y:340]", "Transcript Sec 0:14-0:22", "Question #4"
  timestamp: string;
  confidence: number; // 0.0 to 1.0
  rawEvidenceSnippet: string; // Exact text snippet or transcription quote
}

export type VerificationStatus = "unverified_ai" | "verified_clinician" | "modified_clinician" | "rejected_clinician";

export interface VerifiableItem<T> {
  id: string;
  value: T;
  provenance: ClinicalProvenance;
  status: VerificationStatus;
  clinicianNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string; // Doctor name or ID
}

export type UrgencyLevel = "EMERGENT" | "URGENT" | "PRIORITY_REVIEW" | "ROUTINE";

export interface RedFlagAlert {
  id: string;
  symptomPattern: string;
  reasonForFlag: string;
  urgency: UrgencyLevel;
  recommendedClinicalAction: string; // Non-prescriptive, e.g. "Immediate ECG and cardiac enzymes clinical review recommended"
  detectedFrom: string[]; // List of source IDs
  status: "active" | "acknowledged" | "dismissed";
}

export interface PatientDemographics {
  id: string;
  abhaId?: string; // ABDM 14-digit ABHA ID format
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  preferredLanguage: string; // 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr'
  contactPhone?: string;
  emergencyContact?: string;
}

export interface ChiefComplaint {
  complaint: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
  onset: "acute" | "gradual" | "sudden";
  progression: "improving" | "worsening" | "constant" | "fluctuating";
  associatedSymptoms: string[];
  aggravatingFactors: string[];
  relievingFactors: string[];
  anatomicalLocation?: string;
  provenance: ClinicalProvenance;
}

export interface ModernClinicalHistory {
  pastMedicalConditions: VerifiableItem<string>[];
  pastSurgicalHistory: VerifiableItem<string>[];
  currentMedications: VerifiableItem<{
    drugName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    adherence: "regular" | "irregular" | "stopped";
  }>[];
  knownAllergies: VerifiableItem<{
    allergen: string;
    reactionType?: string;
    severity: "mild" | "moderate" | "severe";
  }>[];
  familyHistory: VerifiableItem<{
    condition: string;
    relation: string;
  }>[];
  socialHistory: {
    tobaccoUse: "never" | "former" | "current";
    alcoholUse: "never" | "occasional" | "regular";
    occupation?: string;
    physicalActivityLevel: "sedentary" | "moderate" | "active";
  };
}

// AYUSH (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homeopathy) Specific Clinical History
export interface AyushClinicalHistory {
  prakritiAssessment?: {
    dominantDosha: "Vata" | "Pitta" | "Kapha" | "Vata-Pitta" | "Pitta-Vata" | "Pitta-Kapha" | "Kapha-Pitta" | "Vata-Kapha" | "Kapha-Vata" | "Tridosha" | "Undetermined";
    characteristicsObserved: string[];
    confidence: number;
  };
  agniStatus?: "Sama (Balanced)" | "Vishama (Irregular - Vata)" | "Tikshna (Intense - Pitta)" | "Manda (Slow - Kapha)";
  koshthaType?: "Krura (Hard/Constipated)" | "Mrudu (Soft/Loose)" | "Madhyama (Medium/Regular)";
  dhatuInvolvementObserved?: string[]; // e.g. Rasa, Rakta, Mamsa, Meda, Asthi, Majja, Shukra
  traditionalRemediesUsed: VerifiableItem<{
    formulationName: string;
    ayushSystem: "Ayurveda" | "Homeopathy" | "Unani" | "Siddha" | "Folk/Home";
    duration: string;
    perceivedEffect: string;
  }>[];
  dietaryHabitsPathyaApathya: {
    dietType: "Vegetarian" | "Non-Vegetarian" | "Vegan" | "Sattvic";
    tastePreferences: string[]; // Sweet, Sour, Salty, Pungent, Bitter, Astringent
    mealTimingRegularity: "Regular" | "Irregular";
    waterIntakeLitersPerDay?: number;
  };
  sleepPatternNidra: {
    hoursPerNight: number;
    quality: "Sound" | "Disturbed" | "Insomnia" | "Excessive";
    daySleep: boolean;
  };
}

export type DocumentType = "prescription" | "lab_report" | "discharge_summary" | "radiology_report" | "other";

export interface LabResultEntry {
  testName: string;
  observedValue: string;
  numericValue?: number;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  interpretationHint?: "High" | "Low" | "Normal" | "Critical";
  confidence: number;
}

export interface ExtractedPrescriptionDrug {
  drugName: string;
  strength?: string;
  form?: "tablet" | "capsule" | "syrup" | "injection" | "ointment" | "drops";
  dosageInstructions?: string;
  duration?: string;
  confidence: number;
  rawLine: string;
}

export interface ExtractedMedicalDocument {
  id: string;
  fileName: string;
  fileSize: number;
  documentType: DocumentType;
  documentDate?: string;
  issuingDoctorOrHospital?: string;
  rawText: string;
  confidenceScore: number;
  prescriptions: ExtractedPrescriptionDrug[];
  labResults: LabResultEntry[];
  summaryObservations: string[];
  ocrBoundingBoxes?: {
    text: string;
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
    confidence: number;
  }[];
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: "symptom_onset" | "consultation" | "medication_start" | "medication_stop" | "lab_test" | "hospitalization" | "ayush_intervention";
  description: string;
  provenance: ClinicalProvenance;
  isFlaggedPriority: boolean;
}

export interface ContradictionFinding {
  id: string;
  topic: string; // e.g. "Diabetes Diagnosis History", "Current Metformin Dosage"
  sourceA: {
    sourceName: string;
    statement: string;
    date?: string;
  };
  sourceB: {
    sourceName: string;
    statement: string;
    date?: string;
  };
  clinicalImpactDescription: string;
  clinicianResolutionPrompt: string; // e.g. "Verify with patient if currently taking 500mg or 1000mg Metformin"
}

export interface MissingInformationPrompt {
  id: string;
  field: string;
  reasonNeeded: string;
  suggestedInquiry: string;
}

export interface DraftClinicalSummary {
  generatedAt: string;
  chiefComplaintsSummary: string;
  symptomTimelineSummary: string;
  medicationReconciliationSummary: string;
  ayushIntegrativeSummary: string;
  relevantInvestigationFindings: string;
  potentialPrioritySignals: string[];
  missingDataNotes: string[];
  contradictionAlerts: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: "patient" | "physician" | "triage_nurse" | "system";
  };
  action: "INTAKE_STARTED" | "VOICE_RECORDED" | "DOCUMENT_UPLOADED" | "AI_EXTRACTED" | "ITEM_VERIFIED" | "ITEM_MODIFIED" | "ITEM_REJECTED" | "SUMMARY_EXPORTED";
  targetEntity: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface PatientCaseSession {
  caseId: string;
  createdAt: string;
  updatedAt: string;
  demographics: PatientDemographics;
  chiefComplaints: ChiefComplaint[];
  modernHistory: ModernClinicalHistory;
  ayushHistory: AyushClinicalHistory;
  uploadedDocuments: ExtractedMedicalDocument[];
  timeline: TimelineEvent[];
  contradictions: ContradictionFinding[];
  missingInformation: MissingInformationPrompt[];
  redFlags: RedFlagAlert[];
  draftSummary: DraftClinicalSummary;
  auditTrail: AuditLogEntry[];
  consentObtained: {
    isConsented: boolean;
    timestamp: string;
    consentMethod: "verbal_recorded" | "digital_touch_signed";
  };
}
