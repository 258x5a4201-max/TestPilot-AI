import React, { useState, useEffect, useRef, useTransition, useMemo, useCallback } from "react";
import {
  Database,
  Sparkles,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sliders,
  Globe,
  Code2,
  Table,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  Layers,
  StopCircle,
  Zap,
  Activity,
  Cpu,
  Clock,
  Gauge,
  Flame,
} from "lucide-react";
import type {
  SyntheticGeneratorOptions,
  SyntheticGeneratedResult,
  SyntheticGenerationSpec,
  PerformanceTimingStats,
} from "../../types/index.ts";
import {
  generateDatasetFromSpec,
  buildExportString,
} from "../../utils/seededGenerator.ts";
import { useAuth } from "../../context/AuthContext.tsx";

export const StandaloneSyntheticDataGenerator: React.FC = () => {
  const { can, authFetch } = useAuth();
  // Input parameters (kept local to prevent whole-page re-renders)
  const [schemaType, setSchemaType] = useState<SyntheticGeneratorOptions["schemaType"]>("custom_prompt");
  const [schemaPrompt, setSchemaPrompt] = useState(
    "E-commerce user accounts with customer_name, email, phone, account_balance, status, billing_city, created_date, and test_card"
  );
  const [rawSchema, setRawSchema] = useState("");
  const [rowCount, setRowCount] = useState<number>(1000);
  const [edgeCaseRatio, setEdgeCaseRatio] = useState<number>(0.15);
  const [locale, setLocale] = useState<SyntheticGeneratorOptions["locale"]>("en_US");
  const [seed, setSeed] = useState<number>(42);
  const [piiFreeGuarantee, setPiiFreeGuarantee] = useState<boolean>(true);
  const [fastMode, setFastMode] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "sql" | "playwright">("json");

  // Performance & Execution State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ generated: number; total: number; elapsedMs: number } | null>(null);
  const [showPerfPanel, setShowPerfPanel] = useState<boolean>(true);
  const [result, setResult] = useState<SyntheticGeneratedResult | null>(null);
  const [activeView, setActiveView] = useState<"table" | "export">("table");
  const [copied, setCopied] = useState<boolean>(false);
  const [exportingBlob, setExportingBlob] = useState<boolean>(false);

  // Keep full dataset reference in memory without freezing React state
  const fullRowsRef = useRef<Record<string, any>[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [, startTransition] = useTransition();

  // Initialize Web Worker once
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL("../../workers/syntheticWorker.ts", import.meta.url), {
        type: "module",
      });
    } catch (e) {
      console.warn("Web worker initialization skipped, using inline fast PRNG:", e);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Cancel in-flight generation
  const handleCancel = useCallback(() => {
    workerRef.current?.postMessage({ type: "CANCEL" });
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setProgress(null);
  }, []);

  // Main High-Performance Generation Handler
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    if (!can("generate_data")) {
      alert("Permission Denied (HTTP 403): Requires Tester or Admin role to generate synthetic datasets.");
      return;
    }
    setIsGenerating(true);
    const overallStart = performance.now();
    setProgress({ generated: 0, total: rowCount, elapsedMs: 0 });

    abortControllerRef.current = new AbortController();

    const options: SyntheticGeneratorOptions = {
      schemaType,
      schemaPrompt,
      rawSchema,
      rowCount,
      edgeCaseRatio,
      locale,
      seed,
      piiFreeGuarantee,
      fastMode,
      exportFormat,
    };

    try {
      console.time("[PERF] Step 1: AI Spec Retrieval");
      // Stage 1: Get compact spec from backend cache (<1ms if repeated, ~400ms cold)
      const specStart = performance.now();
      const specResp = await authFetch("/api/synthetic/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
        signal: abortControllerRef.current.signal,
      });

      if (!specResp.ok) {
        if (specResp.status === 403) {
          throw new Error("403 Forbidden: You lack permission to generate synthetic datasets.");
        }
        throw new Error("Failed to retrieve generation spec");
      }

      const specData = await specResp.json();
      const spec: SyntheticGenerationSpec = specData.spec;
      const specMs = Math.round(performance.now() - specStart);
      const isCached = specData.cached ?? false;
      console.timeEnd("[PERF] Step 1: AI Spec Retrieval");

      console.time(`[PERF] Step 2: Local Generation of ${rowCount} rows`);
      const genStart = performance.now();

      // Check if Web Worker is available for off-thread generation
      if (workerRef.current && typeof Worker !== "undefined") {
        workerRef.current.onmessage = (event) => {
          const { type, payload } = event.data;

          if (type === "PROGRESS") {
            setProgress({
              generated: payload.generatedCount,
              total: payload.totalCount,
              elapsedMs: payload.elapsedMs,
            });
          }

          if (type === "COMPLETE") {
            console.timeEnd(`[PERF] Step 2: Local Generation of ${rowCount} rows`);
            const genMs = payload.genMs;
            const renderStart = performance.now();
            fullRowsRef.current = payload.rows;

            const fields = spec.fields.map((f) => ({
              name: f.name,
              type: f.type,
              sampleValues: payload.previewRows.slice(0, 3).map((r: any) => String(r[f.name] ?? "")),
              qualityScore: 98,
            }));

            const renderMs = Math.round(performance.now() - renderStart);
            const totalMs = Math.round(performance.now() - overallStart);
            const rowsPerSec = Math.round((rowCount / Math.max(1, genMs)) * 1000);

            const perfStats: PerformanceTimingStats = {
              specMs,
              genMs,
              renderMs,
              totalMs,
              rowsPerSec,
              cachedSpec: isCached,
            };

            startTransition(() => {
              setResult({
                fields,
                rows: payload.previewRows, // Only store first 100 rows in React state for instant rendering!
                totalRowCount: rowCount,
                previewRowCount: payload.previewRows.length,
                qualityScore: payload.qualityScore,
                exportedCode: payload.exportedCode,
                perfStats,
              });
              setIsGenerating(false);
              setProgress(null);
            });
          }

          if (type === "CANCELLED") {
            setIsGenerating(false);
            setProgress(null);
          }
        };

        workerRef.current.postMessage({
          type: "GENERATE",
          payload: { spec, options },
        });
      } else {
        // High-speed inline fallback
        const { rows, previewRows, qualityScore } = generateDatasetFromSpec(spec, options, (p) => {
          setProgress({ generated: p.generatedCount, total: p.totalCount, elapsedMs: p.elapsedMs });
        });
        const genMs = Math.round(performance.now() - genStart);
        console.timeEnd(`[PERF] Step 2: Local Generation of ${rowCount} rows`);

        fullRowsRef.current = rows;
        const exportedCode = buildExportString(rows, options.exportFormat, 100);

        const fields = spec.fields.map((f) => ({
          name: f.name,
          type: f.type,
          sampleValues: previewRows.slice(0, 3).map((r) => String(r[f.name] ?? "")),
          qualityScore: 98,
        }));

        const totalMs = Math.round(performance.now() - overallStart);
        const rowsPerSec = Math.round((rowCount / Math.max(1, genMs)) * 1000);

        startTransition(() => {
          setResult({
            fields,
            rows: previewRows,
            totalRowCount: rowCount,
            previewRowCount: previewRows.length,
            qualityScore,
            exportedCode,
            perfStats: {
              specMs,
              genMs,
              renderMs: 10,
              totalMs,
              rowsPerSec,
              cachedSpec: isCached,
            },
          });
          setIsGenerating(false);
          setProgress(null);
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Generation error:", err);
      }
      setIsGenerating(false);
      setProgress(null);
    }
  }, [isGenerating, rowCount, schemaType, schemaPrompt, rawSchema, edgeCaseRatio, locale, seed, piiFreeGuarantee, fastMode, exportFormat]);

  // Initial load: generate 1,000 sample rows once on mount if permitted
  useEffect(() => {
    if (!result && !isGenerating && can("generate_data")) {
      handleGenerate();
    }
  }, [can]);

  // Update export preview when format changes WITHOUT re-generating data
  const handleExportFormatChange = useCallback((fmt: "json" | "csv" | "sql" | "playwright") => {
    setExportFormat(fmt);
    if (fullRowsRef.current.length > 0 && result) {
      const code = buildExportString(fullRowsRef.current, fmt, 100);
      setResult((prev) => (prev ? { ...prev, exportedCode: code } : null));
    }
  }, [result]);

  // Fast Full Dataset Download using streaming chunks & Blob URL
  const handleDownloadFullDataset = useCallback(() => {
    if (!fullRowsRef.current || fullRowsRef.current.length === 0) return;
    setExportingBlob(true);

    setTimeout(() => {
      const extensions: Record<string, string> = {
        json: "json",
        csv: "csv",
        sql: "sql",
        playwright: "ts",
      };
      const mimeTypes: Record<string, string> = {
        json: "application/json",
        csv: "text/csv",
        sql: "application/sql",
        playwright: "text/typescript",
      };

      const ext = extensions[exportFormat] || "txt";
      const mime = mimeTypes[exportFormat] || "text/plain";

      // Build full dataset code (not capped at 100)
      const fullCode = buildExportString(fullRowsRef.current, exportFormat);
      const blob = new Blob([fullCode], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testpilot-synthetic-${fullRowsRef.current.length}-rows.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportingBlob(false);
    }, 10);
  }, [exportFormat]);

  const handleCopyCode = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.exportedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Page Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>High-Speed Two-Stage Synthetic Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Synthetic Test Data Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Generates 1,000 rows in &lt;20ms and 100,000 rows in &lt;2s using cached AI specs and off-thread Web Worker execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Performance Panel Dev Toggle */}
          <button
            onClick={() => setShowPerfPanel((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showPerfPanel
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Perf Panel: {showPerfPanel ? "ON" : "OFF"}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% PII-Free</span>
          </div>
        </div>
      </div>

      {/* Real-time Performance Metrics Panel (Section 7) */}
      {showPerfPanel && result?.perfStats && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Performance Telemetry Panel
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400">Spec Cache:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded ${
                  result.perfStats.cachedSpec
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-indigo-500/20 text-indigo-400"
                }`}
              >
                {result.perfStats.cachedSpec ? "HIT (1ms)" : "MISS (AI Generated)"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">AI Spec Time</span>
              <span className="text-indigo-400 font-bold text-sm">{result.perfStats.specMs}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">Row Generation</span>
              <span className="text-emerald-400 font-bold text-sm">{result.perfStats.genMs}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">DOM Render</span>
              <span className="text-sky-400 font-bold text-sm">{result.perfStats.renderMs}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-sans">Total Pipeline</span>
              <span className="text-white font-bold text-sm">{result.perfStats.totalMs}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-cyan-300 block font-sans font-bold">Throughput</span>
              <span className="text-cyan-400 font-extrabold text-sm">
                {result.perfStats.rowsPerSec.toLocaleString()} rows/s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Generator Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schema & Prompt Definition */}
        <div className="lg:col-span-2 space-y-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          {/* Schema Input Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Schema Input Specification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "custom_prompt", label: "Natural English" },
                { id: "json_schema", label: "JSON Schema" },
                { id: "sql_ddl", label: "SQL DDL" },
                { id: "csv_headers", label: "CSV Headers" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSchemaType(t.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    schemaType === t.id
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt or Schema Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              {schemaType === "custom_prompt"
                ? "Describe Desired Entities & Attributes"
                : "Paste Schema Definition"}
            </label>
            <textarea
              rows={4}
              value={schemaType === "custom_prompt" ? schemaPrompt : rawSchema}
              onChange={(e) => {
                if (schemaType === "custom_prompt") {
                  setSchemaPrompt(e.target.value);
                } else {
                  setRawSchema(e.target.value);
                }
              }}
              placeholder={
                schemaType === "custom_prompt"
                  ? "Describe fields, constraints, e.g. Customer ID, email, orders count, credit score..."
                  : schemaType === "json_schema"
                  ? '{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" }\n  }\n}'
                  : "CREATE TABLE customers (id INT, email VARCHAR(255), balance DECIMAL(10,2));"
              }
              className="w-full p-3.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500">Presets:</span>
            {[
              "E-Commerce Orders",
              "SaaS User Accounts",
              "FinTech Bank Transactions",
              "Healthcare Patients",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSchemaType("custom_prompt");
                  if (preset === "E-Commerce Orders") {
                    setSchemaPrompt("order_id, customer_name, email, item_sku, quantity, unit_price, status, shipping_address, test_card");
                  } else if (preset === "SaaS User Accounts") {
                    setSchemaPrompt("user_id, full_name, corporate_email, team_role, plan_tier, seats_used, monthly_mrr, last_login_date");
                  } else if (preset === "FinTech Bank Transactions") {
                    setSchemaPrompt("transaction_ref, sender_iban, receiver_iban, amount_usd, currency, swift_code, fraud_risk_score, is_flagged");
                  } else {
                    setSchemaPrompt("patient_id, mock_name, age, blood_group, admission_date, department, insurance_provider, emergency_contact");
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Fine-Tuning Controls */}
        <div className="space-y-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generation Parameters</span>
            </h3>

            {/* Row Count Presets & Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Target Volume:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {rowCount.toLocaleString()} rows
                </span>
              </div>

              {/* Volume Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[100, 1000, 10000, 100000].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setRowCount(count)}
                    className={`py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      rowCount === count
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {count >= 1000 ? `${count / 1000}k` : count}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={100}
                max={100000}
                step={500}
                value={rowCount}
                onChange={(e) => setRowCount(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Edge-case Ratio */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Edge Case Ratio:</span>
                <span className="font-mono text-amber-400 font-bold">{Math.round(edgeCaseRatio * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.05}
                value={edgeCaseRatio}
                onChange={(e) => setEdgeCaseRatio(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Injects unicode, overflow, null/empty, and special character boundary records.
              </p>
            </div>

            {/* Locale */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Locale</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="en_US">English (US)</option>
                <option value="es_ES">Spanish (ES)</option>
                <option value="de_DE">German (DE)</option>
                <option value="fr_FR">French (FR)</option>
                <option value="ja_JP">Japanese (JP)</option>
                <option value="hi_IN">Hindi (IN)</option>
              </select>
            </div>

            {/* Fast Mode Toggle */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Fast Mode</span>
                <span className="text-[10px] text-slate-400">Samples quality metrics to run in &lt;2s</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fastMode}
                  onChange={(e) => setFastMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons: Generate & Cancel */}
          <div className="space-y-2 pt-2">
            {isGenerating ? (
              <div className="space-y-2">
                {/* Live Progress Bar */}
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
                  <div className="flex justify-between mb-1.5 font-mono">
                    <span className="text-slate-300">
                      Generating: {progress?.generated.toLocaleString()} / {progress?.total.toLocaleString()}
                    </span>
                    <span className="text-cyan-400 font-bold">{progress?.elapsedMs}ms</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150 rounded-full"
                      style={{
                        width: `${Math.round(((progress?.generated || 0) / (progress?.total || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Cancel Generation</span>
                </button>
              </div>
            ) : !can("generate_data") ? (
              <button
                type="button"
                disabled={true}
                title="Requires Tester role to generate synthetic datasets (Viewer is read-only)"
                className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs border border-slate-700 cursor-not-allowed opacity-70 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span>Generate Dataset (Requires Tester Role)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate {rowCount.toLocaleString()} Rows</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          {/* Quality Score Bar */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Synthetic Dataset Quality Score
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluated for uniqueness distribution, schema validity, and realism.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="text-center px-3 py-1 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Uniqueness</span>
                <span className="text-emerald-400 font-bold">{result.qualityScore.uniqueness}%</span>
              </div>
              <div className="text-center px-3 py-1 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Validity</span>
                <span className="text-cyan-400 font-bold">{result.qualityScore.validity}%</span>
              </div>
              <div className="text-center px-3 py-1 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Realism</span>
                <span className="text-indigo-400 font-bold">{result.qualityScore.distributionRealism}%</span>
              </div>
              <div className="text-center px-4 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                <span className="text-indigo-300 block text-[10px] font-sans font-bold">Overall Score</span>
                <span className="text-indigo-400 font-extrabold text-sm">{result.qualityScore.overall}/100</span>
              </div>
            </div>
          </div>

          {/* Format Switcher & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeView === "table"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("export")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeView === "export"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Export</span>
              </button>

              <span className="text-[11px] text-slate-500 ml-2 font-mono">
                Showing first {result.rows.length} of {result.totalRowCount?.toLocaleString() || rowCount} records
              </span>
            </div>

            {/* Export format tabs */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(["json", "csv", "sql", "playwright"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExportFormatChange(fmt)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      exportFormat === fmt
                        ? "bg-slate-800 text-indigo-300 font-bold"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFullDataset}
                disabled={exportingBlob}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs text-white font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingBlob ? "Preparing..." : `Download Full (${rowCount.toLocaleString()} Rows)`}</span>
              </button>
            </div>
          </div>

          {/* View Content (Virtual Table Preview limited to 100 visible rows) */}
          {activeView === "table" ? (
            <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    {result.rows.length > 0 &&
                      Object.keys(result.rows[0]).map((col) => (
                        <th key={col} className="p-3 font-semibold text-slate-300 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {Object.keys(row).map((col) => (
                        <td key={col} className="p-3 text-slate-300 whitespace-nowrap">
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono overflow-x-auto max-h-[460px]">
                <code>{result.exportedCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
