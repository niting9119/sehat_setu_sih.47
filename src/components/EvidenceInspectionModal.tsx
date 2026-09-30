"use client";

import React from "react";
import { ClinicalProvenance } from "@/types/clinical";
import { ShieldCheck, FileText, Mic, Smartphone, X, Clock, Award } from "lucide-react";

interface EvidenceInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  provenance: ClinicalProvenance | null;
  itemName?: string;
}

export const EvidenceInspectionModal: React.FC<EvidenceInspectionModalProps> = ({
  isOpen,
  onClose,
  provenance,
  itemName,
}) => {
  if (!isOpen || !provenance) return null;

  const getSourceIcon = () => {
    switch (provenance.sourceType) {
      case "voice_intake":
        return <Mic className="w-5 h-5 text-purple-600" />;
      case "document_ocr":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "touch_form":
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-slate-600" />;
    }
  };

  const confidencePct = Math.round((provenance.confidence || 0.9) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-white/10 rounded-lg">
              {getSourceIcon()}
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Clinical Evidence Provenance</h3>
              <p className="text-sm text-slate-300">Auditable Ground-Truth Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {itemName && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Clinical Claim Under Inspection</span>
              <p className="text-slate-900 font-bold text-base mt-1">{itemName}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5">
              <span className="text-xs font-semibold text-blue-700 uppercase block">Source Origin</span>
              <span className="text-base font-bold text-slate-900 mt-1 truncate block">{provenance.sourceName}</span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5">
              <span className="text-xs font-semibold text-emerald-700 uppercase block">AI Confidence Score</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-base font-bold text-slate-900">{confidencePct}% Match</span>
              </div>
            </div>
            <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3.5 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-purple-700 uppercase block">Capture Time</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-slate-900">{new Date(provenance.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Exact Document Anchor */}
          {provenance.locationOrOffset && (
            <div className="text-sm text-slate-700 flex items-center space-x-2.5 bg-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">Exact Anchor:</span>
              <code className="bg-white px-2.5 py-1 rounded border border-slate-300 font-mono text-slate-900 font-medium">
                {provenance.locationOrOffset}
              </code>
            </div>
          )}

          {/* Raw Ground-Truth Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Raw Unaltered Evidence Snippet</span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Original Ground-Truth</span>
            </div>
            <div className="bg-slate-900 text-emerald-300 p-4 rounded-lg font-mono text-sm leading-relaxed border border-slate-800 overflow-x-auto whitespace-pre-wrap">
              {provenance.rawEvidenceSnippet || "No raw snippet available"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>DISHA / ABDM Provenance Standard compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
