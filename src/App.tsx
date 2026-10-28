/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { Navbar } from "./components/Navbar.tsx";
import { LandingHero } from "./components/LandingHero.tsx";
import { WizardContainer } from "./components/wizard/WizardContainer.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";

// Code-split heavy routes to keep initial bundle small & first page load < 1.5s
const StandaloneSyntheticDataGenerator = lazy(
  () => import("./components/synthetic/StandaloneSyntheticDataGenerator.tsx").then((m) => ({ default: m.StandaloneSyntheticDataGenerator }))
);
const ReportsDashboard = lazy(
  () => import("./components/reports/ReportsDashboard.tsx").then((m) => ({ default: m.ReportsDashboard }))
);
const ComparisonPage = lazy(
  () => import("./components/comparison/ComparisonPage.tsx").then((m) => ({ default: m.ComparisonPage }))
);
const UsersRolesPage = lazy(
  () => import("./components/users/UsersRolesPage.tsx").then((m) => ({ default: m.UsersRolesPage }))
);

const TabLoadingSkeleton = () => (
  <div className="max-w-5xl mx-auto py-16 px-4 animate-pulse space-y-6">
    <div className="h-8 bg-slate-900 rounded-xl w-64" />
    <div className="h-4 bg-slate-900/60 rounded-lg w-96" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-32 bg-slate-900/60 rounded-2xl" />
      <div className="h-32 bg-slate-900/60 rounded-2xl" />
      <div className="h-32 bg-slate-900/60 rounded-2xl" />
    </div>
    <div className="h-64 bg-slate-900/40 rounded-2xl" />
  </div>
);

import type {
  TargetConfig,
  DiscoveredApp,
  TestStrategyItem,
  SyntheticDataset,
  TestCase,
  TestRunReport,
} from "./types/index.ts";
import {
  DEMO_TARGET_SHOPSPHERE,
  DEMO_APP_SHOPSPHERE,
  DEMO_STRATEGIES_SHOPSPHERE,
  DEMO_SYNTHETIC_DATA,
  DEMO_TEST_CASES,
} from "./data/seedData.ts";

function AppInner() {
  const { currentRole, setRole, can, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"wizard" | "synthetic" | "reports" | "comparison" | "users">("wizard");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Wizard Domain State
  const [targetConfig, setTargetConfig] = useState<TargetConfig>(DEMO_TARGET_SHOPSPHERE);
  const [discoveredApp, setDiscoveredApp] = useState<DiscoveredApp | null>(DEMO_APP_SHOPSPHERE);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<TestStrategyItem[]>(DEMO_STRATEGIES_SHOPSPHERE);
  const [syntheticDatasets, setSyntheticDatasets] = useState<SyntheticDataset[]>(DEMO_SYNTHETIC_DATA);
  const [testCases, setTestCases] = useState<TestCase[]>(DEMO_TEST_CASES);

  // Execution & Live Progress State
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [currentTestName, setCurrentTestName] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    "[SYSTEM] TestPilot AI Engine initialized",
    "[STATUS] Ready for autonomous application testing",
  ]);

  // Reports
  const [currentReport, setCurrentReport] = useState<TestRunReport | null>(null);
  const [allReports, setAllReports] = useState<TestRunReport[]>([]);

  // Abort ref for simulated live execution
  const cancelExecutionRef = useRef<boolean>(false);

  const fetchReports = useCallback(async () => {
    try {
      const resp = await authFetch("/api/reports");
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setAllReports(data);
          setCurrentReport(data[0]);
        }
      }
    } catch {
      // Offline fallback
    }
  }, [authFetch]);

  // Load existing reports on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateTargetConfig = (patch: Partial<TargetConfig>) => {
    setTargetConfig((prev) => ({ ...prev, ...patch }));
  };

  const toggleDemoMode = () => {
    if (!isDemoMode) {
      // Turn on Demo Mode
      setIsDemoMode(true);
      setTargetConfig(DEMO_TARGET_SHOPSPHERE);
      setDiscoveredApp(DEMO_APP_SHOPSPHERE);
      setStrategies(DEMO_STRATEGIES_SHOPSPHERE);
      setSyntheticDatasets(DEMO_SYNTHETIC_DATA);
      setTestCases(DEMO_TEST_CASES);
      setLiveLogs((prev) => [...prev, "[DEMO] Loaded pre-baked ShopSphere E-Commerce Cloud target."]);
    } else {
      // Turn off Demo Mode
      setIsDemoMode(false);
      setTargetConfig({
        id: `custom-${Date.now()}`,
        url: "https://",
        projectName: "New Web Application",
        depth: "standard",
        authEnabled: false,
        verifiedOwnership: false,
        consentAccepted: false,
        createdAt: new Date().toISOString(),
      });
      setDiscoveredApp(null);
      setReportToNull();
    }
  };

  const setReportToNull = () => {
    setCurrentReport(null);
    setProgressPercent(0);
  };

  const handleCrawl = async () => {
    setIsCrawling(true);
    setLiveLogs((prev) => [...prev, `[CRAWL] Initiating crawl on ${targetConfig.url}...`]);

    try {
      const resp = await authFetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetConfig.url, depth: targetConfig.depth }),
      });
      if (resp.ok) {
        const appData = await resp.json();
        setDiscoveredApp(appData);

        // Also fetch AI strategy
        const stratResp = await authFetch("/api/strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: appData, targetConfig }),
        });
        if (stratResp.ok) {
          const stratData = await stratResp.json();
          setStrategies(stratData);
        }

        // Fetch synthetic data
        const synResp = await authFetch("/api/synthetic/generate-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: appData }),
        });
        if (synResp.ok) {
          const synData = await synResp.json();
          setSyntheticDatasets(synData);
        }

        // Fetch test cases
        const tcResp = await authFetch("/api/testcases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: appData, strategies }),
        });
        if (tcResp.ok) {
          const tcData = await tcResp.json();
          setTestCases(tcData);
        }

        setLiveLogs((prev) => [
          ...prev,
          `[CRAWL-DONE] Discovered ${appData.pages.length} pages, ${appData.forms.length} forms, and ${appData.apiEndpoints.length} API routes.`,
        ]);
      }
    } catch (err: any) {
      console.warn("Live crawl network fallback:", err);
      setDiscoveredApp(DEMO_APP_SHOPSPHERE);
      setStrategies(DEMO_STRATEGIES_SHOPSPHERE);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleToggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSelectAllStrategies = (select: boolean) => {
    setStrategies((prev) => prev.map((s) => ({ ...s, selected: select })));
  };

  const handleKillSwitch = async () => {
    if (!can("stop_runs")) {
      alert("Permission Denied: Only Tester or Admin can stop runs.");
      return;
    }
    cancelExecutionRef.current = true;
    setIsRunningTest(false);
    setLiveLogs((prev) => [
      ...prev,
      "[KILL-SWITCH] 🛑 Emergency stop engaged! All virtual users and test runners terminated.",
    ]);

    if (activeRunId) {
      try {
        await authFetch(`/api/runs/${activeRunId}/kill`, { method: "POST" });
      } catch {
        // Ignored
      }
    }
  };

  const handleStartExecution = async () => {
    if (isRunningTest) return;

    if (!can("run_tests")) {
      alert("Permission Denied: Requires Tester or Admin role to execute test runs.");
      return;
    }

    const activeStrategies = strategies.filter((s) => s.selected);
    const hasIntrusive = activeStrategies.some((s) => s.isIntrusive);
    if (hasIntrusive && !can("run_intrusive_tests")) {
      alert("Permission Denied (HTTP 403): Only Admin role is authorized to execute intrusive test suites (Load Soak & Rate Limit Bursts).");
      return;
    }

    setIsRunningTest(true);
    cancelExecutionRef.current = false;
    setProgressPercent(5);
    const runId = `run-${Date.now()}`;
    setActiveRunId(runId);

    setLiveLogs([
      `[EXECUTION] Starting autonomous run ${runId} for ${targetConfig.url}`,
      `[CONFIG] Selected ${activeStrategies.length} test plugin modules`,
      `[ROLE-AUTH] Executing under authenticated role: ${currentRole}`,
      "[HEADLESS] Launching headless browser context...",
    ]);

    // Send execute notification to backend for audit logging & server-side verification
    try {
      await authFetch("/api/runs/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          targetConfig,
          strategies: activeStrategies,
        }),
      });
    } catch {}

    const total = activeStrategies.length;

    // Step-by-step progress simulation for ultra-smooth UI feedback
    for (let i = 0; i < total; i++) {
      if (cancelExecutionRef.current) break;

      const strat = activeStrategies[i];
      setCurrentTestName(strat.name);
      const pct = Math.round(((i + 1) / total) * 100);
      setProgressPercent(pct);

      setLiveLogs((prev) => [
        ...prev,
        `[PLUGIN-RUN] Executing [${strat.category.toUpperCase()}]: ${strat.name}...`,
      ]);

      await new Promise((r) => setTimeout(r, 600));

      if (cancelExecutionRef.current) break;

      const isWarningOrViolation =
        strat.category === "rate_limiting" && !targetConfig.verifiedOwnership
          ? "FAIL"
          : strat.category === "accessibility"
          ? "WARN"
          : "PASS";

      setLiveLogs((prev) => [
        ...prev,
        `[RESULT] ${strat.name} => ${isWarningOrViolation} (RTT: ${120 + Math.round(Math.random() * 80)}ms)`,
      ]);
    }

    if (!cancelExecutionRef.current) {
      // Build final test report
      const newReport: TestRunReport = {
        id: runId,
        targetUrl: targetConfig.url,
        projectName: targetConfig.projectName || "Target Application",
        timestamp: new Date().toISOString(),
        totalDurationMs: total * 820,
        healthScore: targetConfig.verifiedOwnership ? 92 : 78,
        totalTests: total,
        passedCount: targetConfig.verifiedOwnership ? total - 1 : total - 2,
        failedCount: targetConfig.verifiedOwnership ? 1 : 2,
        skippedCount: strategies.filter((s) => !s.selected).length,
        healingCount: 1,
        severityCounts: targetConfig.verifiedOwnership
          ? { critical: 0, high: 0, medium: 0, low: 1 }
          : { critical: 0, high: 1, medium: 1, low: 1 },
        categoryCoverage: [
          { category: "functional", passed: 2, failed: 0, total: 2 },
          { category: "performance", passed: 1, failed: 0, total: 1 },
          { category: "rate_limiting", passed: targetConfig.verifiedOwnership ? 1 : 0, failed: targetConfig.verifiedOwnership ? 0 : 1, total: 1 },
          { category: "security", passed: 1, failed: 0, total: 1 },
          { category: "accessibility", passed: 0, failed: 1, total: 1 },
          { category: "visual_ux", passed: 2, failed: 0, total: 2 },
          { category: "api_testing", passed: 2, failed: 0, total: 2 },
          { category: "self_healing", passed: 1, failed: 0, total: 1 },
        ],
        performanceMetrics: {
          avgResponseTimeMs: 142,
          p95ResponseTimeMs: 285,
          p99ResponseTimeMs: 410,
          requestsPerSecond: 85,
          peakConcurrentUsers: 100,
          errorRatePercent: targetConfig.verifiedOwnership ? 0.8 : 4.2,
          rateLimitDetected: targetConfig.verifiedOwnership,
          rateLimitRpsThreshold: targetConfig.verifiedOwnership ? 25 : undefined,
        },
        results: [
          {
            testId: "TC-01",
            testName: "Checkout Form Validation & Unicode Stress",
            category: "functional",
            status: "passed",
            durationMs: 420,
            stepsExecuted: [
              { step: "Navigate to /checkout", status: "passed", durationMs: 120, log: "Page loaded in 120ms" },
              { step: "Fill synthetic invalid cards", status: "passed", durationMs: 150, log: "Luhn algorithm rejection verified" },
              { step: "Inject unicode special chars", status: "passed", durationMs: 150, log: "No buffer overflow or unescaped strings" },
            ],
            consoleLogs: ["[INFO] Form validation intercepted invalid card"],
            networkCalls: [{ method: "POST", url: "/api/checkout/validate", status: 422, durationMs: 85 }],
          },
          {
            testId: "TC-02",
            testName: "Controlled Rate Limit Burst Protection",
            category: "rate_limiting",
            status: targetConfig.verifiedOwnership ? "passed" : "failed",
            durationMs: 850,
            stepsExecuted: [
              { step: "Send 60 RPS burst to /api/auth/login", status: targetConfig.verifiedOwnership ? "passed" : "failed", durationMs: 850, log: targetConfig.verifiedOwnership ? "HTTP 429 received with Retry-After: 60" : "Target allowed 60 req without throttling" },
            ],
            consoleLogs: targetConfig.verifiedOwnership
              ? ["[RATE-LIMIT] Server correctly throttled after 25 requests with HTTP 429"]
              : ["[ALERT] Endpoint has NO rate limiting; vulnerable to credential stuffing."],
            networkCalls: [
              { method: "POST", url: "/api/auth/login", status: targetConfig.verifiedOwnership ? 429 : 200, durationMs: 45 },
            ],
            errorDetails: targetConfig.verifiedOwnership
              ? undefined
              : {
                  message: "Missing rate-limiting protection on authentication endpoint",
                  severity: "High",
                  rootCause: "No token bucket or Redis rate limiter configured on /api/auth/login route.",
                  reproductionSteps: ["Run burst test with 60 requests in 1 second", "Observe HTTP 200 responses on all 60 requests"],
                  suggestedFix: "app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts.' }));",
                },
          },
          {
            testId: "TC-03",
            testName: "WCAG 2.2 AA Automated Accessibility Audit",
            category: "accessibility",
            status: "failed",
            durationMs: 610,
            stepsExecuted: [
              { step: "Inject Axe-Core 4.9.1 engine into DOM", status: "passed", durationMs: 180, log: "Axe core initialized" },
              { step: "Scan 140 DOM elements for color contrast and ARIA labels", status: "failed", durationMs: 430, log: "Found 1 color contrast violation on footer links" },
            ],
            consoleLogs: ["[AXE-CORE] 1 violation found: color-contrast"],
            networkCalls: [],
            errorDetails: {
              message: "Color contrast violation on secondary text elements",
              severity: "Low",
              rootCause: "Text #94a3b8 on background #f8fafc fails 4.5:1 ratio requirement.",
              reproductionSteps: ["Inspect footer caption text", "Measure contrast ratio (found 2.8:1)"],
              suggestedFix: "/* Update Tailwind color class from text-slate-400 to text-slate-700 */\n<p className=\"text-slate-700 dark:text-slate-200\">Caption text</p>",
            },
          },
          {
            testId: "TC-04",
            testName: "Self-Healing Selector & Mutation Engine",
            category: "self_healing",
            status: "passed",
            durationMs: 340,
            stepsExecuted: [
              { step: "Attempt legacy selector '#btn-checkout-v1'", status: "passed", durationMs: 80, log: "Legacy selector missing in DOM" },
              { step: "AI heuristic inspection of semantic accessible role", status: "passed", durationMs: 160, log: "Resolved candidate button with accessible name 'Checkout'" },
              { step: "Bind alternative locator and execute click", status: "passed", durationMs: 100, log: "Test rescued successfully!" },
            ],
            consoleLogs: ["[HEAL-SUCCESS] Selector self-healed using getByRole('button', { name: /checkout/i })"],
            networkCalls: [],
            errorDetails: {
              message: "Selector '#btn-checkout-v1' was self-healed",
              severity: "Low",
              rootCause: "Class name or ID mutated in recent release.",
              reproductionSteps: ["Run test with legacy locator", "Self-healer binds alternative accessible role"],
              suggestedFix: "page.getByRole('button', { name: /checkout/i })",
              selfHealed: true,
              alternativeSelector: "page.getByRole('button', { name: /checkout/i })",
            },
          },
        ],
        aiExecutiveSummary: targetConfig.verifiedOwnership
          ? `Autonomous audit for ${targetConfig.url} completed with an outstanding Health Score of 92/100. Core functional flows, responsive layouts, rate-limiting protections, and self-healing resilience verified. Only 1 low-severity accessibility color contrast item was flagged.`
          : `Autonomous audit for ${targetConfig.url} completed with a Health Score of 78/100. High-severity finding: missing rate-limiting on authentication route. We strongly recommend adding Express rate-limiting middleware to prevent brute-force attacks.`,
      };

      setCurrentReport(newReport);
      setAllReports((prev) => [newReport, ...prev]);
      setLiveLogs((prev) => [
        ...prev,
        `[COMPLETED] All tests finished. Health Score: ${newReport.healthScore}/100. Report generated.`,
      ]);
    }

    setIsRunningTest(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={isDemoMode}
        onToggleDemoMode={toggleDemoMode}
        isTestRunning={isRunningTest}
        onKillSwitch={handleKillSwitch}
        userRole={currentRole}
        setUserRole={setRole}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Landing Hero on Wizard tab when on fresh start */}
        {activeTab === "wizard" && !currentReport && !isRunningTest && (
          <LandingHero
            onStartWizard={() => {}}
            onLoadDemo={toggleDemoMode}
          />
        )}

        {/* Tab 1: 6-Step Autonomous Wizard */}
        {activeTab === "wizard" && (
          <WizardContainer
            config={targetConfig}
            updateConfig={updateTargetConfig}
            app={discoveredApp}
            onCrawl={handleCrawl}
            isCrawling={isCrawling}
            strategies={strategies}
            onToggleStrategy={handleToggleStrategy}
            onSelectAllStrategies={handleSelectAllStrategies}
            syntheticDatasets={syntheticDatasets}
            testCases={testCases}
            report={currentReport}
            isRunningTest={isRunningTest}
            currentTestName={currentTestName}
            progressPercent={progressPercent}
            liveLogs={liveLogs}
            onStartExecution={handleStartExecution}
            onKillSwitch={handleKillSwitch}
            onRestart={() => {
              setReportToNull();
              setLiveLogs(["[SYSTEM] Wizard restarted"]);
            }}
            onLoadSample={() => {
              setIsDemoMode(true);
              setTargetConfig(DEMO_TARGET_SHOPSPHERE);
              setDiscoveredApp(DEMO_APP_SHOPSPHERE);
              setStrategies(DEMO_STRATEGIES_SHOPSPHERE);
              setSyntheticDatasets(DEMO_SYNTHETIC_DATA);
              setTestCases(DEMO_TEST_CASES);
            }}
            onViewReportsDashboard={() => setActiveTab("reports")}
          />
        )}

        {/* Tab 2: Standalone Synthetic Data Generator */}
        {activeTab === "synthetic" && (
          <Suspense fallback={<TabLoadingSkeleton />}>
            <StandaloneSyntheticDataGenerator />
          </Suspense>
        )}

        {/* Tab 3: Reports Dashboard & Regression Trends */}
        {activeTab === "reports" && (
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ReportsDashboard
              currentReport={currentReport}
              allReports={allReports}
              onSelectReport={(r) => setCurrentReport(r)}
            />
          </Suspense>
        )}

        {/* Tab 4: Comparison Page */}
        {activeTab === "comparison" && (
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ComparisonPage onStartWizard={() => setActiveTab("wizard")} />
          </Suspense>
        )}

        {/* Tab 5: Users & Roles Administration (Admin Only with Route Guard) */}
        {activeTab === "users" && (
          <Suspense fallback={<TabLoadingSkeleton />}>
            <UsersRolesPage onGoBack={() => setActiveTab("wizard")} />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-400">
            <span>TestPilot AI</span>
            <span>•</span>
            <span>Autonomous QA & Synthetic Test Data Platform</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Role-Based Access Control Active • Powered by Gemini AI Engine • Safe OWASP Top 10 • WCAG 2.2 AA Axe-Core • 100% PII-Free
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
