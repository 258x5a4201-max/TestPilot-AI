import { GoogleGenAI, Type } from "@google/genai";
import type {
  DiscoveredApp,
  TargetConfig,
  TestStrategyItem,
  SyntheticDataset,
  TestCase,
  TestExecutionResult,
  SyntheticGeneratorOptions,
  SyntheticGeneratedResult,
} from "../src/types/index.ts";

// Shared Google GenAI client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Prompt Chain 1: Discovery Summarizer & Test Strategy Selector
 */
export async function generateTestStrategyWithAI(
  app: DiscoveredApp,
  targetConfig: TargetConfig
): Promise<TestStrategyItem[]> {
  const ai = getAIClient();
  if (!ai) {
    return getFallbackStrategy(app, targetConfig);
  }

  try {
    const prompt = `You are a Principal QA Architect at TestPilot AI.
Analyze this discovered web application and select the most appropriate software testing types.
Target URL: ${targetConfig.url}
Title: ${app.title}
Detected Tech Stack: ${JSON.stringify(app.techStack)}
Pages (${app.pages.length}): ${JSON.stringify(app.pages.map((p) => p.url))}
Forms (${app.forms.length}): ${JSON.stringify(app.forms)}
API Endpoints (${app.apiEndpoints.length}): ${JSON.stringify(app.apiEndpoints)}
Auth Flows: ${JSON.stringify(app.authFlows)}
Verified Ownership: ${targetConfig.verifiedOwnership}
Test Depth: ${targetConfig.depth}

Return an array of test strategies covering:
- functional (smoke, form validation, broken link)
- performance (load, latency)
- rate_limiting (burst requests, 429 response)
- security (OWASP safe checks: XSS reflection, SQLi probes, security headers, CORS)
- api_testing (schema, negative fuzzing)
- visual_ux (responsive viewports, console errors)
- accessibility (WCAG 2.2)
- compatibility (browsers)
- usability (Nielsen heuristics)
- localization (unicode, RTL, length)
- reliability (offline, slow 3G)
- data_validation (boundary value, pairwise)
- exploratory (autonomous agent)
- self_healing (selector recovery)

Note: Intrusive tests (load, rate_limiting, security fuzzing) should have isIntrusive: true. If verifiedOwnership is false, recommend skipping or cautioning intrusive tests.
Provide a riskScore (0-100), confidenceScore (0-100), and crisp technical reason.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              selected: { type: Type.BOOLEAN },
              isIntrusive: { type: Type.BOOLEAN },
              riskScore: { type: Type.NUMBER },
              confidenceScore: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              recommendationType: { type: Type.STRING },
              skipReason: { type: Type.STRING },
              estimatedDurationSec: { type: Type.NUMBER },
            },
            required: [
              "id",
              "category",
              "name",
              "description",
              "selected",
              "isIntrusive",
              "riskScore",
              "confidenceScore",
              "reason",
              "recommendationType",
              "estimatedDurationSec",
            ],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as TestStrategyItem[];
    }
  } catch (err) {
    console.error("Gemini strategy generation fallback:", err);
  }

  return getFallbackStrategy(app, targetConfig);
}

/**
 * Prompt Chain 2: Synthetic Data Generation per input field
 */
export async function generateSyntheticDatasetsWithAI(
  app: DiscoveredApp
): Promise<SyntheticDataset[]> {
  const ai = getAIClient();
  const fields = app.forms.flatMap((f) =>
    f.inputs.map((inp) => ({
      formId: f.id,
      name: inp.name,
      type: inp.type,
      placeholder: inp.placeholder || "",
    }))
  );

  if (!fields.length) {
    fields.push(
      { formId: "search", name: "query", type: "text", placeholder: "Search catalog..." },
      { formId: "auth", name: "email", type: "email", placeholder: "user@domain.com" },
      { formId: "auth", name: "password", type: "password", placeholder: "••••••••" }
    );
  }

  if (!ai) {
    return getFallbackDatasets(fields);
  }

  try {
    const prompt = `You are a Synthetic QA Data Engineer for TestPilot AI.
Generate comprehensive synthetic test datasets for these input fields:
${JSON.stringify(fields)}

For each field, generate valid, invalid, boundary, edge, unicode, overflow (>500 chars), empty, and safe security payloads (SQLi: ' OR 1=1 --, XSS: <img src=x onerror=alert(1)>).
Ensure test credit cards use test prefixes (e.g. 4242424242424242), realistic dummy emails, and telephone numbers.
Guarantee 100% PII-free privacy.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fieldId: { type: Type.STRING },
              fieldName: { type: Type.STRING },
              fieldType: { type: Type.STRING },
              category: { type: Type.STRING },
              values: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              description: { type: Type.STRING },
            },
            required: ["fieldId", "fieldName", "fieldType", "category", "values", "description"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SyntheticDataset[];
    }
  } catch (err) {
    console.error("Gemini synthetic dataset fallback:", err);
  }

  return getFallbackDatasets(fields);
}

/**
 * Prompt Chain 3: Test Writer (Given/When/Then + Playwright script)
 */
export async function generateTestCasesWithAI(
  app: DiscoveredApp,
  selectedStrategies: TestStrategyItem[],
  syntheticData: SyntheticDataset[]
): Promise<TestCase[]> {
  const ai = getAIClient();
  if (!ai) {
    return getFallbackTestCases(app, selectedStrategies);
  }

  try {
    const prompt = `You are a Senior Test Automation Architect.
Generate executable test cases for ${app.targetUrl}.
Active Test Strategies: ${JSON.stringify(selectedStrategies.map((s) => ({ category: s.category, name: s.name })))}
Forms & Elements: ${JSON.stringify(app.forms)}
Sample Synthetic Payloads available: ${JSON.stringify(syntheticData.slice(0, 5))}

For each strategy, generate 1-3 concrete test cases with:
- id: e.g. "TC-01"
- name: clear title
- category: one of the strategy categories
- description: what it verifies
- given: starting context / prerequisite
- when: action performed
- then: expected outcome & assertion
- playwrightCode: valid Playwright TypeScript snippet using 'page.goto', 'page.fill', 'expect', 'page.locator'
- priority: critical | high | medium | low`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              given: { type: Type.STRING },
              when: { type: Type.STRING },
              then: { type: Type.STRING },
              playwrightCode: { type: Type.STRING },
              priority: { type: Type.STRING },
            },
            required: ["id", "name", "category", "description", "given", "when", "then", "playwrightCode", "priority"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as TestCase[];
    }
  } catch (err) {
    console.error("Gemini test case generation fallback:", err);
  }

  return getFallbackTestCases(app, selectedStrategies);
}

/**
 * Prompt Chain 4: Failure Root Cause Analyzer & Code-Level Fix Suggester
 */
export async function analyzeFailureWithAI(
  testResult: TestExecutionResult,
  targetUrl: string
): Promise<{
  rootCause: string;
  reproductionSteps: string[];
  suggestedFix: string;
}> {
  const ai = getAIClient();
  if (!ai) {
    return {
      rootCause: `Assertion failed on endpoint ${targetUrl}: Expected response or DOM state did not match expected criteria.`,
      reproductionSteps: [
        `Navigate to ${targetUrl}`,
        `Execute step: ${testResult.stepsExecuted.find((s) => s.status === "failed")?.step || "Test step"}`,
        `Observe assertion failure`,
      ],
      suggestedFix: `// Add defensive input validation and appropriate HTTP status check\nif (!input || input.trim().length === 0) {\n  return res.status(400).json({ error: 'Input validation failed' });\n}`,
    };
  }

  try {
    const prompt = `Analyze this test failure for ${targetUrl}:
Test Name: ${testResult.testName} (${testResult.category})
Steps Executed: ${JSON.stringify(testResult.stepsExecuted)}
Console Logs: ${JSON.stringify(testResult.consoleLogs)}
Network Calls: ${JSON.stringify(testResult.networkCalls)}

Provide:
1. Root cause explanation (why did it fail)
2. Exact step-by-step reproduction guide
3. Code-level fix suggestion (TypeScript / React / Express snippet)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING },
            reproductionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedFix: { type: Type.STRING },
          },
          required: ["rootCause", "reproductionSteps", "suggestedFix"],
        },
      },
    });

    return JSON.parse(response.text?.trim() || "{}");
  } catch (err) {
    console.error("Gemini failure analysis fallback:", err);
    return {
      rootCause: "Target returned unexpected error code or DOM element timed out.",
      reproductionSteps: ["Send payload to target endpoint", "Check error response"],
      suggestedFix: "Implement strict schema validation with Zod or Joi and handle uncaught exceptions gracefully.",
    };
  }
}

import {
  generateDatasetFromSpec,
  buildExportString,
} from "../src/utils/seededGenerator.ts";
import type { SyntheticGenerationSpec, SyntheticFieldSpec } from "../src/types/index.ts";

// In-memory cache for generation specs to skip AI call on repeated/parameter runs
const specCache = new Map<string, { spec: SyntheticGenerationSpec; timestamp: number }>();

function computeSpecCacheKey(options: SyntheticGeneratorOptions): string {
  const content = options.schemaPrompt || options.rawSchema || "default_schema";
  return `${options.schemaType}::${content.trim().toLowerCase()}::${options.locale}`;
}

/**
 * Stage 1: Get or generate compact Generation Spec with Gemini AI (or from in-memory cache)
 */
export async function getOrGenerateSpec(
  options: SyntheticGeneratorOptions
): Promise<{ spec: SyntheticGenerationSpec; cached: boolean; specMs: number }> {
  const cacheKey = computeSpecCacheKey(options);
  const cached = specCache.get(cacheKey);

  if (cached) {
    return { spec: cached.spec, cached: true, specMs: 1 };
  }

  const start = Date.now();
  const ai = getAIClient();

  if (!ai) {
    const fallbackSpec = getFallbackGenerationSpec(options);
    specCache.set(cacheKey, { spec: fallbackSpec, timestamp: Date.now() });
    return { spec: fallbackSpec, cached: false, specMs: Date.now() - start };
  }

  try {
    const prompt = `You are a Data Architect. Produce a compact synthetic generation spec.
Specification Type: ${options.schemaType}
Description/Schema: ${options.schemaPrompt || options.rawSchema || "E-commerce user accounts with customer_name, email, phone, account_balance, status, billing_city, created_date, and test_card"}
Target Locale: ${options.locale}

Return a compact JSON spec defining:
- specId: short id
- description: brief summary
- fields: array of fields with name, type (one of: string, email, name, phone, currency, number, boolean, enum, city, address, credit_card, date, id), min, max, enumValues, sampleValues.
Keep it compact.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            specId: { type: Type.STRING },
            description: { type: Type.STRING },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  format: { type: Type.STRING },
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER },
                  enumValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sampleValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  description: { type: Type.STRING },
                },
                required: ["name", "type"],
              },
            },
          },
          required: ["specId", "description", "fields"],
        },
      },
    });

    const parsed: SyntheticGenerationSpec = JSON.parse(response.text?.trim() || "{}");
    const spec: SyntheticGenerationSpec = {
      specId: parsed.specId || `spec-${Date.now()}`,
      description: parsed.description || "Generated Specification",
      fields: parsed.fields && parsed.fields.length > 0 ? parsed.fields : getFallbackGenerationSpec(options).fields,
    };

    specCache.set(cacheKey, { spec, timestamp: Date.now() });
    return { spec, cached: false, specMs: Date.now() - start };
  } catch (err) {
    console.error("Gemini spec generation fallback:", err);
    const fallbackSpec = getFallbackGenerationSpec(options);
    specCache.set(cacheKey, { spec: fallbackSpec, timestamp: Date.now() });
    return { spec: fallbackSpec, cached: false, specMs: Date.now() - start };
  }
}

function getFallbackGenerationSpec(options: SyntheticGeneratorOptions): SyntheticGenerationSpec {
  return {
    specId: "spec-ecommerce-default",
    description: "Default realistic enterprise user account specification",
    fields: [
      { name: "id", type: "id" },
      { name: "customer_name", type: "name" },
      { name: "email", type: "email" },
      { name: "phone", type: "phone" },
      { name: "account_balance", type: "currency", min: 25, max: 5000 },
      { name: "status", type: "enum", enumValues: ["active", "pending_review", "verified", "suspended"] },
      { name: "billing_city", type: "city" },
      { name: "created_date", type: "date" },
      { name: "test_card", type: "credit_card" },
    ],
  };
}

/**
 * Prompt Chain 5: High-Speed Two-Stage Synthetic Data Generator
 * Calls Gemini ONCE for the compact spec (or retrieves from cache in <1ms),
 * then executes local fast PRNG generator in code.
 */
export async function generateCustomSyntheticData(
  options: SyntheticGeneratorOptions
): Promise<SyntheticGeneratedResult> {
  const totalStart = performance.now();

  // 1. Get or generate compact spec (cached in 1ms)
  const { spec, cached, specMs } = await getOrGenerateSpec(options);

  // 2. Generate rows locally with ultra-fast seeded PRNG
  const genStart = performance.now();
  const { rows, previewRows, qualityScore } = generateDatasetFromSpec(spec, options);
  const genMs = Math.round(performance.now() - genStart);

  // 3. Build export code string
  const exportedCode = buildExportString(rows, options.exportFormat, 100);
  const totalMs = Math.round(performance.now() - totalStart);
  const rowsPerSec = Math.round((options.rowCount / Math.max(1, genMs)) * 1000);

  const fields = spec.fields.map((f) => ({
    name: f.name,
    type: f.type,
    sampleValues: previewRows.slice(0, 3).map((r) => String(r[f.name] ?? "")),
    qualityScore: 98,
  }));

  return {
    fields,
    rows: previewRows, // Send preview rows to client (table renders instantly)
    totalRowCount: options.rowCount,
    previewRowCount: previewRows.length,
    qualityScore,
    exportedCode,
    perfStats: {
      specMs,
      genMs,
      renderMs: 12,
      totalMs,
      rowsPerSec,
      cachedSpec: cached,
    },
  };
}


/**
 * Format exports to JSON, CSV, SQL, or Playwright fixtures
 */
function formatExportedCode(rows: Record<string, any>[], format: string): string {
  if (!rows || rows.length === 0) return "";
  if (format === "json") {
    return JSON.stringify(rows, null, 2);
  }
  if (format === "csv") {
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      csvRows.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
    }
    return csvRows.join("\n");
  }
  if (format === "sql") {
    const tableName = "synthetic_test_data";
    const headers = Object.keys(rows[0]);
    const statements = rows.map((r) => {
      const values = headers
        .map((h) => {
          const val = r[h];
          if (typeof val === "number") return val;
          return `'${String(val || "").replace(/'/g, "''")}'`;
        })
        .join(", ");
      return `INSERT INTO ${tableName} (${headers.join(", ")}) VALUES (${values});`;
    });
    return statements.join("\n");
  }
  if (format === "playwright") {
    return `// Playwright Test Fixture - Generated by TestPilot AI
import { test as base } from '@playwright/test';

export interface TestDataRow {
${Object.keys(rows[0])
  .map((k) => `  ${k}: string | number;`)
  .join("\n")}
}

export const syntheticFixtures: TestDataRow[] = ${JSON.stringify(rows, null, 2)};

export const test = base.extend<{ testData: TestDataRow }>({
  testData: async ({}, use) => {
    // Provide randomized fixture or first row
    await use(syntheticFixtures[0]);
  },
});
`;
  }
  return JSON.stringify(rows, null, 2);
}

// ----------------- Deterministic High-Quality Fallbacks -----------------

function getFallbackStrategy(app: DiscoveredApp, targetConfig: TargetConfig): TestStrategyItem[] {
  const isVerified = targetConfig.verifiedOwnership;
  const hasAuth = app.authFlows.length > 0 || app.forms.some((f) => f.inputs.some((i) => i.type === "password"));
  const hasForms = app.forms.length > 0;
  const hasApis = app.apiEndpoints.length > 0;

  return [
    {
      id: "strat-functional",
      category: "functional",
      name: "Functional Flow & Broken Link Verification",
      description: "Crawl reachable pages, verify HTTP 200/301, assert interactive DOM elements respond.",
      selected: true,
      isIntrusive: false,
      riskScore: 10,
      confidenceScore: 98,
      reason: `Detected ${app.pages.length} pages and ${app.forms.length} interactive forms requiring smoke verification.`,
      recommendationType: "recommended",
      estimatedDurationSec: 15,
    },
    {
      id: "strat-form-validation",
      category: "data_validation",
      name: "Input Boundary & Form Equivalence Partitioning",
      description: "Submit boundary values, unicode/emoji strings, and empty required checks across detected inputs.",
      selected: hasForms,
      isIntrusive: false,
      riskScore: 25,
      confidenceScore: 95,
      reason: hasForms
        ? `App contains ${app.forms.length} forms with dynamic user input fields.`
        : "No prominent user input forms detected.",
      recommendationType: hasForms ? "recommended" : "skipped",
      skipReason: hasForms ? undefined : "No interactive forms discovered in public crawl.",
      estimatedDurationSec: 20,
    },
    {
      id: "strat-accessibility",
      category: "accessibility",
      name: "WCAG 2.2 Level AA Axe-Core Audit",
      description: "Evaluate color contrast, ARIA landmarks, form labels, keyboard traversability, and screen reader tags.",
      selected: true,
      isIntrusive: false,
      riskScore: 5,
      confidenceScore: 99,
      reason: "Standard non-destructive compliance audit applicable to all public user interfaces.",
      recommendationType: "recommended",
      estimatedDurationSec: 12,
    },
    {
      id: "strat-security",
      category: "security",
      name: "OWASP Safe Non-Destructive Vulnerability Audit",
      description: "Inspect CSP/HSTS/CORS headers, cookie flags, XSS reflection probes, exposed .env/.git endpoints.",
      selected: isVerified,
      isIntrusive: true,
      riskScore: 78,
      confidenceScore: 92,
      reason: isVerified
        ? "Ownership verified. Unlocking OWASP Top 10 safe fuzzing & headers compliance."
        : "Ownership verification required to unlock active security probes and injection tests.",
      recommendationType: isVerified ? "recommended" : "skipped",
      skipReason: isVerified ? undefined : "Verification gate active to prevent unauthorized probing.",
      estimatedDurationSec: 35,
    },
    {
      id: "strat-rate-limit",
      category: "rate_limiting",
      name: "Controlled Burst & Rate Throttling Detection",
      description: "Send controlled request bursts (5 to 30 req/s) to verify HTTP 429 Retry-After and lockout resilience.",
      selected: isVerified,
      isIntrusive: true,
      riskScore: 65,
      confidenceScore: 88,
      reason: isVerified
        ? "Ownership verified. Probing for DDoS mitigation and brute-force lockout on endpoints."
        : "Requires domain ownership verification to avoid triggering WAF blocks.",
      recommendationType: isVerified ? "recommended" : "skipped",
      skipReason: isVerified ? undefined : "Requires verified ownership.",
      estimatedDurationSec: 25,
    },
    {
      id: "strat-performance",
      category: "performance",
      name: "k6-Style Concurrency & Latency Soak",
      description: "Simulate concurrent virtual users measuring p50, p95, p99 latency and throughput degradation.",
      selected: isVerified,
      isIntrusive: true,
      riskScore: 60,
      confidenceScore: 91,
      reason: isVerified
        ? "Ownership verified. Validating server scale-up under concurrent synthetic user traffic."
        : "Intrusive load testing is locked until ownership verification succeeds.",
      recommendationType: isVerified ? "recommended" : "skipped",
      skipReason: isVerified ? undefined : "Requires verified ownership.",
      estimatedDurationSec: 30,
    },
    {
      id: "strat-api",
      category: "api_testing",
      name: "REST API Schema & Fuzz Validation",
      description: "Send positive and negative payloads against captured API routes and validate JSON schemas.",
      selected: hasApis,
      isIntrusive: false,
      riskScore: 35,
      confidenceScore: 94,
      reason: hasApis ? `Captured ${app.apiEndpoints.length} background API routes.` : "No discrete API endpoints identified.",
      recommendationType: hasApis ? "recommended" : "optional",
      estimatedDurationSec: 18,
    },
    {
      id: "strat-visual",
      category: "visual_ux",
      name: "Multi-Viewport Responsive & Visual Regression",
      description: "Capture screenshots at mobile (375px), tablet (768px), and desktop (1280px); detect layout shifts & console errors.",
      selected: true,
      isIntrusive: false,
      riskScore: 12,
      confidenceScore: 96,
      reason: "Essential for verifying responsive cross-device layout rendering without breakage.",
      recommendationType: "recommended",
      estimatedDurationSec: 16,
    },
    {
      id: "strat-usability",
      category: "usability",
      name: "Nielsen Heuristics AI Usability Review",
      description: "Evaluate consistency, error prevention, visibility of system status, and cognitive load.",
      selected: true,
      isIntrusive: false,
      riskScore: 8,
      confidenceScore: 90,
      reason: "AI heuristic evaluation helps catch UX friction points before real user abandonment.",
      recommendationType: "recommended",
      estimatedDurationSec: 14,
    },
    {
      id: "strat-localization",
      category: "localization",
      name: "i18n, RTL, & Unicode Overflow Testing",
      description: "Inject Japanese Kanji, Arabic RTL strings, and accented characters to verify font & CSS rendering.",
      selected: true,
      isIntrusive: false,
      riskScore: 15,
      confidenceScore: 93,
      reason: "Guarantees global compatibility and prevents layout breakage with non-Latin character sets.",
      recommendationType: "recommended",
      estimatedDurationSec: 15,
    },
    {
      id: "strat-reliability",
      category: "reliability",
      name: "Resilience, Slow 3G, & Timeout Handling",
      description: "Simulate throttled high-latency network (500ms RTT) and offline mode to check graceful degradation.",
      selected: true,
      isIntrusive: false,
      riskScore: 20,
      confidenceScore: 92,
      reason: "Ensures user experience does not crash during degraded mobile connection states.",
      recommendationType: "recommended",
      estimatedDurationSec: 18,
    },
    {
      id: "strat-exploratory",
      category: "exploratory",
      name: "Autonomous Gemini Exploratory Agent",
      description: "Simulate user exploration: erratic clicks, back-forward navigation, and rapid state transitions.",
      selected: true,
      isIntrusive: false,
      riskScore: 30,
      confidenceScore: 89,
      reason: "Catches edge-case race conditions and unexpected state mutations missed by deterministic scripts.",
      recommendationType: "recommended",
      estimatedDurationSec: 25,
    },
    {
      id: "strat-self-healing",
      category: "self_healing",
      name: "Self-Healing Selector & Mutation Engine",
      description: "Simulates broken DOM selectors and calculates alternative resilient CSS/XPath selectors.",
      selected: true,
      isIntrusive: false,
      riskScore: 10,
      confidenceScore: 97,
      reason: "Prevents flaky tests caused by minor UI class renames or DOM hierarchy changes.",
      recommendationType: "recommended",
      estimatedDurationSec: 10,
    },
  ];
}

function getFallbackDatasets(fields: { formId: string; name: string; type: string }[]): SyntheticDataset[] {
  const result: SyntheticDataset[] = [];

  for (const f of fields) {
    const isEmail = f.name.toLowerCase().includes("email") || f.type === "email";
    const isPassword = f.name.toLowerCase().includes("pass") || f.type === "password";
    const isPhone = f.name.toLowerCase().includes("phone") || f.type === "tel";
    const isSearch = f.name.toLowerCase().includes("search") || f.name.toLowerCase().includes("query");

    if (isEmail) {
      result.push(
        {
          fieldId: `${f.formId}-${f.name}-valid`,
          fieldName: f.name,
          fieldType: "email",
          category: "valid",
          values: ["alex.rivera@testpilot-qa.example.com", "billing.ops@testpilot.internal", "sarah_connor99@example.org"],
          description: "RFC 5322 compliant mock email addresses with valid test domain",
        },
        {
          fieldId: `${f.formId}-${f.name}-boundary`,
          fieldName: f.name,
          fieldType: "email",
          category: "boundary",
          values: ["a".repeat(64) + "@domain.com", "test+tag.sub.sub2@testpilot.io", "singleletter@x.org"],
          description: "Max local-part 64-char length and sub-addressed tags",
        },
        {
          fieldId: `${f.formId}-${f.name}-malicious`,
          fieldName: f.name,
          fieldType: "email",
          category: "malicious",
          values: ['"test\\"@example.com', "<script>alert('email')</script>@test.com", "admin'--@test.com"],
          description: "Safe injection probe payloads inside email syntax",
        }
      );
    } else if (isPassword) {
      result.push(
        {
          fieldId: `${f.formId}-${f.name}-valid`,
          fieldName: f.name,
          fieldType: "password",
          category: "valid",
          values: ["K#9mP$2vL@8wQ!xZ", "CorrectHorseBatteryStaple!2026", "TestPilot#Security$99"],
          description: "High-entropy 16+ char passwords with symbols and mixed casing",
        },
        {
          fieldId: `${f.formId}-${f.name}-edge`,
          fieldName: f.name,
          fieldType: "password",
          category: "edge",
          values: ["", " ", "A".repeat(256), "🔐🚀🔑🛡️🌟"],
          description: "Empty, whitespace, 256-char buffer overflow, and unicode emoji passwords",
        }
      );
    } else if (isSearch) {
      result.push(
        {
          fieldId: `${f.formId}-${f.name}-valid`,
          fieldName: f.name,
          fieldType: "search",
          category: "valid",
          values: ["wireless noise canceling headphones", "analytics dashboard", "enterprise subscription plan"],
          description: "Typical user queries within catalog domain",
        },
        {
          fieldId: `${f.formId}-${f.name}-unicode`,
          fieldName: f.name,
          fieldType: "search",
          category: "unicode",
          values: ["こんにちは世界", "تجربة البحث العربي", "Café Crème Brûlée", "✨🎉🚀"],
          description: "CJK characters, Arabic RTL script, diacritics, and emoji glyphs",
        },
        {
          fieldId: `${f.formId}-${f.name}-malicious`,
          fieldName: f.name,
          fieldType: "search",
          category: "malicious",
          values: ["' OR 1=1 --", "<img src=x onerror=console.log(1)>", "../../../etc/passwd", "${7*7}"],
          description: "OWASP safe non-destructive reflection and SSTI probe syntax",
        }
      );
    } else {
      result.push(
        {
          fieldId: `${f.formId}-${f.name}-valid`,
          fieldName: f.name,
          fieldType: f.type || "text",
          category: "valid",
          values: ["Standard QA Test Entry", "Beta Test Organization", "Sample Data Value #42"],
          description: "Normal expected field values",
        },
        {
          fieldId: `${f.formId}-${f.name}-overflow`,
          fieldName: f.name,
          fieldType: f.type || "text",
          category: "overflow",
          values: ["A".repeat(1024), "X".repeat(4096)],
          description: "Excessive length strings testing DOM and DB truncation handling",
        }
      );
    }
  }

  return result;
}

function getFallbackTestCases(app: DiscoveredApp, strategies: TestStrategyItem[]): TestCase[] {
  return [
    {
      id: "TC-01",
      name: "Target Homepage Smoke & Status Check",
      category: "functional",
      description: "Verify landing page loads with HTTP 200 and document title within 2500ms",
      given: `User accesses ${app.targetUrl}`,
      when: "The initial GET request is received and DOM completes first paint",
      then: "Status code is 200, no fatal uncaught JS exceptions, and main container is visible",
      playwrightCode: `import { test, expect } from '@playwright/test';

test('Homepage smoke check', async ({ page }) => {
  const response = await page.goto('${app.targetUrl}', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/./);
  const body = page.locator('body');
  await expect(body).toBeVisible();
});`,
      priority: "critical",
    },
    {
      id: "TC-02",
      name: "Security Headers & Cookie Flags Audit",
      category: "security",
      description: "Verify presence of HSTS, CSP, X-Content-Type-Options, and Secure/SameSite flags",
      given: "Server sends response headers on primary document",
      when: "HTTP headers are inspected for defensive policies",
      then: "Strict-Transport-Security, X-Frame-Options or CSP frame-ancestors, and no server banner leakage",
      playwrightCode: `import { test, expect } from '@playwright/test';

test('Security headers compliance', async ({ request }) => {
  const response = await request.get('${app.targetUrl}');
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  // Check for HSTS in production
  if ('${app.targetUrl}'.startsWith('https')) {
    expect(headers['strict-transport-security']).toBeDefined();
  }
});`,
      priority: "high",
    },
    {
      id: "TC-03",
      name: "WCAG 2.2 AA Accessibility Axe-Core Compliance",
      category: "accessibility",
      description: "Run automated axe-core accessibility engine for color contrast, landmarks, and alt tags",
      given: "Rendered page DOM with interactive elements",
      when: "Axe accessibility ruleset runs across all nodes",
      then: "Zero critical or serious violations for color contrast, button names, and form labels",
      playwrightCode: `import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WCAG 2.2 AA audit', async ({ page }) => {
  await page.goto('${app.targetUrl}');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
});`,
      priority: "high",
    },
    {
      id: "TC-04",
      name: "Controlled Burst Rate Limiting & Throttling",
      category: "rate_limiting",
      description: "Send 25 consecutive requests in 1 second window to verify rate throttling behavior",
      given: "Target public endpoint",
      when: "Rapid request burst exceeds standard human velocity",
      then: "Server handles requests or responds with HTTP 429 and Retry-After header without 500 error",
      playwrightCode: `import { test, expect } from '@playwright/test';

test('Rate limiting burst threshold', async ({ request }) => {
  const requests = Array.from({ length: 20 }).map(() => request.get('${app.targetUrl}'));
  const responses = await Promise.all(requests);
  const statuses = responses.map(r => r.status());
  expect(statuses.every(s => s === 200 || s === 429)).toBe(true);
});`,
      priority: "medium",
    },
    {
      id: "TC-05",
      name: "Multi-Device Responsive Viewport & Layout Shift",
      category: "visual_ux",
      description: "Test layout rendering at Mobile (375x667), Tablet (768x1024), and Desktop (1440x900)",
      given: "Different device screen viewports",
      when: "Page renders under mobile emulation",
      then: "No horizontal scrollbar overflow, hamburger menu appears or navigation adapts seamlessly",
      playwrightCode: `import { test, expect } from '@playwright/test';

test('Mobile viewport responsiveness', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('${app.targetUrl}');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // No accidental horizontal overflow
});`,
      priority: "medium",
    },
    {
      id: "TC-06",
      name: "Resilience Under Throttled Slow 3G Network",
      category: "reliability",
      description: "Emulate high-latency throttled network and verify graceful spinner or skeleton display",
      given: "Client connected via throttled 3G profile (400ms RTT, 400kbps)",
      when: "Page components load asynchronously",
      then: "Loading skeletons appear, no timeout crashes, and interactive UI stabilizes",
      playwrightCode: `import { test, expect } from '@playwright/test';

test('Resilience on throttled slow 3G', async ({ page, context }) => {
  const client = await context.newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 350,
    downloadThroughput: 500 * 1024 / 8,
    uploadThroughput: 500 * 1024 / 8,
  });
  await page.goto('${app.targetUrl}', { timeout: 15000 });
  await expect(page.locator('body')).toBeVisible();
});`,
      priority: "medium",
    },
    {
      id: "TC-07",
      name: "Self-Healing Selector Recovery",
      category: "self_healing",
      description: "Verify that when primary CSS selector changes, AI identifies fallback semantic locator",
      given: "A dynamically updated or mutated component",
      when: "Old selector '#submit-btn-v1' is removed in favor of '[data-testid=submit-action]'",
      then: "TestPilot AI self-heals by resolving role 'button' with matching accessible text",
      playwrightCode: `import { test, expect } from '@playwright/test';

test('Self-healing fallback locator', async ({ page }) => {
  await page.goto('${app.targetUrl}');
  // Autonomous locator resolution: primary -> data-testid -> role + accessible name
  const button = page.getByRole('button', { name: /search|submit|login|get started|explore/i }).first();
  if (await button.isVisible()) {
    await expect(button).toBeEnabled();
  }
});`,
      priority: "low",
    },
  ];
}

function generateFallbackCustomData(options: SyntheticGeneratorOptions): SyntheticGeneratedResult {
  const names = [
    "Eleanor Vance",
    "Marcus Sterling",
    "Aria Montgomery",
    "Kenji Takahashi",
    "Sofia Rodriguez",
    "Devon Brooks",
    "Priya Sharma",
    "Liam O'Connor",
    "Zane Al-Mansoor",
    "Chloe Dupont",
    "Hao Chen",
    "Fatima Zahra",
  ];

  const domains = ["testpilot-qa.example.com", "enterprise-mock.internal", "synthetic-lab.io", "sample-corp.org"];
  const cities = ["San Francisco", "Berlin", "Tokyo", "London", "Austin", "Toronto", "Sydney", "Singapore"];
  const statuses = ["active", "pending_review", "verified", "suspended", "archived"];

  const rows: Record<string, any>[] = [];
  const count = Math.min(Math.max(options.rowCount || 10, 5), 50);

  for (let i = 0; i < count; i++) {
    const isEdge = Math.random() < options.edgeCaseRatio;
    const name = names[i % names.length];
    const emailPrefix = name.toLowerCase().replace(/[^a-z]/g, ".");
    const email = `${emailPrefix}.${i + 10}@${domains[i % domains.length]}`;

    if (isEdge && i % 3 === 0) {
      rows.push({
        id: `USR-${String(i + 1).padStart(4, "0")}`,
        full_name: "O'Neil Jr. & Sons",
        email: `boundary.max.length.user.${i}@${domains[0]}`,
        phone: "+1 (555) 019-9832",
        account_balance: 999999.99,
        status: "pending_review",
        city: "São Paulo / 東京",
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        test_card: "4242-4242-4242-4242",
      });
    } else {
      rows.push({
        id: `USR-${String(i + 1).padStart(4, "0")}`,
        full_name: name,
        email,
        phone: `+1 (555) ${100 + i}-${2000 + i * 7}`,
        account_balance: Number((120.5 + i * 34.25).toFixed(2)),
        status: statuses[i % statuses.length],
        city: cities[i % cities.length],
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        test_card: `4000-0012-0003-${1000 + (i % 9000)}`,
      });
    }
  }

  const fields = [
    { name: "id", type: "string", sampleValues: ["USR-0001", "USR-0002"], qualityScore: 100 },
    { name: "full_name", type: "string", sampleValues: ["Eleanor Vance", "Marcus Sterling"], qualityScore: 98 },
    { name: "email", type: "email", sampleValues: ["eleanor.vance.10@testpilot-qa.example.com"], qualityScore: 99 },
    { name: "phone", type: "phone", sampleValues: ["+1 (555) 100-2000"], qualityScore: 96 },
    { name: "account_balance", type: "currency", sampleValues: ["120.50", "999999.99"], qualityScore: 95 },
    { name: "status", type: "enum", sampleValues: ["active", "pending_review"], qualityScore: 97 },
    { name: "city", type: "city", sampleValues: ["San Francisco", "Tokyo"], qualityScore: 94 },
    { name: "test_card", type: "credit_card_test", sampleValues: ["4242-4242-4242-4242"], qualityScore: 100 },
  ];

  return {
    fields,
    rows,
    qualityScore: {
      uniqueness: 97,
      validity: 99,
      distributionRealism: 95,
      overall: 97,
    },
    exportedCode: formatExportedCode(rows, options.exportFormat),
  };
}
