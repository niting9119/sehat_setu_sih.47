# SEHAT SETU — Layer 1 (Clinical Intelligence Layer)
## Project Audit & Baseline Architecture Assessment

**Date:** September 29, 2026  
**Problem Statement:** SIH Problem Statement 26047 — AI-Powered Patient Case-Taking & Medical Document Intelligence  
**Document Type:** Project Audit & Baseline Architecture Report (`PROJECT_AUDIT.md`)

---

## 1. Existing Architecture & Workspace Status

- **Repository Status:** Greenfield workspace initialization in `C:\Users\nitin\OneDrive\Desktop\sih`.
- **Pre-existing Codebases / Configurations:** None found. No legacy code, dirty configurations, or conflicting lockfiles exist.
- **Architectural Scope (Layer 1 — Clinical Intelligence Layer):**
  - Interactive multi-modal patient case-taking (Voice + Touch + Multilingual).
  - Modern Clinical History + AYUSH-specific History intake engine.
  - Adaptive questioning engine (driven by rule/evidence trees & LLM guardrails).
  - Medical Document Intelligence Engine (OCR + Vision-Language parsing for prescriptions, lab reports, discharge summaries).
  - Chronological Medical Timeline construction with provenance tracking (every clinical claim is linked back to an exact source: voice input transcript, document crop/page, or user confirmation).
  - Clinical Discrepancy & Missing Information Engine (identifies contradictions across documents/intakes).
  - Safety-first Red-Flag & Priority Pattern Detection (non-diagnostic, workflow prioritization only).
  - Clinician Pre-Consultation Dashboard (with side-by-side evidence inspection, verification, inline editing, and differential rejection).
  - Separate state isolation between AI-generated unverified suggestions and Doctor-verified clinical records.
  - Future-ready FHIR R4 / ABDM (Ayushman Bharat Digital Mission) data modeling.

---

## 2. Existing Technologies & Host Environment

The host environment has been audited with the following active runtimes:
- **Node.js:** `v24.13.0` (Active LTS)
- **npm:** `v11.6.2`
- **Python:** `v3.14.2`
- **Git:** `v2.55.0.windows.4`
- **OS:** Windows 11 / Windows Server environment (PowerShell shell interface)

### Recommended Full-Stack Architecture for Layer 1:
- **Frontend / Client UI:**
  - Next.js 15 / React 19 (TypeScript, Tailwind CSS, Lucide Icons, Radix UI / Shadcn primitives)
  - Audio/Voice interface: Web Speech API + Whisper integration bridge with real-time waveform & localized audio synthesis
  - Multilingual support: i18next / multi-locale dictionary (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, etc.)
- **Backend / Services:**
  - Next.js Route Handlers / FastAPI Python micro-service for heavy document intelligence & OCR pipelines
  - Structured extraction schema enforcement using Zod / Pydantic
  - SQLite / PostgreSQL with Prisma ORM / pgvector for local zero-config testing and cloud scalability
- **Document Intelligence & AI Pipeline:**
  - Multi-engine OCR (Tesseract / Vision LLM with bounding box and confidence mapping)
  - Medical Document Parser (Prescription Rx extractor, Lab report normal/abnormal analyzer, Discharge summary parser)
  - Contradiction & Provenance Engine with exact evidence pointers
- **Safety & Compliance Layer:**
  - Hard non-diagnostic guardrails (strict sanitization against diagnostic and prescriptive output)
  - Audit logging with immutable event trail
  - Patient consent capture and verification

---

## 3. Existing Reusable Components

- As this is a clean greenfield start, we will construct reusable design primitives and core clinical modules from the ground up:
  1. `ClinicalEvidenceViewer`: Interactive modal/drawer showing original document snippet + bounding box + confidence score.
  2. `AdaptiveQuestionnaireEngine`: Deterministic state machine layered with AI adaptation.
  3. `MedicalTimelineViewer`: Interactive chronological timeline grouped by encounter, symptom onset, medication changes, and lab results.
  4. `SafetyFlagBanner`: Non-diagnostic triage alert for doctor review (Priority Level: High/Medium/Low, Source: Red-Flag Rule Engine).
  5. `DoctorVerificationConsole`: Diff view allowing 1-click verify, edit, or reject for every AI-extracted point.
  6. `AyushIntakeModule`: Structured assessment for Prakriti/Dosha balance, traditional remedies, and lifestyle routines.

---

## 4. Existing Bugs & Initial Technical Risks

- **Risk 1: AI Hallucinations in Medical Extraction:**
  - *Mitigation:* Zero ungrounded assertions. Every extracted item must carry an explicit `provenance` object containing `{ source_type: 'document' | 'voice' | 'touch', source_id: string, page_or_offset: string, confidence: number }`.
- **Risk 2: Accidental Diagnostic/Prescriptive Output:**
  - *Mitigation:* Deterministic post-processing safety filter that rejects/transforms diagnostic verbs ("diagnosed with", "prescribe", "treatment is") into observation-only clinical phrasing ("patient reports symptoms consistent with review needed for...", "reported current medication: ...").
- **Risk 3: Incomplete or Missing AYUSH-Modern Cross-Referencing:**
  - *Mitigation:* Unified data schema supporting both modern Allopathic parameters and AYUSH clinical categories (Prakriti, Agni, Dhatu, previous Ayurvedic/Homeopathic medications) without data loss.

---

## 5. Existing Security & Privacy Concerns

- **Patient Health Information (PHI) Protection:**
  - Client-side document sanitization / encryption at rest.
  - Role-based separation: Patient intake mode vs. Doctor verification mode.
  - Consent tracking: Explicit patient consent recording before document ingestion or voice capture.
- **Audit Trails:**
  - Every modification, doctor verification, or rejection must be written to an append-only audit log with timestamp, user role, and previous/new state values.
- **DISHA / ABDM Alignment:**
  - Ensure data structures map seamlessly to ABDM Health Document Specifications and FHIR R4 Bundle resources.

---

## 6. Existing Technical Debt

- **Zero Legacy Debt:** Greenfield workspace allows establishing clean type-safe boundaries, test-driven harnesses (Vitest / Jest / Playwright), and modular directory structures from Day 1.

---

## 7. What Should Be Built — Layer 1 Implementation Plan

### Module 1: Project Scaffolding & Design System
- Modern Next.js TypeScript project with Tailwind CSS, clinical component kit, and end-to-end test configuration.

### Module 2: Medical Domain Models & Safety Guardrail Engine
- FHIR-aligned TypeScript schemas for Patient, Encounter, Chief Complaint, Timeline Event, Document Extraction, AYUSH Profile, Red-Flag Alert, and Verification State.
- Non-diagnostic guardrail validator and provenance validator.

### Module 3: Multi-Modal Patient Case-Taking Engine
- Voice & touch multilingual case-taking interface with adaptive follow-up generator and AYUSH history collector.

### Module 4: Medical Document Intelligence Engine
- Upload, OCR, segmentation, and structured information extraction for prescriptions, diagnostic lab tests, and discharge summaries with confidence scoring.

### Module 5: Clinical Intelligence, Timeline & Discrepancy Engine
- Chronological timeline builder, missing information detector, and contradiction engine.

### Module 6: Physician Pre-Consultation Dashboard
- Comprehensive doctor interface with evidence inspection, draft clinical summary, 1-click verification/editing/rejection, and audit trails.

### Module 7: End-to-End Testing & Verification Suite
- Unit tests, integration tests, safety guardrail tests, edge-case tests, and manual verification documentation.
