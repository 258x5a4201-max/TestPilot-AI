import React, { useState } from "react";
import {
  Play,
  StopCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Terminal,
  Activity,
  BarChart3,
  ExternalLink,
  Download,
  Share2,
  RefreshCw,
  Eye,
  Code2,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import type {
  TestRunReport,
  TestExecutionResult,
  TestStrategyItem,
} from "../../types/index.ts";
import { useAuth } from "../../context/AuthContext.tsx";

interface Step6Props {
  report: TestRunReport | null;
  isRunning: boolean;
  currentTestName?: string;
  progressPercent: number;
  liveLogs: string[];
  onStartExecution: () => void;
  onKillSwitch: () => void;
  onRestart: () => void;
  onViewReportsDashboard: () => void;
}

export const Step6ExecutionReport: React.FC<Step6Props> = ({
  report,
  isRunning,
  currentTestName,
  progressPercent,
  liveLogs,
  onStartExecution,
  onKillSwitch,
  onRestart,
  onViewReportsDashboard,
}) => {
  const { can } = useAuth();
  const [selectedResult, setSelectedResult] = useState<TestExecutionResult | null>(null);

  const handleExportJSON = () => {
    if (!can("export_reports")) {
      alert("Permission Denied: Requires Tester or Admin role to export reports.");
      return;
    }
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `testpilot-report-${report.id}.json`;
    a.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <span>Step 6 of 6</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-400" />
              <span>Autonomous Execution & Audit Report</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live execution of 14 testing plugins, real-time logs, and AI-suggested bug fixes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={onKillSwitch}
                disabled={!can("stop_runs")}
                title={can("stop_runs") ? "Instantly stop the active test run" : "Requires Tester role to abort test runs"}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all ${
                  can("stop_runs")
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 cursor-pointer animate-pulse"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                }`}
              >
                <StopCircle className="w-4 h-4" />
                <span>{can("stop_runs") ? "Kill Switch (Stop Run)" : "Stop Run (Tester only)"}</span>
              </button>
            ) : !report ? (
              <button
                onClick={onStartExecution}
                disabled={!can("run_tests")}
                title={can("run_tests") ? "Start executing automated test suites" : "Requires Tester role to run tests (Viewer is read-only)"}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${
                  can("run_tests")
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer"
                    : "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-70"
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{can("run_tests") ? "Start Autonomous Run" : "Start Run (Requires Tester)"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onRestart}
                  disabled={!can("run_tests")}
                  title={can("run_tests") ? "Re-run the test suite from scratch" : "Requires Tester role to re-run test suite"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    can("run_tests")
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      : "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-run Tests</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={!can("export_reports")}
                  title={can("export_reports") ? "Download structured JSON report" : "Requires Tester role to export report data"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    can("export_reports")
                      ? "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30 cursor-pointer"
                      : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON Report</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Running Live State */}
        {isRunning && (
          <div className="space-y-5 mb-8">
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Currently Running: <strong className="text-white">{currentTestName || "Initializing..."}</strong></span>
                </span>
                <span className="font-mono text-cyan-300 font-bold">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Live Terminal Log Stream */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Live Execution Terminal Stream</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Stream Active</span>
                </div>
              </div>
              <div className="p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-64 overflow-y-auto">
                {liveLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-slate-600 select-none">[{index + 1}]</span>
                    <span
                      className={
                        log.includes("ERROR") || log.includes("FAILED")
                          ? "text-rose-400 font-semibold"
                          : log.includes("PASS") || log.includes("COMPLETED")
                          ? "text-emerald-400 font-semibold"
                          : log.includes("WARN")
                          ? "text-amber-300 font-semibold"
                          : "text-slate-300"
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Report Overview */}
        {report && (
          <div className="space-y-6">
            {/* Top Score & Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Health Score Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Overall Health Score
                </div>
                <div
                  className={`text-4xl font-black ${
                    report.healthScore >= 85
                      ? "text-emerald-400"
                      : report.healthScore >= 70
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {report.healthScore}
                  <span className="text-xl font-medium text-slate-500">/100</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {report.healthScore >= 85
                    ? "Production Ready"
                    : report.healthScore >= 70
                    ? "Minor Warnings Found"
                    : "Action Required"}
                </div>
              </div>

              {/* Tests Pass/Fail */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Test Outcomes
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-emerald-400">{report.passedCount}</span>
                  <span className="text-xs text-slate-400 font-medium">Passed</span>
                  <span className="text-3xl font-extrabold text-rose-400 ml-2">{report.failedCount}</span>
                  <span className="text-xs text-slate-400 font-medium">Failed</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Total {report.totalTests} suites executed in {(report.totalDurationMs / 1000).toFixed(1)}s
                </div>
              </div>

              {/* Bug Severities */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Severity Ranking
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <span>Critical</span>
                    <strong className="font-bold">{report.severityCounts.critical}</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <span>High</span>
                    <strong className="font-bold">{report.severityCounts.high}</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300">
                    <span>Medium</span>
                    <strong className="font-bold">{report.severityCounts.medium}</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    <span>Low</span>
                    <strong className="font-bold">{report.severityCounts.low}</strong>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Performance & Throttling
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">p95 Latency:</span>
                    <strong className="font-mono">{report.performanceMetrics.p95ResponseTimeMs}ms</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Throughput:</span>
                    <strong className="font-mono">{report.performanceMetrics.requestsPerSecond} req/s</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Rate Limit:</span>
                    <span className="text-emerald-400 font-bold">
                      {report.performanceMetrics.rateLimitDetected
                        ? `HTTP 429 @ ${report.performanceMetrics.rateLimitRpsThreshold} RPS`
                        : "No Throttling"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Executive Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/25">
              <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Principal Architect Executive Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {report.aiExecutiveSummary}
              </p>
            </div>

            {/* Test Results List & Drill-Down Button */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Test Execution Results & Fix Suggestions
                </h3>
                <span className="text-xs text-slate-400">Click any card to inspect logs & code fixes</span>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {report.results.map((res) => {
                  const isPassed = res.status === "passed";
                  return (
                    <div
                      key={res.testId}
                      onClick={() => setSelectedResult(res)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        !isPassed
                          ? "bg-rose-950/15 border-rose-500/30 hover:border-rose-500/50"
                          : res.errorDetails?.selfHealed
                          ? "bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50"
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {isPassed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {res.category}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-white">
                                {res.testName}
                              </h4>
                              {res.errorDetails?.selfHealed && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Self-Healed
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {res.stepsExecuted.length} steps executed • {res.durationMs}ms duration
                              {res.errorDetails && (
                                <span className="text-rose-400 font-medium ml-2">
                                  — {res.errorDetails.message}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                            <span>Drill Down</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Drill-Down Inspector Modal */}
        {selectedResult && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedResult.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        selectedResult.status === "passed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {selectedResult.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedResult.testName}</h3>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Execution Steps */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Executed Steps
                </h4>
                <div className="space-y-1.5">
                  {selectedResult.stepsExecuted.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {step.status === "passed" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className="text-slate-200">{step.step}</span>
                      </div>
                      <span className="text-slate-500">{step.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Failure Analysis & Code Fix (Section 6) */}
              {selectedResult.errorDetails && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>AI Root-Cause Diagnosis</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedResult.errorDetails.rootCause}
                  </p>

                  <div className="text-xs">
                    <strong className="text-slate-400 uppercase tracking-wider block mb-1">
                      Reproduction Steps:
                    </strong>
                    <ol className="list-decimal list-inside text-slate-300 space-y-1">
                      {selectedResult.errorDetails.reproductionSteps.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <strong className="text-indigo-300 uppercase tracking-wider text-xs block mb-1 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" /> AI Code-Level Fix Suggestion:
                    </strong>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                      <code>{selectedResult.errorDetails.suggestedFix}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Headless Screenshot Preview */}
              {selectedResult.screenshotUrl && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Headless Browser Render Screenshot
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                    <img
                      src={selectedResult.screenshotUrl}
                      alt="Headless browser capture"
                      className="w-full rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Restart New Wizard Run</span>
          </button>

          <button
            type="button"
            onClick={onViewReportsDashboard}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>Open Executive Dashboard & Trends</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
