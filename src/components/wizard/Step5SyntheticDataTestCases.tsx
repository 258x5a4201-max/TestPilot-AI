import React, { useState } from "react";
import {
  Database,
  Code2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Play,
  FileCode,
  Tag,
  CheckCircle2,
} from "lucide-react";
import type { SyntheticDataset, TestCase } from "../../types/index.ts";

interface Step5Props {
  syntheticDatasets: SyntheticDataset[];
  testCases: TestCase[];
  onNext: () => void;
  onBack: () => void;
}

export const Step5SyntheticDataTestCases: React.FC<Step5Props> = ({
  syntheticDatasets,
  testCases,
  onNext,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"synthetic" | "testcases">("synthetic");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <span>Step 5 of 6</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" />
              <span>Synthetic Payloads & Test Automation Code</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Field-level edge datasets and Given/When/Then Playwright automation suites.
            </p>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% PII-Free Privacy Guarantee</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("synthetic")}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === "synthetic"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Synthetic Datasets per Field ({syntheticDatasets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("testcases")}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === "testcases"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Playwright Test Suites ({testCases.length})</span>
          </button>
        </div>

        {/* Tab 1: Synthetic Datasets */}
        {activeTab === "synthetic" && (
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syntheticDatasets.map((ds) => {
                const categoryColor =
                  ds.category === "valid"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : ds.category === "boundary" || ds.category === "edge"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : ds.category === "unicode"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : ds.category === "malicious"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/20";

                return (
                  <div
                    key={ds.fieldId}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {ds.fieldName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">({ds.fieldType})</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${categoryColor}`}>
                        {ds.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">{ds.description}</p>

                    {/* Values Pill Box */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Payload Values:
                      </span>
                      <div className="space-y-1">
                        {ds.values.map((val, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 break-all"
                          >
                            {val.length === 0 ? <span className="text-slate-600 italic">&lt;empty string&gt;</span> : val}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Test Cases (Given / When / Then + Playwright) */}
        {activeTab === "testcases" && (
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {testCases.map((tc) => (
              <div
                key={tc.id}
                className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {tc.id}
                    </span>
                    <h4 className="text-sm font-bold text-white">{tc.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {tc.category}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        tc.priority === "critical"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : tc.priority === "high"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {tc.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{tc.description}</p>

                {/* Given / When / Then BDD cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-sky-400 block mb-1">
                      Given
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{tc.given}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                      When
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{tc.when}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                      Then
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{tc.then}</p>
                  </div>
                </div>

                {/* Runnable Playwright Code block */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-mono text-[11px] flex items-center gap-1.5 text-slate-300">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Playwright TypeScript Script</span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(tc.id, tc.playwrightCode)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === tc.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 text-slate-300 text-xs font-mono overflow-x-auto">
                    <code>{tc.playwrightCode}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Strategy</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Execute Autonomous Tests (Step 6)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
