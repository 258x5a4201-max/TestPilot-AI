/**
 * Persistent / Memory Storage for Projects, Test Runs, Reports & Audit Logs
 */
import type { TargetConfig, TestRunReport, UserRole, AppUser } from "../src/types/index.ts";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  targetUrl: string;
  status: "success" | "blocked" | "warn";
  details?: string;
}

class TestPilotStorage {
  private targets: Map<string, TargetConfig> = new Map();
  private reports: Map<string, TestRunReport> = new Map();
  private users: Map<string, AppUser> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seedInitialData();
  }

  getAllUsers(): AppUser[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): AppUser | undefined {
    return this.users.get(id);
  }

  updateUserRole(userId: string, newRole: UserRole, updatedBy: string): AppUser | null {
    const user = this.users.get(userId);
    if (!user) return null;
    const oldRole = user.role;
    user.role = newRole;
    user.lastActive = new Date().toISOString();
    this.users.set(userId, user);

    this.logAction(
      updatedBy,
      "ROLE_CHANGE",
      user.email,
      "success",
      `Role for ${user.name} (${user.email}) changed from ${oldRole} to ${newRole} by ${updatedBy}`
    );
    return user;
  }

  saveTarget(config: TargetConfig): void {
    this.targets.set(config.id, config);
    this.logAction("chirumellateja@gmail.com", "REGISTER_TARGET", config.url, "success", `Target saved with depth: ${config.depth}`);
  }

  getTarget(id: string): TargetConfig | undefined {
    return this.targets.get(id);
  }

  getAllTargets(): TargetConfig[] {
    return Array.from(this.targets.values());
  }

  saveReport(report: TestRunReport): void {
    this.reports.set(report.id, report);
    this.logAction(
      "chirumellateja@gmail.com",
      "COMPLETE_TEST_RUN",
      report.targetUrl,
      report.healthScore > 70 ? "success" : "warn",
      `Health Score: ${report.healthScore}, Tests: ${report.totalTests}, Passed: ${report.passedCount}`
    );
  }

  getReport(id: string): TestRunReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): TestRunReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  logAction(userEmail: string, action: string, targetUrl: string, status: "success" | "blocked" | "warn", details?: string) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userEmail,
      action,
      targetUrl,
      status,
      details,
    });
    // Keep max 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  private seedInitialData() {
    const demoTarget: TargetConfig = {
      id: "demo-target-1",
      url: "https://shopsphere-demo.testpilot.ai",
      projectName: "ShopSphere Global Commerce",
      depth: "deep",
      authEnabled: true,
      verifiedOwnership: true,
      verificationMethod: "dns_txt",
      consentAccepted: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    };
    this.targets.set(demoTarget.id, demoTarget);

    const runV1: TestRunReport = {
      id: "run-demo-001",
      targetUrl: "https://shopsphere-demo.testpilot.ai",
      projectName: "ShopSphere Global Commerce",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      totalDurationMs: 8400,
      healthScore: 78,
      totalTests: 12,
      passedCount: 9,
      failedCount: 3,
      skippedCount: 1,
      healingCount: 1,
      severityCounts: { critical: 0, high: 2, medium: 1, low: 0 },
      categoryCoverage: [
        { category: "functional", passed: 2, failed: 0, total: 2 },
        { category: "performance", passed: 1, failed: 0, total: 1 },
        { category: "rate_limiting", passed: 0, failed: 1, total: 1 },
        { category: "security", passed: 0, failed: 1, total: 1 },
        { category: "accessibility", passed: 0, failed: 1, total: 1 },
        { category: "visual_ux", passed: 2, failed: 0, total: 2 },
        { category: "api_testing", passed: 2, failed: 0, total: 2 },
        { category: "self_healing", passed: 2, failed: 0, total: 2 },
      ],
      performanceMetrics: {
        avgResponseTimeMs: 168,
        p95ResponseTimeMs: 340,
        p99ResponseTimeMs: 510,
        requestsPerSecond: 24.5,
        peakConcurrentUsers: 15,
        errorRatePercent: 8.3,
        rateLimitDetected: false,
        rateLimitRpsThreshold: undefined,
      },
      results: [],
      aiExecutiveSummary:
        "Initial autonomous baseline run for ShopSphere. Found missing rate-limiting on login route and absent CSP headers. Performance is acceptable under 15 virtual users.",
    };

    const runV2: TestRunReport = {
      id: "run-demo-002",
      targetUrl: "https://shopsphere-demo.testpilot.ai",
      projectName: "ShopSphere Global Commerce",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      totalDurationMs: 9100,
      healthScore: 92,
      totalTests: 13,
      passedCount: 12,
      failedCount: 1,
      skippedCount: 0,
      healingCount: 1,
      severityCounts: { critical: 0, high: 0, medium: 0, low: 1 },
      categoryCoverage: [
        { category: "functional", passed: 2, failed: 0, total: 2 },
        { category: "performance", passed: 1, failed: 0, total: 1 },
        { category: "rate_limiting", passed: 1, failed: 0, total: 1 },
        { category: "security", passed: 1, failed: 0, total: 1 },
        { category: "accessibility", passed: 0, failed: 1, total: 1 },
        { category: "visual_ux", passed: 2, failed: 0, total: 2 },
        { category: "api_testing", passed: 2, failed: 0, total: 2 },
        { category: "self_healing", passed: 2, failed: 0, total: 2 },
        { category: "usability", passed: 1, failed: 0, total: 1 },
      ],
      performanceMetrics: {
        avgResponseTimeMs: 132,
        p95ResponseTimeMs: 270,
        p99ResponseTimeMs: 440,
        requestsPerSecond: 32.1,
        peakConcurrentUsers: 20,
        errorRatePercent: 0,
        rateLimitDetected: true,
        rateLimitRpsThreshold: 45,
      },
      results: [],
      aiExecutiveSummary:
        "Second regression run indicates major improvement (+14 points Health Score). Rate limiting and CSP remediation verified. Only 1 low-severity accessibility color contrast item remains.",
    };

    this.reports.set(runV1.id, runV1);
    this.reports.set(runV2.id, runV2);

    // Seed Team Members for Role-Based Access Control
    const seedUsers: AppUser[] = [
      {
        id: "usr-1",
        name: "Teja Chirumella",
        email: "chirumellateja@gmail.com",
        role: "Admin",
        department: "Core Platform & Infrastructure",
        lastActive: "Just now",
      },
      {
        id: "usr-2",
        name: "Alex Rivera",
        email: "alex.rivera@testpilot.ai",
        role: "Tester",
        department: "Autonomous QA Engineering",
        lastActive: "5 mins ago",
      },
      {
        id: "usr-3",
        name: "Sarah Connor",
        email: "sarah.connor@testpilot.ai",
        role: "Tester",
        department: "Frontend Automation & Viewports",
        lastActive: "22 mins ago",
      },
      {
        id: "usr-4",
        name: "Rachel Green",
        email: "rachel.pm@testpilot.ai",
        role: "Viewer",
        department: "Product Management & Audits",
        lastActive: "1 hour ago",
      },
      {
        id: "usr-5",
        name: "David Kim",
        email: "david.auditor@testpilot.ai",
        role: "Viewer",
        department: "External Security & Compliance",
        lastActive: "3 hours ago",
      },
    ];

    seedUsers.forEach((u) => this.users.set(u.id, u));

    this.logAction("system", "SYSTEM_INIT", "https://shopsphere-demo.testpilot.ai", "success", "Demo suite and RBAC team initialized");
  }
}

export const storage = new TestPilotStorage();
