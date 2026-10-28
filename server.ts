import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { validateTargetUrl, verifyDomainOwnership, generateVerificationToken } from "./backend/verification.ts";
import { crawlTargetApp } from "./backend/crawler.ts";
import {
  generateTestStrategyWithAI,
  generateSyntheticDatasetsWithAI,
  generateTestCasesWithAI,
  generateCustomSyntheticData,
  getOrGenerateSpec,
} from "./backend/ai.ts";
import { executeTestRun, killRunningTest } from "./backend/testRunner.ts";
import { storage } from "./backend/storage.ts";
import type { TargetConfig, DiscoveredApp, TestStrategyItem, TestCase, SyntheticGeneratorOptions, UserRole, Permission } from "./src/types/index.ts";
import { ROLE_PERMISSIONS } from "./src/types/index.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side RBAC Permission Enforcement Middleware
function requirePermission(permission: Permission) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawRole = (req.headers["x-user-role"] as string) || "Admin";
    const userRole: UserRole = (["Admin", "Tester", "Viewer"].includes(rawRole) ? rawRole : "Admin") as UserRole;
    const userEmail = (req.headers["x-user-email"] as string) || "current_user@testpilot.ai";
    const allowed = ROLE_PERMISSIONS[userRole] || [];

    if (!allowed.includes(permission)) {
      storage.logAction(
        userEmail,
        "ACCESS_DENIED_BLOCKED",
        req.path,
        "blocked",
        `Access denied to ${req.method} ${req.path}. Role '${userRole}' lacks permission '${permission}'.`
      );
      return res.status(403).json({
        error: `Forbidden: Action requires '${permission}' permission.`,
        requiredPermission: permission,
        currentRole: userRole,
      });
    }

    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  // Enable HTTP gzip/brotli compression for all routes & API responses
  app.use(compression());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Keep-alive headers and request audit logger
  app.use((req, res, next) => {
    res.setHeader("Connection", "keep-alive");
    if (req.path.startsWith("/api/")) {
      const role = req.headers["x-user-role"] || "Admin";
      console.log(`[API] ${req.method} ${req.path} [Role: ${role}]`);
    }
    next();
  });

  // 1. SSRF & Target Validation (Allowed for any role that can view/run)
  app.post("/api/target/validate", (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    const result = validateTargetUrl(url);
    if (!result.isSafe) {
      storage.logAction("user", "SSRF_BLOCKED", url, "blocked", result.reason);
      return res.status(403).json(result);
    }
    const token = generateVerificationToken(result.normalizedUrl!);
    return res.json({ ...result, token });
  });

  // 2. Ownership Verification (Admin Only: requires 'verify_domain')
  app.post("/api/target/verify-ownership", requirePermission("verify_domain"), async (req, res) => {
    const { url, method = "dns_txt" } = req.body;
    const userEmail = (req.headers["x-user-email"] as string) || "admin@testpilot.ai";
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    try {
      const outcome = await verifyDomainOwnership(url, method);
      storage.logAction(
        userEmail,
        "VERIFY_OWNERSHIP",
        url,
        outcome.verified ? "success" : "warn",
        outcome.message
      );
      return res.json(outcome);
    } catch (err: any) {
      return res.status(500).json({ verified: false, message: err.message });
    }
  });

  // 3. AI Discovery & App Map Crawl
  app.post("/api/crawl", async (req, res) => {
    const { url, depth = "standard" } = req.body;
    const userEmail = (req.headers["x-user-email"] as string) || "user@testpilot.ai";
    if (!url) {
      return res.status(400).json({ error: "Target URL is required" });
    }

    try {
      const discoveredApp = await crawlTargetApp(url, depth);
      storage.logAction(userEmail, "CRAWL_APP", url, "success", `Discovered ${discoveredApp.pages.length} pages, ${discoveredApp.forms.length} forms`);
      return res.json(discoveredApp);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // 4. AI Test Strategy Selector
  app.post("/api/strategy", async (req, res) => {
    const { app: discoveredApp, targetConfig } = req.body;
    if (!discoveredApp || !targetConfig) {
      return res.status(400).json({ error: "Target app and config are required" });
    }

    try {
      const strategies = await generateTestStrategyWithAI(discoveredApp, targetConfig);
      return res.json(strategies);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. Synthetic Payloads for Discovered Forms
  app.post("/api/synthetic/generate-fields", requirePermission("generate_data"), async (req, res) => {
    const { app: discoveredApp } = req.body;
    if (!discoveredApp) {
      return res.status(400).json({ error: "App data required" });
    }

    try {
      const datasets = await generateSyntheticDatasetsWithAI(discoveredApp);
      return res.json(datasets);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. Test Cases Generation
  app.post("/api/testcases", async (req, res) => {
    const { app: discoveredApp, strategies, syntheticData } = req.body;
    if (!discoveredApp || !strategies) {
      return res.status(400).json({ error: "App and strategies are required" });
    }

    try {
      const testCases = await generateTestCasesWithAI(discoveredApp, strategies, syntheticData || []);
      return res.json(testCases);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7a. Get Generation Spec (Requires generate_data)
  app.post("/api/synthetic/spec", requirePermission("generate_data"), async (req, res) => {
    const options: SyntheticGeneratorOptions = req.body;
    try {
      const specResult = await getOrGenerateSpec(options);
      return res.json(specResult);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7b. Standalone Synthetic Data Generator (Requires generate_data)
  app.post("/api/synthetic/standalone", requirePermission("generate_data"), async (req, res) => {
    const options: SyntheticGeneratorOptions = req.body;
    try {
      const result = await generateCustomSyntheticData(options);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 8. Execute Test Run (Requires 'run_tests', and 'run_intrusive_tests' if intrusive)
  app.post("/api/runs/execute", requirePermission("run_tests"), async (req, res) => {
    const { targetConfig, app: discoveredApp, strategies, testCases } = req.body;
    const rawRole = (req.headers["x-user-role"] as string) || "Admin";
    const userRole = (["Admin", "Tester", "Viewer"].includes(rawRole) ? rawRole : "Admin") as UserRole;
    const userEmail = (req.headers["x-user-email"] as string) || "tester@testpilot.ai";

    if (!targetConfig || !discoveredApp || !strategies) {
      return res.status(400).json({ error: "Missing required execution parameters" });
    }

    // Check if intrusive tests are selected by non-admin
    const hasIntrusiveSelected = (strategies as TestStrategyItem[]).some(
      (s) => s.selected && s.isIntrusive
    );
    if (hasIntrusiveSelected && !ROLE_PERMISSIONS[userRole].includes("run_intrusive_tests")) {
      storage.logAction(
        userEmail,
        "INTRUSIVE_TEST_BLOCKED",
        targetConfig.url,
        "blocked",
        `Role '${userRole}' attempted to execute intrusive tests without 'run_intrusive_tests' permission.`
      );
      return res.status(403).json({
        error: "Forbidden: Running intrusive tests requires 'run_intrusive_tests' permission (Admin only).",
        requiredPermission: "run_intrusive_tests",
        currentRole: userRole,
      });
    }

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Set up SSE headers for streaming progress
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      const report = await executeTestRun(
        runId,
        targetConfig,
        discoveredApp,
        strategies,
        testCases || [],
        (update) => {
          res.write(`data: ${JSON.stringify({ type: "progress", update })}\n\n`);
        }
      );

      storage.saveReport(report);
      res.write(`data: ${JSON.stringify({ type: "complete", report })}\n\n`);
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
      res.end();
    }
  });

  // 9. Kill Switch (Requires 'stop_runs')
  app.post("/api/runs/:id/kill", requirePermission("stop_runs"), (req, res) => {
    const { id } = req.params;
    const userEmail = (req.headers["x-user-email"] as string) || "user@testpilot.ai";
    const killed = killRunningTest(id);
    storage.logAction(userEmail, "KILL_SWITCH_ENGAGED", id, "warn", `Aborted run: ${id}`);
    return res.json({ killed, message: killed ? `Run ${id} terminated immediately.` : "Run not active or already finished." });
  });

  // 10. Reports & Run History (Requires 'view_reports')
  app.get("/api/reports", requirePermission("view_reports"), (req, res) => {
    res.json(storage.getAllReports());
  });

  app.get("/api/reports/:id", requirePermission("view_reports"), (req, res) => {
    const report = storage.getReport(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  });

  // 11. Audit Logs (Requires 'view_audit_log' - Admin only)
  app.get("/api/audit-logs", requirePermission("view_audit_log"), (req, res) => {
    res.json(storage.getAuditLogs());
  });

  // 12. Users & Roles Management (Requires 'manage_users' - Admin only)
  app.get("/api/users", requirePermission("manage_users"), (req, res) => {
    res.json(storage.getAllUsers());
  });

  // 13. Update User Role (Requires 'change_roles' and 'manage_users' - Admin only)
  app.put("/api/users/:id/role", requirePermission("change_roles"), (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const userEmail = (req.headers["x-user-email"] as string) || "admin@testpilot.ai";

    if (!role || !["Admin", "Tester", "Viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified. Must be Admin, Tester, or Viewer." });
    }

    const updatedUser = storage.updateUserRole(id, role, userEmail);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, user: updatedUser });
  });

  // Mount Vite or Static Frontend
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n========================================`);
    console.log(`  TestPilot AI Platform Server Ready   `);
    console.log(`  Port: http://0.0.0.0:${PORT}          `);
    console.log(`========================================\n`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
