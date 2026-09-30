/**
 * SEHAT SETU — Clinical Intelligence, Chronological Timeline & Contradiction Engine
 * Assembles a unified chronological patient timeline from multi-source data,
 * detects discrepancies & missing clinical details, and drafts evidence-linked case summaries.
 */

import {
  ChiefComplaint,
  ExtractedMedicalDocument,
  TimelineEvent,
  ContradictionFinding,
  MissingInformationPrompt,
  DraftClinicalSummary,
  AyushClinicalHistory,
} from "@/types/clinical";

/**
 * Build unified chronological timeline from all multi-modal sources
 */
export function buildChronologicalTimeline(
  complaints: ChiefComplaint[],
  documents: ExtractedMedicalDocument[],
  ayushHistory?: AyushClinicalHistory
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Ingest Chief Complaints
  complaints.forEach((c, idx) => {
    events.push({
      id: `event_complaint_${idx}_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title: `Chief Complaint: ${c.complaint}`,
      category: "symptom_onset",
      description: `Reported severity: ${c.severity.toUpperCase()}, duration: ${c.duration}. Associated symptoms: ${
        c.associatedSymptoms.length > 0 ? c.associatedSymptoms.join(", ") : "None"
      }`,
      provenance: c.provenance,
      isFlaggedPriority: c.severity === "severe",
    });
  });

  // 2. Ingest Medical Documents
  documents.forEach((doc) => {
    const docDate = doc.documentDate || new Date().toISOString().split("T")[0];

    // Prescriptions
    if (doc.prescriptions.length > 0) {
      doc.prescriptions.forEach((drug, dIdx) => {
        events.push({
          id: `event_rx_${doc.id}_${dIdx}`,
          date: docDate,
          title: `Prescribed: ${drug.drugName} ${drug.strength || ""}`,
          category: "medication_start",
          description: `Form: ${drug.form || "tablet"}, Instructions: ${drug.dosageInstructions || "as directed"} (${doc.issuingDoctorOrHospital})`,
          provenance: {
            sourceId: doc.id,
            sourceType: "document_ocr",
            sourceName: doc.fileName,
            locationOrOffset: `Prescription item #${dIdx + 1}`,
            timestamp: doc.uploadedAt,
            confidence: drug.confidence,
            rawEvidenceSnippet: drug.rawLine,
          },
          isFlaggedPriority: false,
        });
      });
    }

    // Lab Results
    if (doc.labResults.length > 0) {
      doc.labResults.forEach((lab, lIdx) => {
        events.push({
          id: `event_lab_${doc.id}_${lIdx}`,
          date: docDate,
          title: `Lab Test: ${lab.testName} = ${lab.observedValue}`,
          category: "lab_test",
          description: `Reference interval: ${lab.referenceRange || "N/A"}. Status: ${
            lab.isAbnormal ? `ABNORMAL (${lab.interpretationHint})` : "Normal"
          }`,
          provenance: {
            sourceId: doc.id,
            sourceType: "document_ocr",
            sourceName: doc.fileName,
            locationOrOffset: `Lab Result [${lab.testName}]`,
            timestamp: doc.uploadedAt,
            confidence: lab.confidence,
            rawEvidenceSnippet: `${lab.testName}: ${lab.observedValue}`,
          },
          isFlaggedPriority: lab.isAbnormal,
        });
      });
    }

    // Discharge Summary Course
    if (doc.documentType === "discharge_summary") {
      events.push({
        id: `event_discharge_${doc.id}`,
        date: docDate,
        title: `Hospital Discharge (${doc.issuingDoctorOrHospital})`,
        category: "hospitalization",
        description: doc.summaryObservations.join(" ") || "Inpatient encounter completed.",
        provenance: {
          sourceId: doc.id,
          sourceType: "document_ocr",
          sourceName: doc.fileName,
          locationOrOffset: "Discharge Record",
          timestamp: doc.uploadedAt,
          confidence: doc.confidenceScore,
          rawEvidenceSnippet: doc.rawText.slice(0, 150),
        },
        isFlaggedPriority: true,
      });
    }
  });

  // 3. Ingest AYUSH Interventions
  if (ayushHistory?.traditionalRemediesUsed) {
    ayushHistory.traditionalRemediesUsed.forEach((remedy, rIdx) => {
      events.push({
        id: `event_ayush_${rIdx}`,
        date: new Date().toISOString().split("T")[0],
        title: `AYUSH Remedy: ${remedy.value.formulationName} (${remedy.value.ayushSystem})`,
        category: "ayush_intervention",
        description: `Patient-reported usage. System: ${remedy.value.ayushSystem}, Perceived effect: ${remedy.value.perceivedEffect}`,
        provenance: remedy.provenance,
        isFlaggedPriority: false,
      });
    });
  }

  // Sort chronologically (descending: newest first)
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Detect cross-source discrepancies and conflicting clinical statements
 */
export function detectContradictions(
  complaints: ChiefComplaint[],
  documents: ExtractedMedicalDocument[],
  patientReportedMedications?: string[]
): ContradictionFinding[] {
  const contradictions: ContradictionFinding[] = [];

  // 1. Compare extracted prescriptions against patient reported medications
  const extractedDrugs = documents.flatMap((d) =>
    d.prescriptions.map((p) => ({ ...p, sourceDoc: d.fileName, date: d.documentDate }))
  );

  if (patientReportedMedications && patientReportedMedications.length > 0) {
    for (const reportedMed of patientReportedMedications) {
      const matchInDoc = extractedDrugs.find(
        (ed) =>
          ed.drugName.toLowerCase().includes(reportedMed.toLowerCase()) ||
          reportedMed.toLowerCase().includes(ed.drugName.toLowerCase())
      );

      if (matchInDoc) {
        // Check for dosage mismatch or frequency variation
        const reportedDoseMatch = reportedMed.match(/(\d+\s*(?:mg|mcg|gm|ml))/i);
        const docDoseMatch = matchInDoc.strength?.match(/(\d+\s*(?:mg|mcg|gm|ml))/i);

        if (reportedDoseMatch && docDoseMatch && reportedDoseMatch[1] !== docDoseMatch[1]) {
          contradictions.push({
            id: `contra_med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            topic: `Dosage Discrepancy for ${matchInDoc.drugName}`,
            sourceA: {
              sourceName: "Patient Case-Taking Intake",
              statement: `Patient stated taking: ${reportedMed}`,
            },
            sourceB: {
              sourceName: matchInDoc.sourceDoc,
              statement: `Document prescribes: ${matchInDoc.drugName} ${matchInDoc.strength} (${matchInDoc.dosageInstructions})`,
              date: matchInDoc.date,
            },
            clinicalImpactDescription: `Potential under-dosing or over-dosing risk due to conflicting dosage records (${reportedDoseMatch[1]} vs ${docDoseMatch[1]}).`,
            clinicianResolutionPrompt: `Please clarify with the patient whether they are currently consuming ${reportedDoseMatch[1]} or ${docDoseMatch[1]}.`,
          });
        }
      }
    }
  }

  // 2. Cross-document duplicate drug conflicts (e.g. two prescriptions with different dosages)
  for (let i = 0; i < extractedDrugs.length; i++) {
    for (let j = i + 1; j < extractedDrugs.length; j++) {
      const drugA = extractedDrugs[i];
      const drugB = extractedDrugs[j];

      if (
        drugA.drugName.toLowerCase() === drugB.drugName.toLowerCase() &&
        drugA.strength &&
        drugB.strength &&
        drugA.strength !== drugB.strength &&
        drugA.sourceDoc !== drugB.sourceDoc
      ) {
        contradictions.push({
          id: `contra_doc_${i}_${j}`,
          topic: `Multi-Prescription Conflict: ${drugA.drugName}`,
          sourceA: {
            sourceName: drugA.sourceDoc,
            statement: `${drugA.drugName} ${drugA.strength} (${drugA.dosageInstructions})`,
            date: drugA.date,
          },
          sourceB: {
            sourceName: drugB.sourceDoc,
            statement: `${drugB.drugName} ${drugB.strength} (${drugB.dosageInstructions})`,
            date: drugB.date,
          },
          clinicalImpactDescription: "Multiple prescription documents prescribe different strengths of the same active drug.",
          clinicianResolutionPrompt: "Verify which prescription represents the most recent active regimen.",
        });
      }
    }
  }

  return contradictions;
}

/**
 * Detect missing crucial clinical fields that require clinician or patient inquiry
 */
export function detectMissingInformation(
  complaints: ChiefComplaint[],
  documents: ExtractedMedicalDocument[],
  ayushHistory?: AyushClinicalHistory
): MissingInformationPrompt[] {
  const missing: MissingInformationPrompt[] = [];

  // Check if duration is vague
  complaints.forEach((c) => {
    if (!c.duration || c.duration.toLowerCase() === "recent") {
      missing.push({
        id: `miss_duration_${c.complaint.replace(/\s+/g, "_")}`,
        field: `Exact Duration for "${c.complaint}"`,
        reasonNeeded: "Accurate chronological onset is required to distinguish acute from chronic etiology.",
        suggestedInquiry: "Ask patient exact date or hour when symptoms first began.",
      });
    }
  });

  // Check if prescription duration is missing
  documents.forEach((doc) => {
    doc.prescriptions.forEach((p) => {
      if (!p.duration || p.duration === "As prescribed") {
        missing.push({
          id: `miss_rx_dur_${p.drugName.replace(/\s+/g, "_")}`,
          field: `Prescription Duration for ${p.drugName}`,
          reasonNeeded: "Medication adherence timeline and course completion status unknown.",
          suggestedInquiry: `Verify how many days or months patient has been taking ${p.drugName}.`,
        });
      }
    });
  });

  // Check if AYUSH formulation duration is missing
  if (ayushHistory?.traditionalRemediesUsed) {
    ayushHistory.traditionalRemediesUsed.forEach((remedy) => {
      if (!remedy.value.duration || remedy.value.duration === "Ongoing") {
        missing.push({
          id: `miss_ayush_${remedy.value.formulationName.replace(/\s+/g, "_")}`,
          field: `Duration & Frequency for AYUSH remedy: ${remedy.value.formulationName}`,
          reasonNeeded: "Traditional formulation course length needed to assess potential herb-drug interactions.",
          suggestedInquiry: `Ask patient how often and for how long they have taken ${remedy.value.formulationName}.`,
        });
      }
    });
  }

  return missing;
}

/**
 * Generate Structured Evidence-Linked Draft Clinical Summary for Doctor Verification
 */
export function generateDraftClinicalSummary(
  complaints: ChiefComplaint[],
  documents: ExtractedMedicalDocument[],
  timeline: TimelineEvent[],
  contradictions: ContradictionFinding[],
  missing: MissingInformationPrompt[],
  ayushHistory?: AyushClinicalHistory
): DraftClinicalSummary {
  const chiefSummary = complaints
    .map(
      (c) =>
        `• ${c.complaint} (${c.duration}, severity: ${c.severity.toUpperCase()}). Associated: ${
          c.associatedSymptoms.length > 0 ? c.associatedSymptoms.join(", ") : "None reported"
        }. [Source: ${c.provenance.sourceName}]`
    )
    .join("\n");

  const timelineSummary = timeline
    .slice(0, 5)
    .map((e) => `• [${e.date}] ${e.title} — ${e.description}`)
    .join("\n");

  const allRx = documents.flatMap((d) => d.prescriptions.map((p) => `• ${p.drugName} ${p.strength || ""} (${p.dosageInstructions}) [Doc: ${d.fileName}]`));
  const medSummary = allRx.length > 0 ? allRx.join("\n") : "No previous prescription medications extracted.";

  const ayushParts: string[] = [];
  if (ayushHistory) {
    if (ayushHistory.prakritiAssessment) {
      ayushParts.push(`Prakriti Dominance: ${ayushHistory.prakritiAssessment.dominantDosha}`);
    }
    if (ayushHistory.agniStatus) {
      ayushParts.push(`Digestive Agni: ${ayushHistory.agniStatus}`);
    }
    if (ayushHistory.traditionalRemediesUsed && ayushHistory.traditionalRemediesUsed.length > 0) {
      const remedies = ayushHistory.traditionalRemediesUsed.map((r) => `${r.value.formulationName} (${r.value.ayushSystem})`);
      ayushParts.push(`Traditional Remedies: ${remedies.join(", ")}`);
    }
  }
  const ayushSummary = ayushParts.length > 0 ? ayushParts.join(" | ") : "Standard lifestyle patterns reported.";

  const abnormalLabs = documents
    .flatMap((d) => d.labResults.filter((l) => l.isAbnormal))
    .map((l) => `• ${l.testName}: ${l.observedValue} (Ref: ${l.referenceRange}) [${l.interpretationHint}]`);
  const labSummary = abnormalLabs.length > 0 ? abnormalLabs.join("\n") : "All extracted laboratory parameters within standard reference ranges.";

  const prioritySignals: string[] = [];
  timeline
    .filter((e) => e.isFlaggedPriority)
    .forEach((e) => prioritySignals.push(`Priority Event: ${e.title} (${e.date})`));

  return {
    generatedAt: new Date().toISOString(),
    chiefComplaintsSummary: chiefSummary || "No active complaints logged.",
    symptomTimelineSummary: timelineSummary || "No prior chronological milestones.",
    medicationReconciliationSummary: medSummary,
    ayushIntegrativeSummary: ayushSummary,
    relevantInvestigationFindings: labSummary,
    potentialPrioritySignals: prioritySignals,
    missingDataNotes: missing.map((m) => `${m.field}: ${m.suggestedInquiry}`),
    contradictionAlerts: contradictions.map((c) => `${c.topic}: ${c.clinicianResolutionPrompt}`),
  };
}
