"use client";

import React from "react";
import { AuditLogEntry } from "@/types/clinical";
import { ShieldCheck, Clock, User, ArrowRight } from "lucide-react";

interface AuditTrailViewProps {
  auditTrail: AuditLogEntry[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ auditTrail }) => {
  const getActionBadge = (action: AuditLogEntry["action"]) => {
    switch (action) {
      case "ITEM_VERIFIED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">VERIFIED BY DOCTOR</span>;
      case "ITEM_MODIFIED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">MODIFIED BY DOCTOR</span>;
      case "ITEM_REJECTED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">REJECTED BY DOCTOR</span>;
      case "VOICE_RECORDED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-900 border border-purple-300">VOICE INTAKE</span>;
      case "DOCUMENT_UPLOADED":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">OCR INGESTION</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800">{action}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-lg text-slate-900">Immutable Audit Trail</h3>
        </div>
        <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
          Total Recorded Actions: {auditTrail.length}
        </span>
      </div>

      <div className="space-y-3">
        {auditTrail.map((entry) => (
          <div
            key={entry.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5">
                {getActionBadge(entry.action)}
                <span className="text-base font-bold text-slate-900">{entry.targetEntity}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600 font-mono">
                <span className="inline-flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{entry.actor.name} ({entry.actor.role})</span>
                </span>
                <span className="inline-flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed">{entry.details}</p>

            {(entry.previousValue || entry.newValue) && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-3 text-sm font-mono">
                <span className="text-slate-500 truncate max-w-xs">{entry.previousValue || "Initial state"}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-emerald-800 font-bold truncate max-w-xs">{entry.newValue}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
