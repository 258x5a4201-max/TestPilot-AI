/**
 * TestPilot AI - Shared Domain Types
 */

export type TestDepth = 'quick' | 'standard' | 'deep';

export type UserRole = 'Admin' | 'Tester' | 'Viewer';

export type Permission =
  | 'manage_users'
  | 'change_roles'
  | 'verify_domain'
  | 'run_intrusive_tests'
  | 'run_tests'
  | 'generate_data'
  | 'export_reports'
  | 'view_reports'
  | 'delete_projects'
  | 'view_audit_log'
  | 'stop_runs';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    'manage_users',
    'change_roles',
    'verify_domain',
    'run_intrusive_tests',
    'run_tests',
    'generate_data',
    'export_reports',
    'view_reports',
    'delete_projects',
    'view_audit_log',
    'stop_runs',
  ],
  Tester: [
    'run_tests',
    'generate_data',
    'export_reports',
    'view_reports',
    'stop_runs',
  ],
  Viewer: [
    'view_reports',
  ],
};

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department: string;
  lastActive: string;
}

export interface TargetConfig {
  id: string;
  url: string;
  projectName: string;
  depth: TestDepth;
  authEnabled: boolean;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  openApiUrl?: string;
  verifiedOwnership: boolean;
  verificationMethod?: 'dns_txt' | 'well_known' | 'exempt_non_intrusive';
  consentAccepted: boolean;
  createdAt: string;
}

export interface AppMapNode {
  id: string;
  label: string;
  type: 'page' | 'form' | 'api' | 'auth' | 'input' | 'button' | 'service';
  url?: string;
  method?: string;
  details?: Record<string, any>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AppMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationType: 'links_to' | 'submits_to' | 'calls_api' | 'requires_auth';
}

export interface DiscoveredApp {
  targetUrl: string;
  title: string;
  techStack: {
    frontend?: string[];
    backend?: string[];
    server?: string[];
    securityHeaders?: Record<string, string>;
  };
  pages: {
    url: string;
    title: string;
    statusCode: number;
    responseTimeMs: number;
  }[];
  forms: {
    id: string;
    action: string;
    method: string;
    inputs: {
      name: string;
      type: string;
      placeholder?: string;
      required: boolean;
    }[];
  }[];
  apiEndpoints: {
    method: string;
    path: string;
    params?: string[];
    hasAuth: boolean;
  }[];
  authFlows: {
    type: string;
    loginEndpoint?: string;
    csrfProtection: boolean;
  }[];
  appMap: {
    nodes: AppMapNode[];
    edges: AppMapEdge[];
  };
}

export type TestCategory =
  | 'functional'
  | 'performance'
  | 'rate_limiting'
  | 'security'
  | 'api_testing'
  | 'visual_ux'
  | 'accessibility'
  | 'compatibility'
  | 'usability'
  | 'localization'
  | 'reliability'
  | 'data_validation'
  | 'exploratory'
  | 'self_healing';

export interface TestStrategyItem {
  id: string;
  category: TestCategory;
  name: string;
  description: string;
  selected: boolean;
  isIntrusive: boolean; // Requires verified ownership
  riskScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  reason: string;
  recommendationType: 'recommended' | 'optional' | 'skipped';
  skipReason?: string;
  estimatedDurationSec: number;
}

export interface SyntheticDataset {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  category: 'valid' | 'invalid' | 'boundary' | 'edge' | 'unicode' | 'overflow' | 'empty' | 'malicious';
  values: string[];
  description: string;
}

export interface TestCase {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  given: string;
  when: string;
  then: string;
  playwrightCode: string;
  syntheticDataRef?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export type TestStatus = 'queued' | 'running' | 'passed' | 'failed' | 'skipped' | 'healing';

export interface TestExecutionResult {
  testId: string;
  testName: string;
  category: TestCategory;
  status: TestStatus;
  durationMs: number;
  stepsExecuted: {
    step: string;
    status: 'passed' | 'failed';
    durationMs: number;
    log?: string;
  }[];
  requestData?: {
    url: string;
    method: string;
    payload?: any;
    headers?: Record<string, string>;
  };
  responseData?: {
    statusCode: number;
    latencyMs: number;
    headers?: Record<string, string>;
    bodySnippet?: string;
  };
  screenshotUrl?: string;
  videoUrl?: string;
  consoleLogs: string[];
  networkCalls: {
    url: string;
    method: string;
    status: number;
    durationMs: number;
  }[];
  errorDetails?: {
    message: string;
    stack?: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    rootCause: string;
    reproductionSteps: string[];
    suggestedFix: string;
    selfHealed?: boolean;
    alternativeSelector?: string;
  };
  axeViolations?: {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodesCount: number;
    fixSuggestion: string;
  }[];
}

export interface TestRunReport {
  id: string;
  targetUrl: string;
  projectName: string;
  timestamp: string;
  totalDurationMs: number;
  healthScore: number; // 0 - 100
  totalTests: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  healingCount: number;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryCoverage: {
    category: TestCategory;
    passed: number;
    failed: number;
    total: number;
  }[];
  performanceMetrics: {
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    p99ResponseTimeMs: number;
    requestsPerSecond: number;
    peakConcurrentUsers: number;
    errorRatePercent: number;
    rateLimitDetected: boolean;
    rateLimitRpsThreshold?: number;
  };
  results: TestExecutionResult[];
  aiExecutiveSummary: string;
}

export interface SyntheticGeneratorOptions {
  schemaPrompt?: string;
  schemaType: 'custom_prompt' | 'json_schema' | 'csv_headers' | 'sql_ddl' | 'inferred_form';
  rawSchema?: string;
  locale: 'en_US' | 'es_ES' | 'de_DE' | 'fr_FR' | 'ja_JP' | 'hi_IN';
  rowCount: number;
  edgeCaseRatio: number; // 0 to 1
  piiFreeGuarantee: boolean;
  seed: number;
  exportFormat: 'json' | 'csv' | 'sql' | 'playwright';
  fastMode?: boolean; // Skip expensive full-array validation on 100k rows
}

export interface SyntheticFieldSpec {
  name: string;
  type: string;
  format?: string;
  min?: number;
  max?: number;
  enumValues?: string[];
  sampleValues?: string[];
  description?: string;
}

export interface SyntheticGenerationSpec {
  specId: string;
  description: string;
  fields: SyntheticFieldSpec[];
  edgeCaseProfiles?: {
    nullRate?: number;
    boundaryRate?: number;
    unicodeRate?: number;
    overflowRate?: number;
  };
}

export interface PerformanceTimingStats {
  specMs: number;
  genMs: number;
  renderMs: number;
  totalMs: number;
  rowsPerSec: number;
  cachedSpec: boolean;
}

export interface SyntheticGeneratedResult {
  fields: {
    name: string;
    type: string;
    sampleValues: string[];
    qualityScore: number;
  }[];
  rows: Record<string, any>[];
  totalRowCount?: number;
  previewRowCount?: number;
  qualityScore: {
    uniqueness: number; // 0 - 100
    validity: number; // 0 - 100
    distributionRealism: number; // 0 - 100
    overall: number; // 0 - 100
  };
  exportedCode: string;
  perfStats?: PerformanceTimingStats;
}

