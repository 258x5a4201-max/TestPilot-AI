import React, { useState } from "react";
import {
  BrainCircuit,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  Flame,
  AlertTriangle,
  Lock,
} from "lucide-react";
import type { TestStrategyItem, TargetConfig } from "../../types/index.ts";
import { useAuth } from "../../context/AuthContext.tsx";

interface Step4Props {
  strategies: TestStrategyItem[];
  targetConfig: TargetConfig;
  onToggleStrategy: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4StrategySelection: React.FC<Step4Props> = ({
  strategies,
  targetConfig,
  onToggleStrategy,
  onSelectAll,
  onNext,
  onBack,
}) => {
  const { can } = useAuth();
  const [filterTab, setFilterTab] = useState<"all" | "selected" | "skipped">("all");

  const selectedCount = strategies.filter((s) => s.selected).length;
  const skippedCount = strategies.filter((s) => !s.selected).length;
  const estimatedTimeSec = strategies
    .filter((s) => s.selected)
    .reduce((acc, curr) => acc + curr.estimatedDurationSec, 0);

  const displayList = strategies.filter((item) => {
    if (filterTab === "selected") return item.selected;
    if (filterTab === "skipped") return !item.selected;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <span>Step 4 of 6</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
              <span>AI Test Strategy Engine</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Gemini analyzed your App Map and selected optimal testing modules based on risk & component exposure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectAll(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => onSelectAll(false)}
              className="text-xs text-slate-400 hover:text-slate-300 font-semibold cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Strategy Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Selected Tests</div>
              <div className="text-2xl font-extrabold text-emerald-400">{selectedCount}</div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400/40" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Skipped / Excluded</div>
              <div className="text-2xl font-extrabold text-slate-400">{skippedCount}</div>
            </div>
            <XCircle className="w-6 h-6 text-slate-500/40" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Estimated Runtime</div>
              <div className="text-2xl font-extrabold text-indigo-400">
                {Math.ceil(estimatedTimeSec / 60)} min {estimatedTimeSec % 60}s
              </div>
            </div>
            <Clock className="w-6 h-6 text-indigo-400/40" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex gap-2">
            {[
              { id: "all", label: `All Modules (${strategies.length})` },
              { id: "selected", label: `Selected (${selectedCount})` },
              { id: "skipped", label: `Skipped (${skippedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Toggle switches to customize your test plan
          </span>
        </div>

        {/* Strategy Table */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {displayList.map((item) => {
            const isBlockedByVerification = item.isIntrusive && !targetConfig.verifiedOwnership;
            const isBlockedByRole = item.isIntrusive
              ? !can("run_intrusive_tests")
              : !can("run_tests");
            const isToggleDisabled = isBlockedByVerification || isBlockedByRole;

            const tooltipMessage = !can("run_tests")
              ? "Requires Tester role to modify test strategy (Viewer is read-only)"
              : item.isIntrusive && !can("run_intrusive_tests")
              ? "Requires Admin role to enable intrusive tests"
              : isBlockedByVerification
              ? "Domain verification required to enable intrusive tests"
              : "Toggle this testing plugin";

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.selected
                    ? "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/30 border-slate-900 opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {item.category}
                      </span>
                      {item.isIntrusive ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" /> Intrusive
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Safe
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        Risk: <strong className="text-rose-400">{item.riskScore}/100</strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Confidence: <strong className="text-cyan-400">{item.confidenceScore}%</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Gemini AI Justification */}
                    <div className="text-xs text-indigo-300/90 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-500/15 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-indigo-200">AI Selection Reason:</strong> {item.reason}
                        {item.skipReason && (
                          <span className="text-amber-300 block mt-0.5 font-semibold">
                            Skipped note: {item.skipReason}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right: Toggle Switch & Duration */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <label
                      className={`relative inline-flex items-center ${isToggleDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      title={tooltipMessage}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        disabled={isToggleDisabled}
                        onChange={() => onToggleStrategy(item.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>

                    <div className="text-[11px] text-slate-500 font-mono">
                      ~{item.estimatedDurationSec}s
                    </div>

                    {item.isIntrusive && !can("run_intrusive_tests") ? (
                      <span className="text-[10px] text-purple-400 flex items-center gap-1 font-semibold" title="Requires Admin role">
                        <Lock className="w-3 h-3" /> Admin only
                      </span>
                    ) : isBlockedByVerification ? (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3" /> Verify required
                      </span>
                    ) : !can("run_tests") ? (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Read-only
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App Map</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={selectedCount === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>Proceed to Synthetic Data & Tests</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
