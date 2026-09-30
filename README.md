# SEHAT SETU — Layer 1 (Clinical Intelligence Layer)

> **SIH Problem Statement 26047:** AI-Powered Patient Case-Taking & Medical Document Intelligence for Pre-Consultation Evidence Preparation

---

## 1. Executive Summary & Core Purpose

**SEHAT SETU (Layer 1)** converts fragmented, multi-modal patient information (voice, touch, medical documents, lab results, and AYUSH history) into a structured, evidence-linked clinical case that can be reviewed, verified, modified, or rejected by a doctor before consultation.

### Non-Negotiable Medical Safety Guardrails:
- **Zero Autonomous Diagnosis:** The system never declares a diagnosis or confirms disease state.
- **Zero Prescriptive Claims:** The system never prescribes or alters medications.
- **Strict Evidence Provenance:** Every single clinical assertion links back to ground-truth evidence (voice transcript timestamp, exact document line/bounding box, or patient declaration).
- **Differential State Isolation:** AI-generated assumptions (`unverified_ai`) remain strictly isolated from Doctor-Verified facts (`verified_clinician`).
- **Immutable Audit Trail:** Append-only chain of custody tracking every action, user role, and state transition.

---

## 2. Key Architectural Modules

### Module 1: Non-Diagnostic Safety Guardrail Engine (`src/lib/safety/guardrails.ts`)
- Automated sanitization of diagnostic/prescriptive phrases.
- Non-diagnostic triage rule engine flagging emergent/urgent red-flag symptom patterns (e.g. Acute Coronary Pattern, Neurological Deficit, Sepsis, and Modern-AYUSH Drug-Herb Interactions).
- Uncertainty preservation based on confidence thresholds.

### Module 2: Multi-Modal Adaptive Questionnaire Engine (`src/lib/intake/questionnaire.ts`)
- Multilingual interaction in 6 languages: English, हिन्दी (Hindi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), and मराठी (Marathi).
- Speech Recognition & Audio Voice prompt synthesis bridge.
- Dynamic adaptive branching (e.g., chest pain triggers radiation & diaphoresis inquiry; AYUSH herbs trigger formulation and duration intake).
- Holistic AYUSH intake (Prakriti dosha analysis, Digestive Agni status, Koshtha, Nidra sleep patterns, and traditional formulations).

### Module 3: Medical Document Intelligence & OCR Engine (`src/lib/documents/extractor.ts`)
- Parses Prescriptions, Lab Reports, and Discharge Summaries.
- Extracts drug name, strength, dosage form, instructions, and duration.
- Evaluates laboratory investigation parameters against standard clinical reference intervals with automatic `Normal`, `High`, `Low`, and `Critical` indicators.
- Simulated 2D OCR bounding box geometry mapping.

### Module 4: Chronological Medical Timeline & Contradiction Engine (`src/lib/timeline/builder.ts`)
- Assembles unified chronological timeline sorted newest first.
- Cross-source contradiction detection (e.g., Patient reports Metformin 500mg, but prescription document specifies 1000mg).
- Missing clinical information detection.
- Structured draft clinical summary generation.

### Module 5: Physician Dashboard & Verification Console (`src/lib/doctor/verification.ts`, `src/components/PhysicianDashboardView.tsx`)
- 1-Click Verification, Modification with notes, and Rejection of AI extractions.
- Side-by-side Evidence Inspection Modal.
- FHIR R4 / ABDM-aligned verified clinical record generation.
- Append-only audit trail logging (`src/components/AuditTrailView.tsx`).

---

## 3. Automated Test Verification

The test suite contains **40 unit, integration, boundary, and edge-case tests** tested **3 times successively** with 100% pass rate:

```bash
# Run all tests
npm test
```

### Test Breakdown:
- `src/tests/guardrails.test.ts` (10 tests) — Diagnostic sanitization, red-flags, drug-herb interactions, fuzzing.
- `src/tests/questionnaire.test.ts` (8 tests) — Multilingual dictionary, adaptive branching, AYUSH classification, boundary values.
- `src/tests/documents.test.ts` (8 tests) — Prescription parsing, critical lab intervals, discharge summaries, noisy OCR resilience.
- `src/tests/timeline.test.ts` (8 tests) — Chronological ordering, multi-clinic prescription conflicts, missing fields.
- `src/tests/doctor.test.ts` (6 tests) — 1-click verification, state transitions, audit trail immutability, FHIR record finalization.

---

## 4. Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```
