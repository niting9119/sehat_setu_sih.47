"use client";

import React, { useState, useEffect } from "react";
import {
  MULTILINGUAL_DICTIONARY,
  SupportedLanguage,
  getActiveQuestions,
  synthesizeIntakeSession,
} from "@/lib/intake/questionnaire";
import { detectRedFlags } from "@/lib/safety/guardrails";
import { PatientCaseSession, RedFlagAlert } from "@/types/clinical";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  HeartPulse,
  Leaf,
  Activity,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

interface PatientCaseTakingViewProps {
  session: PatientCaseSession;
  onUpdateSession: (newSession: PatientCaseSession) => void;
}

export const PatientCaseTakingView: React.FC<PatientCaseTakingViewProps> = ({
  session,
  onUpdateSession,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    (session.demographics.preferredLanguage as SupportedLanguage) || "hi"
  );
  const [answers, setAnswers] = useState<Record<string, any>>({
    q_chief_complaint: session.chiefComplaints[0]?.complaint || "सीने में भारीपन और बांह में दर्द",
    q_symptom_duration: "1-7d",
    q_symptom_severity: 8,
    q_adaptive_chest_pain_radiation: ["left_arm_radiation", "cold_sweats"],
    q_ayush_agni_appetite: "tikshna",
    q_ayush_traditional_meds: "Yograj Guggulu 2 tabs twice daily",
    q_ayush_sleep_nidra: "disturbed",
  });

  const [activeTab, setActiveTab] = useState<"all" | "modern" | "ayush">("all");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const [speechFeedback, setSpeechFeedback] = useState<string>("");
  const [activeQuestions, setActiveQuestions] = useState(getActiveQuestions(answers));
  const [liveSafetyAlerts, setLiveSafetyAlerts] = useState<RedFlagAlert[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    const updatedQuestions = getActiveQuestions(answers);
    setActiveQuestions(updatedQuestions);

    const combinedInputs = Object.entries(answers).map(([key, val]) => ({
      text: String(val),
      sourceId: key,
    }));
    const flags = detectRedFlags(combinedInputs);
    setLiveSafetyAlerts(flags);
  }, [answers]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTimer((prev) => prev + 1), 1000);
    } else {
      setRecordingTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setSpeechFeedback("Listening... Speak now in " + MULTILINGUAL_DICTIONARY[selectedLanguage].nativeName);

      setTimeout(() => {
        const sampleVoiceInputs: Record<SupportedLanguage, string> = {
          en: "Severe retrosternal chest tightness with sweating since 2 days",
          hi: "पिछले 2 दिनों से सीने में तेज भारीपन और पसीना आ रहा है",
          bn: "গত ২ দিন ধরে বুকে খুব চাপ ও ঘাম হচ্ছে",
          ta: "கடந்த 2 நாட்களாக நெஞ்சில் அதிக பாரமும் வியர்வையும் உள்ளது",
          te: "గత 2 రోజులుగా ఛాతీలో తీవ్రమైన నొప్పి మరియు చెమటలు వస్తున్నాయి",
          mr: "गेल्या २ दिवसांपासून छातीत खूप जडपणा आणि घाम येत आहे",
        };
        const recognized = sampleVoiceInputs[selectedLanguage] || sampleVoiceInputs.hi;
        setAnswers((prev) => ({ ...prev, q_chief_complaint: recognized }));
        setSpeechFeedback("Recognized: \"" + recognized + "\"");
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
      setSpeechFeedback("");
    }
  };

  const handlePlayVoicePrompt = (qId: string, promptText: string) => {
    setIsPlayingAudio(qId);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.lang = selectedLanguage === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(null);
      utterance.onerror = () => setIsPlayingAudio(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(null), 1500);
    }
  };

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSaveAndSync = () => {
    const synthesized = synthesizeIntakeSession(answers, "voice_intake");
    const updatedSession: PatientCaseSession = {
      ...session,
      chiefComplaints: synthesized.chiefComplaints,
      ayushHistory: synthesized.ayushHistory,
      redFlags: liveSafetyAlerts,
      updatedAt: new Date().toISOString(),
    };
    onUpdateSession(updatedSession);
    alert("Case record updated and synchronized successfully!");
  };

  const filteredQuestions = activeQuestions.filter((q) => {
    if (activeTab === "all") return true;
    if (activeTab === "modern") return q.category === "chief_complaint" || q.category === "history_present_illness";
    if (activeTab === "ayush") return q.category === "ayush_history" || q.category === "lifestyle_nidra";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Case-Taking</h2>
            <p className="text-sm text-slate-600 mt-0.5">Voice & touch interactive clinical intake</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Dropdown */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-lg pl-3.5 pr-9 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              {(Object.keys(MULTILINGUAL_DICTIONARY) as SupportedLanguage[]).map((lang) => (
                <option key={lang} value={lang}>
                  {MULTILINGUAL_DICTIONARY[lang].nativeName} ({MULTILINGUAL_DICTIONARY[lang].languageName})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Voice Button */}
          <button
            onClick={handleVoiceToggle}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isRecording ? `${recordingTimer}s Recording...` : "Voice Input"}</span>
          </button>
        </div>
      </div>

      {/* Voice Recognition Feedback */}
      {speechFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-950 flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{speechFeedback}</span>
        </div>
      )}

      {/* Priority Alert Banner */}
      {liveSafetyAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 text-base">Priority Triage Alert ({liveSafetyAlerts.length} Flagged)</span>
              <span className="text-xs font-semibold bg-rose-200 text-rose-900 px-2.5 py-1 rounded-md">Physician Review</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {liveSafetyAlerts.map((f) => f.symptomPattern).join(" • ")}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Fields
        </button>
        <button
          onClick={() => setActiveTab("modern")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg inline-flex items-center space-x-1.5 transition ${
            activeTab === "modern" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Modern Clinical</span>
        </button>
        <button
          onClick={() => setActiveTab("ayush")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg inline-flex items-center space-x-1.5 transition ${
            activeTab === "ayush" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Leaf className="w-4 h-4" />
          <span>AYUSH Intake</span>
        </button>
      </div>

      {/* Questions Form with Accessible Typography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredQuestions.map((q) => {
          const trans = q.translations[selectedLanguage] || q.translations.en;
          const isAdaptive = !!q.adaptiveTrigger;
          const currentValue = answers[q.id];

          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl p-5 border transition shadow-xs flex flex-col justify-between ${
                isAdaptive ? "border-amber-300 bg-amber-50/30 md:col-span-2" : "border-slate-200"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-bold text-slate-900 leading-snug">{trans.text}</span>
                    {isAdaptive && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                        Adaptive Follow-up
                      </span>
                    )}
                  </div>
                  {trans.helperText && (
                    <span className="text-sm text-slate-600 block mt-1">{trans.helperText}</span>
                  )}
                </div>

                <button
                  onClick={() => handlePlayVoicePrompt(q.id, trans.voicePromptText)}
                  className={`p-2 rounded-lg border text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0 ${
                    isPlayingAudio === q.id ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "border-slate-300"
                  }`}
                  title="Listen prompt"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Form Input / Dropdown */}
              <div className="mt-2">
                {/* 1. Text or Voice */}
                {q.type === "text_or_voice" && (
                  <textarea
                    rows={2}
                    value={currentValue || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type symptoms or click 'Voice Input' above..."
                    className="w-full text-base p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                )}

                {/* 2. Single Choice (Dropdown Menu) */}
                {q.type === "single_choice" && trans.options && (
                  <div className="relative">
                    <select
                      value={currentValue || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-lg px-3.5 py-3 pr-9 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                    >
                      <option value="" disabled>
                        -- Select an option (Scroll down to view) --
                      </option>
                      {trans.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                )}

                {/* 3. Multi-Choice (Dropdown Picker with Badges) */}
                {q.type === "multi_choice" && trans.options && (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const selected: string[] = Array.isArray(currentValue) ? currentValue : [];
                          if (!selected.includes(val)) {
                            handleAnswerChange(q.id, [...selected, val]);
                          }
                        }}
                        className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-lg px-3.5 py-3 pr-9 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                      >
                        <option value="">+ Add associated symptom / sign from list...</option>
                        {trans.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                    </div>

                    {/* Selected Tags */}
                    {Array.isArray(currentValue) && currentValue.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {currentValue.map((val: string) => {
                          const optMatch = trans.options?.find((o) => o.value === val);
                          return (
                            <span
                              key={val}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-amber-100 text-amber-950 border border-amber-300"
                            >
                              <span>{optMatch?.label || val}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleAnswerChange(
                                    q.id,
                                    currentValue.filter((v: string) => v !== val)
                                  );
                                }}
                                className="text-amber-800 hover:text-amber-950 font-bold ml-1 text-base leading-none"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Scale */}
                {q.type === "scale" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Mild (1)</span>
                      <span className="font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-300 text-sm">
                        Severity Score: {currentValue || 5} / 10
                      </span>
                      <span>Severe (10)</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={currentValue || 5}
                      onChange={(e) => handleAnswerChange(q.id, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-3">
        <button
          onClick={handleSaveAndSync}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span>Save & Sync Case Record</span>
        </button>
      </div>
    </div>
  );
};
