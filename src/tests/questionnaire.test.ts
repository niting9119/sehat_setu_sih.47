import { describe, it, expect } from "vitest";
import {
  CORE_INTAKE_QUESTIONS,
  MULTILINGUAL_DICTIONARY,
  getActiveQuestions,
  synthesizeIntakeSession,
  createIntakeProvenance,
  SupportedLanguage,
} from "../lib/intake/questionnaire";

describe("Adaptive Multi-Modal Questionnaire Engine", () => {
  it("Test 1: Verifies full multilingual coverage across all 6 supported languages", () => {
    const supportedLangs: SupportedLanguage[] = ["en", "hi", "bn", "ta", "te", "mr"];
    
    // Check dictionary
    for (const lang of supportedLangs) {
      expect(MULTILINGUAL_DICTIONARY[lang]).toBeDefined();
      expect(MULTILINGUAL_DICTIONARY[lang].nativeName.length).toBeGreaterThan(0);
    }

    // Check every question has valid text and voice prompts in all 6 languages
    for (const q of CORE_INTAKE_QUESTIONS) {
      for (const lang of supportedLangs) {
        const trans = q.translations[lang];
        expect(trans).toBeDefined();
        expect(trans.text.length).toBeGreaterThan(0);
        expect(trans.voicePromptText.length).toBeGreaterThan(0);
      }
    }
  });

  it("Test 2: Dynamic Adaptive Branching - Chest pain triggers adaptive follow-up", () => {
    // Initial answers without chest pain
    const answersGeneral = {
      q_chief_complaint: "Mild knee pain after walking",
    };
    const activeQuestionsGen = getActiveQuestions(answersGeneral);
    const hasAdaptiveGen = activeQuestionsGen.some((q) => q.id === "q_adaptive_chest_pain_radiation");
    expect(hasAdaptiveGen).toBe(false);

    // Answers with chest pain
    const answersChest = {
      q_chief_complaint: "Severe chest pain and tightness",
    };
    const activeQuestionsChest = getActiveQuestions(answersChest);
    const hasAdaptiveChest = activeQuestionsChest.some((q) => q.id === "q_adaptive_chest_pain_radiation");
    expect(hasAdaptiveChest).toBe(true);

    // Multilingual chest pain trigger (e.g. Hindi "सीने में दर्द")
    const answersHindiChest = {
      q_chief_complaint: "सीने में तेज भारीपन और दर्द है",
    };
    const activeQuestionsHindi = getActiveQuestions(answersHindiChest);
    expect(activeQuestionsHindi.some((q) => q.id === "q_adaptive_chest_pain_radiation")).toBe(true);
  });

  it("Test 3: Synthesizes structured Modern and AYUSH clinical history", () => {
    const userAnswers = {
      q_chief_complaint: "Severe headache and burning stomach",
      q_symptom_duration: "1-7d",
      q_symptom_severity: 8,
      q_ayush_agni_appetite: "tikshna",
      q_ayush_traditional_meds: "Ashwagandha Churna 1 spoon with warm water",
      q_ayush_sleep_nidra: "disturbed",
    };

    const result = synthesizeIntakeSession(userAnswers, "voice_intake");

    // Check Modern complaint synthesis
    expect(result.chiefComplaints).toHaveLength(1);
    expect(result.chiefComplaints[0].complaint).toBe("Severe headache and burning stomach");
    expect(result.chiefComplaints[0].severity).toBe("severe");
    expect(result.chiefComplaints[0].duration).toBe("1-7d");
    expect(result.chiefComplaints[0].provenance.sourceType).toBe("voice_intake");

    // Check AYUSH synthesis
    expect(result.ayushHistory.agniStatus).toBe("Tikshna (Intense - Pitta)");
    expect(result.ayushHistory.prakritiAssessment?.dominantDosha).toBe("Pitta");
    expect(result.ayushHistory.sleepPatternNidra.quality).toBe("Disturbed");
    expect(result.ayushHistory.traditionalRemediesUsed).toHaveLength(1);
    expect(result.ayushHistory.traditionalRemediesUsed[0].value.formulationName).toContain("Ashwagandha");
    expect(result.ayushHistory.traditionalRemediesUsed[0].value.ayushSystem).toBe("Ayurveda");
  });

  it("Test 4: Provenance tracking maintains source metadata and timestamp integrity", () => {
    const prov = createIntakeProvenance("q_symptom_duration", "1-7d", "touch_form", 0.99);
    expect(prov.sourceType).toBe("touch_form");
    expect(prov.locationOrOffset).toBe("Question [q_symptom_duration]");
    expect(prov.confidence).toBe(0.99);
    expect(prov.rawEvidenceSnippet).toBe("1-7d");
    expect(Date.parse(prov.timestamp)).not.toBeNaN();
  });

  it("Test 5: Edge Case - Gracefully handles empty or partial answers without crashing", () => {
    const emptyAnswers = {};
    const activeQuestions = getActiveQuestions(emptyAnswers);
    expect(activeQuestions.length).toBeGreaterThan(0);

    const session = synthesizeIntakeSession(emptyAnswers, "touch_form");
    expect(session.chiefComplaints).toBeDefined();
    expect(session.chiefComplaints[0].complaint).toBe("General discomfort");
    expect(session.ayushHistory.agniStatus).toBe("Sama (Balanced)");
    expect(session.ayushHistory.traditionalRemediesUsed).toHaveLength(0);
  });

  it("Test 6: Correctly classifies Homeopathy, Unani, and Siddha formulations", () => {
    const homeoSession = synthesizeIntakeSession({
      q_chief_complaint: "Bruising after fall",
      q_ayush_traditional_meds: "Arnica Montana 200CH drops",
    });
    expect(homeoSession.ayushHistory.traditionalRemediesUsed[0].value.ayushSystem).toBe("Homeopathy");

    const siddhaSession = synthesizeIntakeSession({
      q_chief_complaint: "Viral fever",
      q_ayush_traditional_meds: "Nilavembu Kudineer herbal decoction",
    });
    expect(siddhaSession.ayushHistory.traditionalRemediesUsed[0].value.ayushSystem).toBe("Siddha");

    const unaniSession = synthesizeIntakeSession({
      q_chief_complaint: "Cough and cold",
      q_ayush_traditional_meds: "Unani Joshanda herbal tea",
    });
    expect(unaniSession.ayushHistory.traditionalRemediesUsed[0].value.ayushSystem).toBe("Unani");
  });

  it("Test 7: Boundary Test - Severity scale clamps appropriately across extreme scores", () => {
    const maxSession = synthesizeIntakeSession({
      q_chief_complaint: "Excruciating pain",
      q_symptom_severity: "10",
    });
    expect(maxSession.chiefComplaints[0].severity).toBe("severe");

    const lowSession = synthesizeIntakeSession({
      q_chief_complaint: "Very mild tingling",
      q_symptom_severity: "2",
    });
    expect(lowSession.chiefComplaints[0].severity).toBe("mild");
  });

  it("Test 8: Multilingual Adaptive Triggers - Correctly branches on Tamil (நெஞ்சு), Telugu (ఛాతీ), and Marathi (छाती)", () => {
    const tamilActive = getActiveQuestions({ q_chief_complaint: "கடுமையான நெஞ்சு வலி உள்ளது" });
    expect(tamilActive.some((q) => q.id === "q_adaptive_chest_pain_radiation")).toBe(true);

    const teluguActive = getActiveQuestions({ q_chief_complaint: "ఛాతీ నొప్పి మరియు ఆయాసం" });
    expect(teluguActive.some((q) => q.id === "q_adaptive_chest_pain_radiation")).toBe(true);

    const marathiActive = getActiveQuestions({ q_chief_complaint: "छातीत खूप दुखत आहे" });
    expect(marathiActive.some((q) => q.id === "q_adaptive_chest_pain_radiation")).toBe(true);
  });
});
