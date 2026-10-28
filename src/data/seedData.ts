/**
 * Pre-baked Demo Data & Sample Targets for Instant Evaluation
 */
import type {
  TargetConfig,
  DiscoveredApp,
  TestStrategyItem,
  SyntheticDataset,
  TestCase,
  TestRunReport,
} from "../types/index.ts";

export const DEMO_TARGET_SHOPSPHERE: TargetConfig = {
  id: "demo-shopsphere",
  url: "https://shopsphere-demo.testpilot.ai",
  projectName: "ShopSphere Global Commerce",
  depth: "deep",
  authEnabled: true,
  credentials: {
    username: "qa-auditor@testpilot.ai",
    password: "••••••••••••",
  },
  openApiUrl: "https://shopsphere-demo.testpilot.ai/api/v1/openapi.json",
  verifiedOwnership: true,
  verificationMethod: "dns_txt",
  consentAccepted: true,
  createdAt: "2026-10-26T14:30:00Z",
};

export const DEMO_APP_SHOPSPHERE: DiscoveredApp = {
  targetUrl: "https://shopsphere-demo.testpilot.ai",
  title: "ShopSphere - Enterprise Next-Gen Cloud Commerce",
  techStack: {
    frontend: ["React 19", "Next.js 15 App Router", "Tailwind CSS v4"],
    backend: ["Node.js Express microservices", "GraphQL Gateway"],
    server: ["Cloudflare Edge Network", "Nginx Reverse Proxy (HTTP/2, TLS 1.3)"],
    securityHeaders: {
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  },
  pages: [
    { url: "https://shopsphere-demo.testpilot.ai", title: "Storefront Homepage", statusCode: 200, responseTimeMs: 110 },
    { url: "https://shopsphere-demo.testpilot.ai/catalog", title: "Product Catalog & Filters", statusCode: 200, responseTimeMs: 145 },
    { url: "https://shopsphere-demo.testpilot.ai/cart", title: "Interactive Shopping Cart", statusCode: 200, responseTimeMs: 95 },
    { url: "https://shopsphere-demo.testpilot.ai/checkout", title: "Multi-Step Checkout", statusCode: 200, responseTimeMs: 130 },
    { url: "https://shopsphere-demo.testpilot.ai/account/login", title: "Customer Auth Portal", statusCode: 200, responseTimeMs: 88 },
  ],
  forms: [
    {
      id: "form-search",
      action: "/catalog",
      method: "GET",
      inputs: [
        { name: "query", type: "search", placeholder: "Search 50,000+ consumer items...", required: false },
        { name: "category", type: "select", required: false },
      ],
    },
    {
      id: "form-auth",
      action: "/api/v1/auth/login",
      method: "POST",
      inputs: [
        { name: "email", type: "email", placeholder: "customer@domain.com", required: true },
        { name: "password", type: "password", placeholder: "••••••••", required: true },
        { name: "remember_me", type: "checkbox", required: false },
      ],
    },
    {
      id: "form-checkout",
      action: "/api/v1/orders/checkout",
      method: "POST",
      inputs: [
        { name: "card_number", type: "text", placeholder: "4242 •••• •••• 4242", required: true },
        { name: "exp_date", type: "text", placeholder: "MM / YY", required: true },
        { name: "cvv", type: "password", placeholder: "CVC", required: true },
        { name: "postal_code", type: "text", placeholder: "94105", required: true },
      ],
    },
  ],
  apiEndpoints: [
    { method: "GET", path: "/api/v1/catalog/products", params: ["page", "limit", "category", "sort"], hasAuth: false },
    { method: "POST", path: "/api/v1/cart/items", hasAuth: true },
    { method: "POST", path: "/api/v1/auth/login", hasAuth: false },
    { method: "POST", path: "/api/v1/orders/checkout", hasAuth: true },
    { method: "GET", path: "/api/v1/user/profile", hasAuth: true },
  ],
  authFlows: [
    {
      type: "JWT Bearer + HttpOnly Refresh Cookie",
      loginEndpoint: "/api/v1/auth/login",
      csrfProtection: true,
    },
  ],
  appMap: {
    nodes: [
      { id: "n-root", label: "ShopSphere Storefront", type: "page", riskLevel: "low", url: "https://shopsphere-demo.testpilot.ai" },
      { id: "n-catalog", label: "Catalog & Search", type: "page", riskLevel: "low", url: "/catalog" },
      { id: "n-checkout", label: "Checkout & Payments", type: "page", riskLevel: "high", url: "/checkout" },
      { id: "n-auth-page", label: "Customer Auth", type: "page", riskLevel: "medium", url: "/account/login" },
      { id: "n-form-search", label: "Product Search Query", type: "form", riskLevel: "medium" },
      { id: "n-form-auth", label: "Login Credentials Form", type: "form", riskLevel: "high" },
      { id: "n-form-checkout", label: "Payment Gateway Form", type: "form", riskLevel: "critical" },
      { id: "n-api-catalog", label: "GET /api/v1/catalog/products", type: "api", method: "GET", riskLevel: "low" },
      { id: "n-api-auth", label: "POST /api/v1/auth/login", type: "api", method: "POST", riskLevel: "high" },
      { id: "n-api-order", label: "POST /api/v1/orders/checkout", type: "api", method: "POST", riskLevel: "critical" },
      { id: "n-auth-sec", label: "JWT Token Engine & Rate Limiter", type: "auth", riskLevel: "high" },
    ],
    edges: [
      { id: "e1", source: "n-root", target: "n-catalog", label: "Browse", relationType: "links_to" },
      { id: "e2", source: "n-root", target: "n-checkout", label: "Direct Buy", relationType: "links_to" },
      { id: "e3", source: "n-root", target: "n-auth-page", label: "Sign In", relationType: "links_to" },
      { id: "e4", source: "n-catalog", target: "n-form-search", label: "Contains", relationType: "submits_to" },
      { id: "e5", source: "n-auth-page", target: "n-form-auth", label: "Contains", relationType: "submits_to" },
      { id: "e6", source: "n-checkout", target: "n-form-checkout", label: "Payment Info", relationType: "submits_to" },
      { id: "e7", source: "n-form-search", target: "n-api-catalog", label: "Queries", relationType: "calls_api" },
      { id: "e8", source: "n-form-auth", target: "n-api-auth", label: "Authenticates", relationType: "calls_api" },
      { id: "e9", source: "n-form-checkout", target: "n-api-order", label: "Authorizes", relationType: "calls_api" },
      { id: "e10", source: "n-api-auth", target: "n-auth-sec", label: "Verifies", relationType: "requires_auth" },
    ],
  },
};

export const DEMO_STRATEGIES_SHOPSPHERE: TestStrategyItem[] = [
  {
    id: "strat-functional",
    category: "functional",
    name: "Functional E2E User Flows & Broken Link Crawler",
    description: "Verify all 5 pages, checkout funnel navigation, and button click handlers.",
    selected: true,
    isIntrusive: false,
    riskScore: 15,
    confidenceScore: 98,
    reason: "Storefront contains multi-step checkout funnel requiring seamless link & state integrity.",
    recommendationType: "recommended",
    estimatedDurationSec: 18,
  },
  {
    id: "strat-rate-limit",
    category: "rate_limiting",
    name: "Controlled Burst & Rate Throttling Detection",
    description: "Send 25 req/s bursts to /api/v1/auth/login and /catalog to identify RPS threshold & 429 response.",
    selected: true,
    isIntrusive: true,
    riskScore: 72,
    confidenceScore: 94,
    reason: "Public authentication route and checkout endpoint must enforce IP throttling to prevent credential stuffing.",
    recommendationType: "recommended",
    estimatedDurationSec: 25,
  },
  {
    id: "strat-security",
    category: "security",
    name: "OWASP Safe Non-Destructive Vulnerability Audit",
    description: "Safe XSS reflection on search query, SQLi error probes on filters, HSTS/CSP validation.",
    selected: true,
    isIntrusive: true,
    riskScore: 85,
    confidenceScore: 93,
    reason: "Payment card inputs and user search boxes make this target prime for OWASP compliance verification.",
    recommendationType: "recommended",
    estimatedDurationSec: 32,
  },
  {
    id: "strat-performance",
    category: "performance",
    name: "k6-Style Concurrency & Latency Soak",
    description: "Ramp up to 20 virtual users soaking catalog and checkout endpoints for p50/p95/p99 latency.",
    selected: true,
    isIntrusive: true,
    riskScore: 68,
    confidenceScore: 91,
    reason: "Commerce traffic spikes require validated response latency under concurrency.",
    recommendationType: "recommended",
    estimatedDurationSec: 30,
  },
  {
    id: "strat-accessibility",
    category: "accessibility",
    name: "WCAG 2.2 Level AA Axe-Core Compliance Audit",
    description: "Automated scan for color contrast, ARIA landmarks, form labels, and screen reader announcements.",
    selected: true,
    isIntrusive: false,
    riskScore: 10,
    confidenceScore: 99,
    reason: "E-commerce legal accessibility compliance and usability for assistive technologies.",
    recommendationType: "recommended",
    estimatedDurationSec: 14,
  },
  {
    id: "strat-api",
    category: "api_testing",
    name: "REST API JSON Schema & Negative Fuzzing",
    description: "Assert status codes, JSON schema types, and negative payload handling across 5 endpoints.",
    selected: true,
    isIntrusive: false,
    riskScore: 40,
    confidenceScore: 95,
    reason: "App relies on 5 backend JSON API routes for cart, products, and checkout processing.",
    recommendationType: "recommended",
    estimatedDurationSec: 20,
  },
  {
    id: "strat-visual",
    category: "visual_ux",
    name: "Multi-Viewport Responsive & Visual Regression",
    description: "Emulate Mobile (375px), Tablet (768px), and Desktop (1440px) viewports with screenshot diffing.",
    selected: true,
    isIntrusive: false,
    riskScore: 18,
    confidenceScore: 96,
    reason: "Mobile shoppers represent >60% of e-commerce traffic; layout shift is critical.",
    recommendationType: "recommended",
    estimatedDurationSec: 16,
  },
  {
    id: "strat-usability",
    category: "usability",
    name: "Nielsen 10 Usability Heuristics AI Vision Review",
    description: "Gemini multimodal review of layout, error feedback, cognitive friction, and checkout clarity.",
    selected: true,
    isIntrusive: false,
    riskScore: 12,
    confidenceScore: 90,
    reason: "Catches confusing checkout UX patterns that cause cart abandonment.",
    recommendationType: "recommended",
    estimatedDurationSec: 15,
  },
  {
    id: "strat-localization",
    category: "localization",
    name: "i18n, RTL, & Unicode Overflow Testing",
    description: "Stress test product search and addresses with CJK, Arabic RTL, and German compound words.",
    selected: true,
    isIntrusive: false,
    riskScore: 15,
    confidenceScore: 92,
    reason: "Global commerce requires seamless handling of international scripts and postal codes.",
    recommendationType: "recommended",
    estimatedDurationSec: 15,
  },
  {
    id: "strat-reliability",
    category: "reliability",
    name: "Reliability & Resilience (Slow 3G, Offline, Timeout)",
    description: "Emulate high latency 400ms network, check skeleton loaders, verify offline cart persistence.",
    selected: true,
    isIntrusive: false,
    riskScore: 22,
    confidenceScore: 91,
    reason: "Ensures customers in low-connectivity areas do not encounter broken blank screens.",
    recommendationType: "recommended",
    estimatedDurationSec: 18,
  },
  {
    id: "strat-data-validation",
    category: "data_validation",
    name: "Input Boundary Analysis & Pairwise Permutation",
    description: "Test min/max length, credit card checksums, and combinatorial form field permutations.",
    selected: true,
    isIntrusive: false,
    riskScore: 30,
    confidenceScore: 95,
    reason: "Checkout form inputs require strict boundary value testing to prevent invalid orders.",
    recommendationType: "recommended",
    estimatedDurationSec: 18,
  },
  {
    id: "strat-exploratory",
    category: "exploratory",
    name: "Autonomous Gemini Exploratory QA Agent",
    description: "AI agent simulates unexpected consumer journeys: rapid cart addition, back-forward cycles.",
    selected: true,
    isIntrusive: false,
    riskScore: 28,
    confidenceScore: 89,
    reason: "Explores non-linear human interactions to find race conditions in cart state.",
    recommendationType: "recommended",
    estimatedDurationSec: 25,
  },
  {
    id: "strat-self-healing",
    category: "self_healing",
    name: "Self-Healing Selector & Mutation Engine",
    description: "Emulates broken button selectors and demonstrates automatic semantic AI locator rescue.",
    selected: true,
    isIntrusive: false,
    riskScore: 10,
    confidenceScore: 98,
    reason: "Prevents flaky CI pipeline failures when storefront styling or markup is refactored.",
    recommendationType: "recommended",
    estimatedDurationSec: 12,
  },
  {
    id: "strat-compatibility",
    category: "compatibility",
    name: "Cross-Browser Engine Compatibility",
    description: "Validate rendering across Chromium (Blink), Firefox (Gecko), and Safari (WebKit).",
    selected: true,
    isIntrusive: false,
    riskScore: 14,
    confidenceScore: 97,
    reason: "Verifies CSS grid, backdrop filters, and payment modals across all browser rendering engines.",
    recommendationType: "recommended",
    estimatedDurationSec: 18,
  },
];

export const DEMO_SYNTHETIC_DATA: SyntheticDataset[] = [
  {
    fieldId: "card_number-valid",
    fieldName: "card_number",
    fieldType: "credit_card",
    category: "valid",
    values: ["4242-4242-4242-4242", "4000-0012-3456-7890", "5555-5555-5555-4444"],
    description: "Standard PCI test card numbers (Luhn algorithm compliant)",
  },
  {
    fieldId: "card_number-boundary",
    fieldName: "card_number",
    fieldType: "credit_card",
    category: "boundary",
    values: ["4242", "4242-4242-4242-4242-9999", "3782-822463-10005"],
    description: "Min 4-digit prefix, max 19-digit Amex/UnionPay boundary lengths",
  },
  {
    fieldId: "card_number-malicious",
    fieldName: "card_number",
    fieldType: "credit_card",
    category: "malicious",
    values: ["' OR '1'='1", "<script>alert(1)</script>", "0000000000000000"],
    description: "Safe injection probe and zeroed out payload",
  },
  {
    fieldId: "search-unicode",
    fieldName: "query",
    fieldType: "search",
    category: "unicode",
    values: ["スマートウォッチ", "حقيبة ظهر مقاومة للماء", "Kopfhörer mit Geräuschunterdrückung", "🎧✨🔥"],
    description: "Japanese Kanji, Arabic RTL, German compound words, and emoji characters",
  },
  {
    fieldId: "email-overflow",
    fieldName: "email",
    fieldType: "email",
    category: "overflow",
    values: ["user." + "a".repeat(200) + "@example.com", "test@" + "b".repeat(200) + ".com"],
    description: "Buffer stress test exceeding normal RFC length limits",
  },
];

export const DEMO_TEST_CASES: TestCase[] = [
  {
    id: "TC-01",
    name: "Storefront Homepage Smoke & Interactive Hero Test",
    category: "functional",
    description: "Assert homepage renders, title is correct, and category banner is clickable.",
    given: "User navigates to https://shopsphere-demo.testpilot.ai",
    when: "Page finishes initial network idle and DOM content loaded",
    then: "Status is 200, title matches 'ShopSphere', and main hero CTA is enabled",
    playwrightCode: `import { test, expect } from '@playwright/test';

test('ShopSphere homepage smoke check', async ({ page }) => {
  const response = await page.goto('https://shopsphere-demo.testpilot.ai');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/ShopSphere/);
  const heroButton = page.getByRole('button', { name: /explore|shop now|view catalog/i });
  await expect(heroButton).toBeVisible();
});`,
    priority: "critical",
  },
  {
    id: "TC-02",
    name: "Rate Limiting & Brute-Force Throttling on Auth Route",
    category: "rate_limiting",
    description: "Verify that 25 rapid login attempts trigger HTTP 429 Too Many Requests.",
    given: "Target authentication route /api/v1/auth/login",
    when: "Dispatched 25 concurrent POST requests with test credentials",
    then: "Server returns HTTP 429 after 20 requests with 'Retry-After: 30' header",
    playwrightCode: `import { test, expect } from '@playwright/test';

test('Rate limiting lockout verification', async ({ request }) => {
  const attempts = Array.from({ length: 25 }).map(() =>
    request.post('https://shopsphere-demo.testpilot.ai/api/v1/auth/login', {
      data: { email: 'probe@testpilot.ai', password: 'wrong-password' },
    })
  );
  const responses = await Promise.all(attempts);
  const has429 = responses.some(r => r.status() === 429);
  expect(has429).toBe(true);
});`,
    priority: "high",
  },
  {
    id: "TC-03",
    name: "WCAG 2.2 AA Axe-Core Automated Accessibility Scan",
    category: "accessibility",
    description: "Scan all interactive buttons, form controls, and text contrast on storefront.",
    given: "Storefront DOM elements rendered in headless Chromium",
    when: "Axe-core runs automated WCAG 2.2 Level AA audit rules",
    then: "Zero critical or serious violations for color contrast, landmarks, and alt tags",
    playwrightCode: `import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WCAG 2.2 AA accessibility audit', async ({ page }) => {
  await page.goto('https://shopsphere-demo.testpilot.ai');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
});`,
    priority: "high",
  },
  {
    id: "TC-04",
    name: "Self-Healing Dynamic Selector Recovery",
    category: "self_healing",
    description: "Simulate broken legacy CSS class and demonstrate automatic AI selector healing.",
    given: "A renamed checkout button in newly deployed release",
    when: "Legacy locator '.btn-checkout-v1' throws NoSuchElement exception",
    then: "TestPilot AI detects accessible name 'Proceed to Checkout' and executes click without failure",
    playwrightCode: `import { test, expect } from '@playwright/test';

test('Self-healing checkout button', async ({ page }) => {
  await page.goto('https://shopsphere-demo.testpilot.ai/cart');
  // AI Self-Healing Fallback pattern:
  const checkoutBtn = page.getByRole('button', { name: /proceed to checkout|checkout/i });
  await expect(checkoutBtn).toBeVisible();
  await checkoutBtn.click();
});`,
    priority: "medium",
  },
];
