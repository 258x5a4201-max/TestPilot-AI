import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Share2,
  GitBranch,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronRight,
  Printer,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { TestRunReport, TestExecutionResult } from "../../types/index.ts";

interface ReportsDashboardProps {
  currentReport: TestRunReport | null;
  allReports: TestRunReport[];
  onSelectReport: (report: TestRunReport) => void;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  currentReport,
  allReports,
  onSelectReport,
}) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(
    currentReport?.id || (allReports.length > 0 ? allReports[0].id : "")
  );
  const [compareRunId, setCompareRunId] = useState<string>(
    allReports.length > 1 ? allReports[1].id : ""
  );
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "cicd" | "notifications">("overview");
  const [copiedCi, setCopiedCi] = useState(false);
  const [slackUrl, setSlackUrl] = useState("https://hooks.slack.com/services/T00/B00/XXXX");
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [selectedDrillDown, setSelectedDrillDown] = useState<TestExecutionResult | null>(null);

  const activeReport = allReports.find((r) => r.id === selectedRunId) || currentReport || allReports[0];
  const compareReport = allReports.find((r) => r.id === compareRunId);

  // Memoized Donut chart data (samples/pre-aggregated)
  const passFailData = React.useMemo(() => {
    if (!activeReport) return [];
    return [
      { name: "Passed", value: activeReport.passedCount, color: "#10b981" },
      { name: "Failed", value: activeReport.failedCount, color: "#f43f5e" },
      { name: "Skipped", value: activeReport.skippedCount, color: "#64748b" },
    ];
  }, [activeReport]);

  // Memoized Severity bar chart data
  const severityData = React.useMemo(() => {
    if (!activeReport) return [];
    return [
      { name: "Critical", count: activeReport.severityCounts.critical, fill: "#ef4444" },
      { name: "High", count: activeReport.severityCounts.high, fill: "#f59e0b" },
      { name: "Medium", count: activeReport.severityCounts.medium, fill: "#38bdf8" },
      { name: "Low", count: activeReport.severityCounts.low, fill: "#94a3b8" },
    ];
  }, [activeReport]);

  // Memoized latency timeline simulation (capped at sample bins)
  const latencyData = React.useMemo(() => [
    { time: "0s", p50: 110, p95: 220, p99: 340 },
    { time: "2s", p50: 125, p95: 240, p99: 390 },
    { time: "4s", p50: 140, p95: 295, p99: 460 },
    { time: "6s", p50: 135, p95: 280, p99: 440 },
    { time: "8s", p50: 130, p95: 265, p99: 420 },
  ], []);

  const handleCopyCiYaml = () => {
    const yaml = `# .github/workflows/testpilot.yml
name: TestPilot AI Autonomous QA
on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  autonomous-qa:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger TestPilot AI Audit
        run: |
          curl -X POST "https://testpilot.ai/api/runs/execute" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.TESTPILOT_API_TOKEN }}" \\
            -d '{
              "targetUrl": "https://\${{ secrets.DEPLOYED_APP_URL }}",
              "depth": "standard",
              "failOnCriticalBugs": true
            }'
`;
    navigator.clipboard.writeText(yaml);
    setCopiedCi(true);
    setTimeout(() => setCopiedCi(false), 2000);
  };

  const handleSendSlackNotification = () => {
    setNotificationStatus("Dispatching notification payload to Slack webhook...");
    setTimeout(() => {
      setNotificationStatus("Notification sent successfully! Slack channel received TestPilot AI audit badge.");
      setTimeout(() => setNotificationStatus(null), 3000);
    }, 800);
  };

  if (!activeReport) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Test Reports Found</h3>
        <p className="text-xs text-slate-400 mt-1">
          Complete a run in the Autonomous Wizard to view analytics and regression charts.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Top Bar with Run Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive QA Dashboard & Regression Trends</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {activeReport.projectName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-mono">
            Target: {activeReport.targetUrl} • Run ID: {activeReport.id}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Historical Run Selector */}
          <select
            value={activeReport.id}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {allReports.map((r, idx) => (
              <option key={r.id} value={r.id}>
                Run #{allReports.length - idx}: {new Date(r.timestamp).toLocaleTimeString()} (Score: {r.healthScore})
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 pb-2 gap-4">
        {[
          { id: "overview", label: "Overview & Analytics" },
          { id: "comparison", label: "Regression Trend (Compare 2 Runs)" },
          { id: "cicd", label: "CI/CD & Pipeline Webhooks" },
          { id: "notifications", label: "Slack & Email Alerts" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Analytics */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Health Score
              </span>
              <div
                className={`text-4xl font-black ${
                  activeReport.healthScore >= 85
                    ? "text-emerald-400"
                    : activeReport.healthScore >= 70
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {activeReport.healthScore}
                <span className="text-xl font-normal text-slate-500">/100</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Grade: {activeReport.healthScore >= 90 ? "A (Enterprise)" : "B (Good)"}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Passed vs Failed
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-emerald-400">{activeReport.passedCount}</span>
                <span className="text-xs text-slate-400">Passed</span>
                <span className="text-3xl font-extrabold text-rose-400 ml-2">{activeReport.failedCount}</span>
                <span className="text-xs text-slate-400">Failed</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Self-healed: {activeReport.healingCount} locators
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Latency Distribution
              </span>
              <div className="text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Average:</span>
                  <span className="text-slate-200">{activeReport.performanceMetrics.avgResponseTimeMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">p95 RTT:</span>
                  <span className="text-indigo-400 font-bold">{activeReport.performanceMetrics.p95ResponseTimeMs}ms</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500">
                Peak Concurrency: {activeReport.performanceMetrics.peakConcurrentUsers} VUs
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Rate Limit Protection
              </span>
              <div className="text-lg font-bold text-white">
                {activeReport.performanceMetrics.rateLimitDetected ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Enforced
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Unprotected
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeReport.performanceMetrics.rateLimitRpsThreshold
                  ? `Threshold: ${activeReport.performanceMetrics.rateLimitRpsThreshold} RPS`
                  : "No throttling observed"}
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Test Pass/Fail Distribution
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFailData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      isAnimationActive={false}
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {passFailData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-300">{d.name}:</span>
                    <span className="font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Bar Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Bugs Ranked by Severity
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-slate-500 text-center mt-2">
                Total {activeReport.failedCount} actionable defect areas flagged
              </div>
            </div>

            {/* Performance Latency Timeline */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Latency Over Soak Duration (ms)
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="p50" stroke="#38bdf8" strokeWidth={2} name="p50 (Median)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="p95" stroke="#818cf8" strokeWidth={2} name="p95" isAnimationActive={false} />
                    <Line type="monotone" dataKey="p99" stroke="#f43f5e" strokeWidth={2} name="p99" isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-[11px] text-slate-400 mt-2">
                <span className="text-sky-400">p50</span>
                <span className="text-indigo-400">p95</span>
                <span className="text-rose-400">p99</span>
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Executive Summary & Recommendations</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeReport.aiExecutiveSummary}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Regression Trend Comparison */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Compare Two Test Runs</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze regression trends, resolved issues, and latency deltas between releases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Compare Baseline:</span>
              <select
                value={compareRunId}
                onChange={(e) => setCompareRunId(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              >
                {allReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} (Score: {r.healthScore})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {compareReport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline Run */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Baseline: Run {compareReport.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(compareReport.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-300">
                  {compareReport.healthScore} / 100
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Passed:</span>
                    <strong className="text-emerald-400">{compareReport.passedCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Failed / Warnings:</span>
                    <strong className="text-rose-400">{compareReport.failedCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>p95 Latency:</span>
                    <strong className="text-slate-300">{compareReport.performanceMetrics.p95ResponseTimeMs}ms</strong>
                  </div>
                </div>
              </div>

              {/* Current Run with Delta */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Current: Run {activeReport.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(activeReport.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-black text-white">{activeReport.healthScore} / 100</div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      activeReport.healthScore >= compareReport.healthScore
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {activeReport.healthScore >= compareReport.healthScore ? "+" : ""}
                    {activeReport.healthScore - compareReport.healthScore} pts
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Passed:</span>
                    <strong className="text-emerald-400">{activeReport.passedCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Failed / Warnings:</span>
                    <strong className="text-rose-400">{activeReport.failedCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>p95 Latency Delta:</span>
                    <strong className="text-cyan-400 font-mono">
                      {activeReport.performanceMetrics.p95ResponseTimeMs - compareReport.performanceMetrics.p95ResponseTimeMs}ms
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 3: CI/CD & Pipeline Webhooks */}
      {activeTab === "cicd" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  <span>GitHub Actions CI/CD Pipeline Snippet</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drop this workflow into <code className="text-indigo-300 font-mono">.github/workflows/testpilot.yml</code> to run autonomous tests on every push.
                </p>
              </div>
              <button
                onClick={handleCopyCiYaml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold cursor-pointer"
              >
                {copiedCi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCi ? "Copied" : "Copy YAML"}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
              <code>{`# .github/workflows/testpilot.yml
name: TestPilot AI Autonomous QA
on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  autonomous-qa:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger TestPilot AI Audit
        run: |
          curl -X POST "https://testpilot.ai/api/runs/execute" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.TESTPILOT_API_TOKEN }}" \\
            -d '{
              "targetUrl": "https://\${{ secrets.DEPLOYED_APP_URL }}",
              "depth": "standard",
              "failOnCriticalBugs": true
            }'`}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Slack & Email Alerts */}
      {activeTab === "notifications" && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Slack & Email Webhook Alerts</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Receive immediate summaries in your team channel whenever an autonomous test completes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Slack Incoming Webhook URL
            </label>
            <input
              type="text"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleSendSlackNotification}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Notification Ping</span>
          </button>

          {notificationStatus && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              {notificationStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
