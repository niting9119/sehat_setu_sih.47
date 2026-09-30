/**
 * SEHAT SETU — Medical Safety & Non-Diagnostic Guardrail Engine
 * Enforces strict boundaries: NO autonomous diagnosis, NO medication prescriptions,
 * NO certainty over-claims, and MANDATORY clinical review recommendations.
 */

import { RedFlagAlert, UrgencyLevel } from "@/types/clinical";

export interface GuardrailCheckResult {
  isSafe: boolean;
  violations: string[];
  sanitizedText: string;
  detectedRedFlags: RedFlagAlert[];
}

// Diagnostic and Prescriptive forbidden phrases (RegEx patterns)
const FORBIDDEN_DIAGNOSTIC_PATTERNS = [
  /\b(you have|patient has|patient is diagnosed with|confirmed diagnosis of|definite diagnosis of|we diagnose)\b/gi,
  /\b(suffer(?:s|ing)? from confirmed|is definitively suffering from)\b/gi,
  /\b(you are suffering from|he has|she has) (cancer|diabetes|myocardial infarction|stroke|sepsis)\b/gi,
];

const FORBIDDEN_PRESCRIPTIVE_PATTERNS = [
  /\b(you should take|start taking|take \d+\s*(?:mg|ml|tablets?)|prescribe|i recommend taking|start medicine|stop taking your)\b/gi,
  /\b(take aspirin|take paracetamol|take insulin|increase dose to|decrease dose to)\b/gi,
];

// Red-flag symptom triage rule base
interface RedFlagRule {
  id: string;
  patternName: string;
  keywords: string[][]; // Array of keyword sets that must match
  urgency: UrgencyLevel;
  clinicalReason: string;
  recommendedAction: string;
}

const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: "RF-CARD-001",
    patternName: "Potential Acute Coronary / Cardiac Pattern",
    keywords: [
      ["chest pain", "chest tightness", "chest pressure", "crushing chest discomfort"],
      ["radiation to left arm", "radiation to jaw", "shortness of breath", "sweating", "diaphoresis", "nausea"],
    ],
    urgency: "EMERGENT",
    clinicalReason: "Acute chest discomfort co-occurring with radiating symptoms or autonomic signs.",
    recommendedAction: "Immediate clinician evaluation, 12-lead ECG, and cardiac biomarker assessment recommended.",
  },
  {
    id: "RF-NEURO-001",
    patternName: "Potential Acute Neurological Deficit (FAST)",
    keywords: [
      ["facial droop", "facial weakness", "slurred speech", "loss of speech", "sudden arm weakness", "sudden leg weakness", "sudden visual loss", "hemiparesis"],
    ],
    urgency: "EMERGENT",
    clinicalReason: "Focal neurological deficit symptoms reported with sudden onset.",
    recommendedAction: "Immediate emergency neurological triage and stroke protocol evaluation recommended.",
  },
  {
    id: "RF-RESP-001",
    patternName: "Severe Respiratory Distress Pattern",
    keywords: [
      ["severe breathlessness", "stridor", "gasping for air", "unable to speak full sentences", "cyanosis", "blue lips"],
    ],
    urgency: "EMERGENT",
    clinicalReason: "Compromised airway or high work of breathing reported.",
    recommendedAction: "Immediate clinical respiratory assessment, SpO2 monitoring, and airway support review recommended.",
  },
  {
    id: "RF-SEPSIS-001",
    patternName: "Potential Severe Infection / Sepsis Alert",
    keywords: [
      ["high fever", "rigors", "shivering"],
      ["confusion", "altered sensorium", "extreme drowsiness", "clammy skin", "mottled skin"],
    ],
    urgency: "URGENT",
    clinicalReason: "Combination of high fever with altered mental status or peripheral perfusion changes.",
    recommendedAction: "Urgent clinical vitals check, lactate, and blood culture screening recommended.",
  },
  {
    id: "RF-AYUSH-INTERACTION-001",
    patternName: "Potential Modern-AYUSH Drug-Herb Interaction Flag",
    keywords: [
      ["warfarin", "clopidogrel", "aspirin", "blood thinner", "heparin"],
      ["ginkgo", "garlic extract", "guggulu", "ayurvedic bhasma", "traditional blood purifier"],
    ],
    urgency: "PRIORITY_REVIEW",
    clinicalReason: "Concurrent use of modern anti-platelet/coagulant agents with traditional formulations possessing anti-aggregatory activity.",
    recommendedAction: "Integrative physician review of bleeding parameters (PT/INR) and medication reconciliation recommended.",
  },
];

/**
 * Validate and sanitize clinical text against diagnostic/prescriptive violations
 */
export function sanitizeClinicalText(text: string): { sanitized: string; violations: string[] } {
  const violations: string[] = [];
  let sanitized = text;

  // Check diagnostic phrases
  for (const pattern of FORBIDDEN_DIAGNOSTIC_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Diagnostic claim detected matching pattern: ${pattern}`);
      sanitized = sanitized.replace(pattern, "Patient reports observations/symptoms consistent with");
    }
  }

  // Check prescriptive phrases
  for (const pattern of FORBIDDEN_PRESCRIPTIVE_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Prescriptive directive detected matching pattern: ${pattern}`);
      sanitized = sanitized.replace(pattern, "For clinical discussion with physician regarding");
    }
  }

  return { sanitized, violations };
}

/**
 * Scan patient statements, complaints, and extracted text for clinical red-flag patterns
 */
export function detectRedFlags(
  textInputs: { text: string; sourceId: string }[]
): RedFlagAlert[] {
  const combinedText = textInputs.map((t) => t.text.toLowerCase()).join(" ");
  const activeFlags: RedFlagAlert[] = [];

  for (const rule of RED_FLAG_RULES) {
    // Check if rule matches
    let matchesAllGroups = true;
    const matchingSources: string[] = [];

    for (const keywordGroup of rule.keywords) {
      const groupMatched = keywordGroup.some((kw) => {
        const found = combinedText.includes(kw.toLowerCase());
        if (found) {
          // Identify which source had it
          textInputs.forEach((item) => {
            if (item.text.toLowerCase().includes(kw.toLowerCase()) && !matchingSources.includes(item.sourceId)) {
              matchingSources.push(item.sourceId);
            }
          });
        }
        return found;
      });

      if (!groupMatched) {
        matchesAllGroups = false;
        break;
      }
    }

    if (matchesAllGroups) {
      activeFlags.push({
        id: `FLAG-${rule.id}-${Date.now().toString().slice(-4)}`,
        symptomPattern: rule.patternName,
        reasonForFlag: rule.clinicalReason,
        urgency: rule.urgency,
        recommendedClinicalAction: rule.recommendedAction,
        detectedFrom: matchingSources.length > 0 ? matchingSources : ["input_text"],
        status: "active",
      });
    }
  }

  return activeFlags;
}

/**
 * Enforce uncertainty preservation in clinical observation summaries
 */
export function formatUncertaintyObservation(
  observedEntity: string,
  sourceType: string,
  confidence: number
): string {
  if (confidence >= 0.9) {
    return `Patient reports / Source (${sourceType}) clearly indicates: "${observedEntity}".`;
  } else if (confidence >= 0.6) {
    return `Patient reports / Source (${sourceType}) tentatively indicates: "${observedEntity}". Clinician verification advised.`;
  } else {
    return `Potential mention of "${observedEntity}" in (${sourceType}) with low confidence (${Math.round(
      confidence * 100
    )}%). Manual verification required.`;
  }
}
