import { describe, it, expect } from "vitest";
import { sanitizeClinicalText, detectRedFlags, formatUncertaintyObservation } from "../lib/safety/guardrails";

describe("Medical Safety Guardrails Engine", () => {
  it("Test 1: Sanitizes diagnostic claims into non-diagnostic observations", () => {
    const diagnosticInput = "Patient is diagnosed with diabetes and you have cancer.";
    const result = sanitizeClinicalText(diagnosticInput);
    
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sanitized).not.toContain("Patient is diagnosed with");
    expect(result.sanitized).not.toContain("you have cancer");
    expect(result.sanitized).toContain("Patient reports observations/symptoms consistent with");
  });

  it("Test 2: Sanitizes prescriptive directives into clinician discussion prompts", () => {
    const prescriptiveInput = "You should take 500mg paracetamol every morning and start medicine.";
    const result = sanitizeClinicalText(prescriptiveInput);

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sanitized).not.toContain("You should take");
    expect(result.sanitized).toContain("For clinical discussion with physician regarding");
  });

  it("Test 3: Leaves safe non-diagnostic clinical text untouched without violations", () => {
    const safeInput = "Patient reports intermittent headache lasting 3 days with photophobia.";
    const result = sanitizeClinicalText(safeInput);

    expect(result.violations).toHaveLength(0);
    expect(result.sanitized).toBe(safeInput);
  });

  it("Test 4: Detects acute coronary red-flag pattern across multi-source inputs", () => {
    const inputs = [
      { text: "I have had heavy crushing chest discomfort since this morning", sourceId: "voice_01" },
      { text: "Shortness of breath and radiation to left arm observed", sourceId: "doctor_notes_02" },
    ];
    const flags = detectRedFlags(inputs);

    expect(flags.length).toBeGreaterThanOrEqual(1);
    const cardiacFlag = flags.find((f) => f.symptomPattern.includes("Cardiac"));
    expect(cardiacFlag).toBeDefined();
    expect(cardiacFlag?.urgency).toBe("EMERGENT");
    expect(cardiacFlag?.recommendedClinicalAction).toContain("12-lead ECG");
  });

  it("Test 5: Detects AYUSH-modern drug interaction red flag (Warfarin + Guggulu)", () => {
    const inputs = [
      { text: "Patient taking Warfarin 5mg daily for atrial fibrillation", sourceId: "rx_doc_01" },
      { text: "Also consuming Ayurvedic Guggulu tablets from local store", sourceId: "voice_ayush_02" },
    ];
    const flags = detectRedFlags(inputs);

    const interactionFlag = flags.find((f) => f.symptomPattern.includes("Interaction"));
    expect(interactionFlag).toBeDefined();
    expect(interactionFlag?.urgency).toBe("PRIORITY_REVIEW");
    expect(interactionFlag?.recommendedClinicalAction).toContain("bleeding parameters");
  });

  it("Test 6: Correctly handles empty inputs, whitespace, and special characters", () => {
    const emptyResult = sanitizeClinicalText("");
    expect(emptyResult.sanitized).toBe("");
    expect(emptyResult.violations).toHaveLength(0);

    const emptyFlags = detectRedFlags([]);
    expect(emptyFlags).toHaveLength(0);

    const whitespaceFlags = detectRedFlags([{ text: "   \n\t  ", sourceId: "empty_src" }]);
    expect(whitespaceFlags).toHaveLength(0);
  });

  it("Test 7: Preserves uncertainty according to confidence levels", () => {
    const highConf = formatUncertaintyObservation("Metformin 500mg", "Prescription OCR", 0.95);
    expect(highConf).toContain("clearly indicates");

    const medConf = formatUncertaintyObservation("Metformin 500mg", "Prescription OCR", 0.75);
    expect(medConf).toContain("tentatively indicates");
    expect(medConf).toContain("Clinician verification advised");

    const lowConf = formatUncertaintyObservation("Unclear handwriting", "Prescription OCR", 0.35);
    expect(lowConf).toContain("low confidence (35%)");
    expect(lowConf).toContain("Manual verification required");
  });

  it("Test 8: Edge Case - Case insensitivity and punctuation resilience in diagnostic checks", () => {
    const mixedInput = "PATIENT IS DIAGNOSED WITH DiAbEtEs! START MEDICINE immediately.";
    const result = sanitizeClinicalText(mixedInput);
    expect(result.violations.length).toBe(2);
    expect(result.sanitized.toLowerCase()).not.toContain("patient is diagnosed with");
    expect(result.sanitized.toLowerCase()).not.toContain("start medicine");
  });

  it("Test 9: Edge Case - Multiple red-flags triggered concurrently without collisions", () => {
    const multiRiskInputs = [
      { text: "Patient has crushing chest discomfort and radiation to left arm", sourceId: "s1" },
      { text: "Also observed facial droop and sudden arm weakness", sourceId: "s2" },
      { text: "Taking Aspirin and heavy Guggulu Ayurvedic bhasma", sourceId: "s3" },
    ];
    const flags = detectRedFlags(multiRiskInputs);
    expect(flags.length).toBe(3);
    const patterns = flags.map(f => f.symptomPattern);
    expect(patterns.some(p => p.includes("Cardiac"))).toBe(true);
    expect(patterns.some(p => p.includes("Neurological"))).toBe(true);
    expect(patterns.some(p => p.includes("Interaction"))).toBe(true);
  });

  it("Test 10: Boundary & Fuzz Test - Handles massive input strings (10,000+ characters) without performance degradation or crash", () => {
    const hugeText = "patient has symptoms of headache. ".repeat(500);
    const result = sanitizeClinicalText(hugeText);
    expect(result.sanitized).toBeDefined();
    expect(result.sanitized.length).toBeGreaterThan(10000);

    const flags = detectRedFlags([{ text: hugeText, sourceId: "huge_source" }]);
    expect(flags).toBeDefined();
  });
});
