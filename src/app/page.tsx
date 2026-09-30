"use client";

import React, { useState } from "react";
import { INITIAL_SAMPLE_CASE } from "@/lib/mock/sampleCase";
import { PatientCaseSession } from "@/types/clinical";
import { PatientCaseTakingView } from "@/components/PatientCaseTakingView";
import { MedicalDocumentIntelligenceView } from "@/components/MedicalDocumentIntelligenceView";
import { PhysicianDashboardView } from "@/components/PhysicianDashboardView";
import { AuditTrailView } from "@/components/AuditTrailView";
import {
  HeartPulse,
  Stethoscope,
  FileText,
  ShieldCheck,
  RotateCcw,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const [session, setSession] = useState<PatientCaseSession>(INITIAL_SAMPLE_CASE);
  const [activeNav, setActiveNav] = useState<"doctor" | "intake" | "documents" | "audit">("doctor");

  const handleResetSampleCase = () => {
    setSession(JSON.parse(JSON.stringify(INITIAL_SAMPLE_CASE)));
  };

  const navItems = [
    { id: "doctor", label: "Physician Review", icon: Stethoscope },
    { id: "intake", label: "Patient Case-Taking", icon: HeartPulse },
    { id: "documents", label: "Medical Documents & OCR", icon: FileText },
    { id: "audit", label: `Audit Trail (${session.auditTrail.length})`, icon: Lock },
  ] as const;

  return (
    <main className="min-h-screen flex flex-col bg-slate-50/60 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    Sehat<span className="text-emerald-600">Setu</span>
                  </span>
                  <span className="text-sm font-semibold text-slate-400">|</span>
                  <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    Clinical Intelligence
                  </span>
                </div>
                <p className="text-sm text-slate-600 hidden sm:block mt-0.5">
                  AI Patient Case-Taking & Medical Document Intelligence (SIH 26047)
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Safety Badge */}
              <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Non-Diagnostic Guardrails Active</span>
              </div>

              {/* Reset */}
              <button
                onClick={handleResetSampleCase}
                className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition border border-slate-300"
                title="Reset sample case"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset Case</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-2 border-t border-slate-100 py-2.5 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`inline-flex items-center space-x-2.5 px-4 py-2.5 text-base font-semibold rounded-lg transition whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeNav === "doctor" && (
          <PhysicianDashboardView
            session={session}
            onUpdateSession={(s) => setSession(s)}
          />
        )}
        {activeNav === "intake" && (
          <PatientCaseTakingView
            session={session}
            onUpdateSession={(s) => setSession(s)}
          />
        )}
        {activeNav === "documents" && (
          <MedicalDocumentIntelligenceView
            session={session}
            onUpdateSession={(s) => setSession(s)}
          />
        )}
        {activeNav === "audit" && <AuditTrailView auditTrail={session.auditTrail} />}
      </div>

      {/* Minimal Accessible Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 mt-auto text-center text-sm text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p className="leading-relaxed">
            <strong className="text-slate-800">Clinical Safety Notice:</strong> Sehat Setu is a clinical workflow preparation engine. It does not provide autonomous diagnoses or treatment prescriptions. All AI extractions require physician verification.
          </p>
        </div>
      </footer>
    </main>
  );
}
