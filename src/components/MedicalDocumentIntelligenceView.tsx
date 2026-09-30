"use client";

import React, { useState } from "react";
import {
  PatientCaseSession,
  ClinicalProvenance,
} from "@/types/clinical";
import { processMedicalDocument } from "@/lib/documents/extractor";
import { EvidenceInspectionModal } from "@/components/EvidenceInspectionModal";
import {
  FileText,
  UploadCloud,
  FileCheck,
  Pill,
  Activity,
  Sparkles,
  Eye,
} from "lucide-react";

interface MedicalDocumentIntelligenceViewProps {
  session: PatientCaseSession;
  onUpdateSession: (newSession: PatientCaseSession) => void;
}

export const MedicalDocumentIntelligenceView: React.FC<MedicalDocumentIntelligenceViewProps> = ({
  session,
  onUpdateSession,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    session.uploadedDocuments[0]?.id || ""
  );
  const [activeTab, setActiveTab] = useState<"prescriptions" | "labs" | "raw_ocr">("prescriptions");
  const [inspectProvenance, setInspectProvenance] = useState<ClinicalProvenance | null>(null);
  const [inspectItemName, setInspectItemName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const currentDoc = session.uploadedDocuments.find((d) => d.id === selectedDocId) || session.uploadedDocuments[0];

  const handleUploadSampleDoc = (sampleType: "prescription" | "lab" | "discharge") => {
    setIsProcessing(true);

    setTimeout(() => {
      let sampleName = "Apollo_Prescription.pdf";
      let sampleText = "";

      if (sampleType === "prescription") {
        sampleName = `Rx_Dr_Mukherjee_${Date.now().toString().slice(-4)}.pdf`;
        sampleText = `DR. ARUP MUKHERJEE, MD (MEDICINE)\nDate: 2026-07-22\nRx:\nTab. Metformin 1000mg - BD x 60 days\nTab. Telmisartan 40mg - OD in morning\nTab. Atorvastatin 20mg - HS x 30 days\nCap. Pantoprazole 40mg - OD before breakfast`;
      } else if (sampleType === "lab") {
        sampleName = `Thyrocare_Lipid_Panel_${Date.now().toString().slice(-4)}.pdf`;
        sampleText = `THYROCARE DIAGNOSTICS LABORATORY\nDate: 2026-09-10\nPATIENT INVESTIGATION REPORT\nFasting Blood Sugar: 164 mg/dL\nHbA1c: 8.7 %\nTotal Cholesterol: 245 mg/dL\nSerum Creatinine: 1.1 mg/dL\nPlatelet Count: 2.8 lakh/cumm`;
      } else {
        sampleName = `Fortis_Discharge_Summary_${Date.now().toString().slice(-4)}.pdf`;
        sampleText = `FORTIS ESCORTS HEART INSTITUTE\nDISCHARGE SUMMARY\nAdmission Date: 2026-04-10\nDischarge Date: 2026-04-14\nHospital Course: Patient admitted with unstable angina. Managed medically. Discharge medications initiated.`;
      }

      const extracted = processMedicalDocument(sampleName, sampleText, 64200);
      const updatedDocs = [extracted, ...session.uploadedDocuments];

      const updatedSession: PatientCaseSession = {
        ...session,
        uploadedDocuments: updatedDocs,
        updatedAt: new Date().toISOString(),
      };

      onUpdateSession(updatedSession);
      setSelectedDocId(extracted.id);
      setIsProcessing(false);
    }, 1200);
  };

  const handleInspect = (provenance: ClinicalProvenance, name: string) => {
    setInspectProvenance(provenance);
    setInspectItemName(name);
  };

  return (
    <div className="space-y-6">
      <EvidenceInspectionModal
        isOpen={!!inspectProvenance}
        onClose={() => setInspectProvenance(null)}
        provenance={inspectProvenance}
        itemName={inspectItemName}
      />

      {/* Header & Upload Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3.5">
              <span className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Medical Document Intelligence</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  OCR Extraction, Clinical Segmentation, Reference Interval Evaluation & Provenance
                </p>
              </div>
            </div>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex items-center space-x-2.5">
            <span className="text-sm font-semibold text-slate-600 hidden sm:inline">Add Sample Document:</span>
            <button
              disabled={isProcessing}
              onClick={() => handleUploadSampleDoc("prescription")}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-sm font-semibold rounded-lg transition"
            >
              <Pill className="w-4 h-4 text-blue-700" />
              <span>+ Prescription</span>
            </button>
            <button
              disabled={isProcessing}
              onClick={() => handleUploadSampleDoc("lab")}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-sm font-semibold rounded-lg transition"
            >
              <Activity className="w-4 h-4 text-purple-700" />
              <span>+ Lab Report</span>
            </button>
            <button
              disabled={isProcessing}
              onClick={() => handleUploadSampleDoc("discharge")}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-sm font-semibold rounded-lg transition"
            >
              <FileText className="w-4 h-4 text-slate-700" />
              <span>+ Discharge</span>
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-900 flex items-center space-x-2.5 animate-pulse">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
            <span>Processing document image with OCR Vision & Clinical Entity Segmentation...</span>
          </div>
        )}
      </div>

      {/* Main Grid: Document List + Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Documents List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Ingested Documents ({session.uploadedDocuments.length})
          </h3>

          <div className="space-y-2.5">
            {session.uploadedDocuments.map((doc) => {
              const isSelected = doc.id === currentDoc?.id;
              const isLab = doc.documentType === "lab_report";
              const isRx = doc.documentType === "prescription";

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-xs ${
                    isSelected
                      ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          isRx ? "bg-blue-100 text-blue-700" : isLab ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isRx ? <Pill className="w-5 h-5" /> : isLab ? <Activity className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 truncate max-w-[170px]">{doc.fileName}</h4>
                        <p className="text-sm text-slate-600">{doc.issuingDoctorOrHospital}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                      {doc.documentType.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-slate-100">
                    <span>Date: <strong className="text-slate-800">{doc.documentDate}</strong></span>
                    <span className="text-emerald-800 font-semibold font-mono">
                      OCR {Math.round(doc.confidenceScore * 100)}% Conf
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Document Deep Dive */}
        {currentDoc ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="font-bold text-lg text-slate-900">{currentDoc.fileName}</h3>
                    <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md">
                      {currentDoc.documentType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Source: <strong className="text-slate-800">{currentDoc.issuingDoctorOrHospital}</strong> | Date: <strong className="text-slate-800">{currentDoc.documentDate}</strong>
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-lg">
                  {currentDoc.prescriptions.length > 0 && (
                    <button
                      onClick={() => setActiveTab("prescriptions")}
                      className={`px-3.5 py-1.5 text-sm font-semibold rounded-md transition ${
                        activeTab === "prescriptions"
                          ? "bg-white text-blue-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Rx Medications ({currentDoc.prescriptions.length})
                    </button>
                  )}
                  {currentDoc.labResults.length > 0 && (
                    <button
                      onClick={() => setActiveTab("labs")}
                      className={`px-3.5 py-1.5 text-sm font-semibold rounded-md transition ${
                        activeTab === "labs"
                          ? "bg-white text-purple-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Lab Results ({currentDoc.labResults.length})
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("raw_ocr")}
                    className={`px-3.5 py-1.5 text-sm font-semibold rounded-md transition ${
                      activeTab === "raw_ocr"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    OCR Bounding Boxes
                  </button>
                </div>
              </div>

              {/* Tab 1: Extracted Prescriptions */}
              {activeTab === "prescriptions" && currentDoc.prescriptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Extracted Medications with Dosage & Route
                  </h4>
                  <div className="space-y-2.5">
                    {currentDoc.prescriptions.map((drug, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-blue-50/40 transition"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <span className="text-base font-bold text-slate-900">{drug.drugName}</span>
                              {drug.strength && (
                                <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                                  {drug.strength}
                                </span>
                              )}
                              <span className="text-sm text-slate-600 font-mono">({drug.form})</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">
                              <strong>Instructions:</strong> {drug.dosageInstructions} | <strong>Duration:</strong> {drug.duration || "As prescribed"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleInspect(
                              {
                                sourceId: currentDoc.id,
                                sourceType: "document_ocr",
                                sourceName: currentDoc.fileName,
                                locationOrOffset: `Prescription line #${idx + 1}`,
                                timestamp: currentDoc.uploadedAt,
                                confidence: drug.confidence,
                                rawEvidenceSnippet: drug.rawLine,
                              },
                              `${drug.drugName} ${drug.strength || ""}`
                            )
                          }
                          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-xs"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>View Evidence</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Extracted Lab Results */}
              {activeTab === "labs" && currentDoc.labResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Laboratory Investigations Evaluated Against Standard Intervals
                  </h4>
                  <div className="space-y-2.5">
                    {currentDoc.labResults.map((lab, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border flex items-center justify-between transition ${
                          lab.interpretationHint === "Critical"
                            ? "bg-rose-50 border-rose-300"
                            : lab.isAbnormal
                            ? "bg-amber-50 border-amber-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <div
                            className={`p-2.5 rounded-lg ${
                              lab.isAbnormal ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <span className="text-base font-bold text-slate-900">{lab.testName}</span>
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase ${
                                  lab.interpretationHint === "Critical"
                                    ? "bg-rose-600 text-white"
                                    : lab.isAbnormal
                                    ? "bg-amber-500 text-white"
                                    : "bg-emerald-100 text-emerald-900"
                                }`}
                              >
                                {lab.interpretationHint || "Normal"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-slate-700 mt-1">
                              <span>
                                Observed: <strong className="text-slate-950 font-bold">{lab.observedValue}</strong>
                              </span>
                              <span>Reference Range: <strong className="text-slate-800">{lab.referenceRange || "Standard"}</strong></span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleInspect(
                              {
                                sourceId: currentDoc.id,
                                sourceType: "document_ocr",
                                sourceName: currentDoc.fileName,
                                locationOrOffset: `Lab Param [${lab.testName}]`,
                                timestamp: currentDoc.uploadedAt,
                                confidence: lab.confidence,
                                rawEvidenceSnippet: `${lab.testName}: ${lab.observedValue} (Ref: ${lab.referenceRange})`,
                              },
                              `${lab.testName} = ${lab.observedValue}`
                            )
                          }
                          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-xs"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>View Evidence</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: OCR Bounding Box Canvas */}
              {activeTab === "raw_ocr" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Bounding Box Geometry & Optical Character Recognition</span>
                    <span className="text-emerald-800 font-bold">100% Geometry Mapped</span>
                  </div>
                  <div className="bg-slate-900 text-slate-200 p-5 rounded-lg font-mono text-sm leading-relaxed border border-slate-800 space-y-2.5 max-h-80 overflow-y-auto">
                    {currentDoc.ocrBoundingBoxes?.map((box, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded bg-slate-800 hover:bg-blue-900/50 border border-slate-700 flex items-center justify-between transition cursor-pointer"
                        title={`BBox: [${box.bbox.join(", ")}]`}
                      >
                        <span className="text-emerald-400 font-medium truncate">{box.text}</span>
                        <span className="text-xs text-slate-400 shrink-0 ml-3">
                          bbox: [{box.bbox.slice(0, 2).join(",")}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-600">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-semibold">No document selected. Choose a document on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
};
