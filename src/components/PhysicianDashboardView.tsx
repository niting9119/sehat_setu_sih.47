"use client";

import React, { useState } from "react";
import {
  PatientCaseSession,
  VerifiableItem,
  ClinicalProvenance,
} from "@/types/clinical";
import {
  verifyItem,
  modifyItem,
  rejectItem,
  finalizeVerifiedClinicalRecord,
} from "@/lib/doctor/verification";
import { EvidenceInspectionModal } from "@/components/EvidenceInspectionModal";
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  FileCheck,
  Eye,
  Download,
  Info,
  Leaf,
  Calendar,
  UserCheck,
} from "lucide-react";

interface PhysicianDashboardViewProps {
  session: PatientCaseSession;
  onUpdateSession: (newSession: PatientCaseSession) => void;
}

export const PhysicianDashboardView: React.FC<PhysicianDashboardViewProps> = ({
  session,
  onUpdateSession,
}) => {
  const [inspectProvenance, setInspectProvenance] = useState<ClinicalProvenance | null>(null);
  const [inspectItemName, setInspectItemName] = useState<string>("");

  const [activeTimelineFilter, setActiveTimelineFilter] = useState<string>("all");
  const [doctorFinalNotes, setDoctorFinalNotes] = useState<string>(
    "Patient reviewed. Suspected acute coronary syndrome presentation with elevated HbA1c (8.9%) and baseline hypertension. Advised emergent 12-lead ECG, cardiac biomarkers, and medication reconciliation."
  );

  const [modifyModalItem, setModifyModalItem] = useState<{
    item: VerifiableItem<any>;
    category: "conditions" | "meds" | "allergies" | "ayush";
  } | null>(null);
  const [editValueText, setEditValueText] = useState<string>("");
  const [editReasonText, setEditReasonText] = useState<string>("");

  const [rejectModalItem, setRejectModalItem] = useState<{
    item: VerifiableItem<any>;
    category: "conditions" | "meds" | "allergies" | "ayush";
  } | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>("");

  const [exportedReport, setExportedReport] = useState<string | null>(null);

  const handleInspect = (provenance: ClinicalProvenance, name: string) => {
    setInspectProvenance(provenance);
    setInspectItemName(name);
  };

  const handleVerify = (
    item: VerifiableItem<any>,
    category: "conditions" | "meds" | "allergies" | "ayush"
  ) => {
    const { updatedItem, auditEntry } = verifyItem(item, "Dr. K. S. Iyengar, MD");
    applyItemUpdate(updatedItem, auditEntry, category);
  };

  const openModifyModal = (
    item: VerifiableItem<any>,
    category: "conditions" | "meds" | "allergies" | "ayush"
  ) => {
    setModifyModalItem({ item, category });
    setEditValueText(typeof item.value === "string" ? item.value : JSON.stringify(item.value));
    setEditReasonText("Dosage or frequency updated after direct patient review.");
  };

  const handleSaveModification = () => {
    if (!modifyModalItem) return;
    let parsedVal = editValueText;
    try {
      if (editValueText.startsWith("{")) parsedVal = JSON.parse(editValueText);
    } catch (e) {
      parsedVal = editValueText;
    }

    const { updatedItem, auditEntry } = modifyItem(
      modifyModalItem.item,
      parsedVal,
      editReasonText || "Modified by clinician",
      "Dr. K. S. Iyengar, MD"
    );
    applyItemUpdate(updatedItem, auditEntry, modifyModalItem.category);
    setModifyModalItem(null);
  };

  const openRejectModal = (
    item: VerifiableItem<any>,
    category: "conditions" | "meds" | "allergies" | "ayush"
  ) => {
    setRejectModalItem({ item, category });
    setRejectReasonText("Inaccurate extraction or discontinued medication.");
  };

  const handleSaveRejection = () => {
    if (!rejectModalItem) return;
    const { updatedItem, auditEntry } = rejectItem(
      rejectModalItem.item,
      rejectReasonText || "Rejected by clinician",
      "Dr. K. S. Iyengar, MD"
    );
    applyItemUpdate(updatedItem, auditEntry, rejectModalItem.category);
    setRejectModalItem(null);
  };

  const applyItemUpdate = (
    updatedItem: VerifiableItem<any>,
    auditEntry: any,
    category: "conditions" | "meds" | "allergies" | "ayush"
  ) => {
    const updatedModern = { ...session.modernHistory };
    const updatedAyush = { ...session.ayushHistory };

    if (category === "conditions") {
      updatedModern.pastMedicalConditions = updatedModern.pastMedicalConditions.map((i) =>
        i.id === updatedItem.id ? updatedItem : i
      );
    } else if (category === "meds") {
      updatedModern.currentMedications = updatedModern.currentMedications.map((i) =>
        i.id === updatedItem.id ? updatedItem : i
      );
    } else if (category === "allergies") {
      updatedModern.knownAllergies = updatedModern.knownAllergies.map((i) =>
        i.id === updatedItem.id ? updatedItem : i
      );
    } else if (category === "ayush") {
      updatedAyush.traditionalRemediesUsed = updatedAyush.traditionalRemediesUsed.map((i) =>
        i.id === updatedItem.id ? updatedItem : i
      );
    }

    const newSession: PatientCaseSession = {
      ...session,
      modernHistory: updatedModern,
      ayushHistory: updatedAyush,
      auditTrail: [auditEntry, ...session.auditTrail],
      updatedAt: new Date().toISOString(),
    };

    onUpdateSession(newSession);
  };

  const handleFinalizeAndExport = () => {
    const finalized = finalizeVerifiedClinicalRecord(
      session,
      "Dr. K. S. Iyengar, MD",
      doctorFinalNotes
    );
    setExportedReport(finalized.fhirReadySummary);
  };

  const filteredTimeline = session.timeline.filter((e) => {
    if (activeTimelineFilter === "all") return true;
    if (activeTimelineFilter === "meds") return e.category === "medication_start" || e.category === "medication_stop";
    if (activeTimelineFilter === "labs") return e.category === "lab_test";
    if (activeTimelineFilter === "ayush") return e.category === "ayush_intervention";
    if (activeTimelineFilter === "priority") return e.isFlaggedPriority;
    return true;
  });

  const getStatusBadge = (status: VerifiableItem<any>["status"]) => {
    switch (status) {
      case "verified_clinician":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            Verified by Doctor
          </span>
        );
      case "modified_clinician":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            Modified by Doctor
          </span>
        );
      case "rejected_clinician":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-purple-50 text-purple-800 border border-purple-300">
            AI Extracted (Unverified)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <EvidenceInspectionModal
        isOpen={!!inspectProvenance}
        onClose={() => setInspectProvenance(null)}
        provenance={inspectProvenance}
        itemName={inspectItemName}
      />

      {/* Modify Modal */}
      {modifyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <span>Clinician Adjustment</span>
            </h3>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Adjusted Clinical Value</label>
              <textarea
                rows={2}
                value={editValueText}
                onChange={(e) => setEditValueText(e.target.value)}
                className="w-full text-base p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Clinical Note / Reason</label>
              <textarea
                rows={2}
                value={editReasonText}
                onChange={(e) => setEditReasonText(e.target.value)}
                className="w-full text-base p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setModifyModalItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModification}
                className="px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject AI Claim</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This item will be marked as discarded in the case record while preserving provenance in the audit log.
            </p>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Reason for Rejection</label>
              <textarea
                rows={2}
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="e.g. OCR misread, medication discontinued by patient"
                className="w-full text-base p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRejection}
                className="px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {exportedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">ABDM / FHIR Pre-Consultation Summary</h3>
              </div>
              <button
                onClick={() => setExportedReport(null)}
                className="text-sm font-bold text-slate-500 hover:text-slate-800"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-900 text-emerald-300 p-5 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {exportedReport}
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportedReport);
                  alert("Copied case record to clipboard!");
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setExportedReport(null)}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-slate-900">{session.demographics.fullName}</h2>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Consent Recorded</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-sm text-slate-700">
              <span><strong>Age:</strong> {session.demographics.age} years</span>
              <span><strong>Gender:</strong> {session.demographics.gender.toUpperCase()}</span>
              <span><strong>ABHA ID:</strong> {session.demographics.abhaId || "ABDM-TEMP"}</span>
              <span><strong>Language:</strong> {session.demographics.preferredLanguage.toUpperCase()}</span>
              <span><strong>Case ID:</strong> {session.caseId}</span>
            </div>
          </div>

          <button
            onClick={handleFinalizeAndExport}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Generate Verified Case Record</span>
          </button>
        </div>
      </div>

      {/* Red-Flag Priority Triage Alert Banner */}
      {session.redFlags.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Priority Symptom Alerts ({session.redFlags.length})</span>
            </div>
            <span className="text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md">
              Triage Review Only (Non-Diagnostic)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {session.redFlags.map((rf) => (
              <div key={rf.id} className="bg-white border border-rose-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-base">
                  <span>{rf.symptomPattern}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-100 text-rose-900">
                    {rf.urgency}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{rf.reasonForFlag}</p>
                <div className="pt-1.5 text-sm text-rose-900 font-semibold border-t border-rose-100">
                  <strong>Recommended Action:</strong> {rf.recommendedClinicalAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions & Missing Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contradictions */}
        <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Cross-Source Discrepancies ({session.contradictions.length})</span>
          </div>
          {session.contradictions.map((c) => (
            <div key={c.id} className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 space-y-3">
              <span className="font-bold text-slate-900 block text-base">{c.topic}</span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <span className="font-semibold text-slate-600 block text-xs mb-1">{c.sourceA.sourceName}:</span>
                  <span className="text-slate-900 font-medium">{c.sourceA.statement}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <span className="font-semibold text-slate-600 block text-xs mb-1">{c.sourceB.sourceName}:</span>
                  <span className="text-slate-900 font-medium">{c.sourceB.statement}</span>
                </div>
              </div>
              <p className="text-amber-900 text-sm leading-relaxed">{c.clinicalImpactDescription}</p>
              <div className="text-sm font-semibold text-slate-800 bg-amber-100/80 p-2.5 rounded-md">
                <strong>Clinician Inquiry:</strong> {c.clinicianResolutionPrompt}
              </div>
            </div>
          ))}
        </div>

        {/* Missing Info */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-base">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Missing Information Prompts ({session.missingInformation.length})</span>
          </div>
          {session.missingInformation.map((m) => (
            <div key={m.id} className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-2">
              <span className="font-bold text-slate-900 block text-base">{m.field}</span>
              <p className="text-slate-700 text-sm leading-relaxed">{m.reasonNeeded}</p>
              <div className="text-sm font-semibold text-blue-900 bg-blue-100/80 p-2.5 rounded-md">
                <strong>Suggested Inquiry:</strong> {m.suggestedInquiry}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Physician Verification Console */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              <span>Clinician Verification Console</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Review AI extractions. Verify accuracy, modify with clinical notes, or reject assumptions.
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
            Reviewing: Dr. K. S. Iyengar, MD
          </span>
        </div>

        {/* Section 1: Past Medical Conditions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Past Medical Conditions ({session.modernHistory.pastMedicalConditions.length})
          </h4>
          <div className="space-y-2.5">
            {session.modernHistory.pastMedicalConditions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-bold text-slate-900">{item.value}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    Source: {item.provenance.sourceName}
                    {item.clinicianNotes && <span className="ml-2 text-emerald-800 font-medium">| Note: {item.clinicianNotes}</span>}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleInspect(item.provenance, item.value)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Evidence</span>
                  </button>
                  <button
                    onClick={() => handleVerify(item, "conditions")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={() => openModifyModal(item, "conditions")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-sm font-semibold shadow-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openRejectModal(item, "conditions")}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold border border-rose-200"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Current Medications */}
        <div className="space-y-3 pt-3">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Current Medications & Adherence ({session.modernHistory.currentMedications.length})
          </h4>
          <div className="space-y-2.5">
            {session.modernHistory.currentMedications.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-bold text-slate-900">
                      {item.value.drugName} {item.value.dosage}
                    </span>
                    <span className="text-sm text-slate-600 font-mono">({item.value.frequency || "daily"})</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    Source: {item.provenance.sourceName} | Adherence: <strong className="text-slate-800">{item.value.adherence}</strong>
                    {item.clinicianNotes && <span className="ml-2 text-emerald-800 font-medium">| Note: {item.clinicianNotes}</span>}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleInspect(item.provenance, `${item.value.drugName} ${item.value.dosage}`)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Evidence</span>
                  </button>
                  <button
                    onClick={() => handleVerify(item, "meds")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={() => openModifyModal(item, "meds")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-sm font-semibold shadow-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openRejectModal(item, "meds")}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold border border-rose-200"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: AYUSH Traditional Remedies */}
        <div className="space-y-3 pt-3">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-amber-600" />
            <span>AYUSH Traditional Formulations ({session.ayushHistory.traditionalRemediesUsed.length})</span>
          </h4>
          <div className="space-y-2.5">
            {session.ayushHistory.traditionalRemediesUsed.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-amber-50/20 flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-bold text-slate-900">{item.value.formulationName}</span>
                    <span className="text-sm bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md font-semibold border border-amber-200">
                      {item.value.ayushSystem}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    Duration: {item.value.duration} | Effect: {item.value.perceivedEffect}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleInspect(item.provenance, item.value.formulationName)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Evidence</span>
                  </button>
                  <button
                    onClick={() => handleVerify(item, "ayush")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={() => openModifyModal(item, "ayush")}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-sm font-semibold shadow-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openRejectModal(item, "ayush")}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold border border-rose-200"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chronological Medical Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg text-slate-900">Chronological Medical Timeline</h3>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-sm font-semibold">
            {["all", "priority", "labs", "meds", "ayush"].map((flt) => (
              <button
                key={flt}
                onClick={() => setActiveTimelineFilter(flt)}
                className={`px-3.5 py-1.5 rounded-md capitalize transition ${
                  activeTimelineFilter === flt
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {flt}
              </button>
            ))}
          </div>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-300 space-y-5 my-2">
          {filteredTimeline.map((event) => (
            <div key={event.id} className="relative group">
              <span
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  event.isFlaggedPriority ? "bg-rose-500" : "bg-blue-500"
                }`}
              />
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-blue-50/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{event.title}</span>
                  <span className="text-sm font-mono text-slate-600 font-semibold">{event.date}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{event.description}</p>
                <div className="mt-2.5 flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-slate-200">
                  <span>Source: <strong className="text-slate-800">{event.provenance.sourceName}</strong></span>
                  <button
                    onClick={() => handleInspect(event.provenance, event.title)}
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    View Source Evidence
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
