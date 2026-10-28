import React, { useState } from "react";
import {
  Globe,
  KeyRound,
  FileCode2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Gauge,
  Sliders,
} from "lucide-react";
import type { TargetConfig, TestDepth } from "../../types/index.ts";

interface Step1Props {
  config: TargetConfig;
  updateConfig: (patch: Partial<TargetConfig>) => void;
  onNext: () => void;
  onLoadSample: () => void;
}

export const Step1SubmitTarget: React.FC<Step1Props> = ({
  config,
  updateConfig,
  onNext,
  onLoadSample,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (val: string) => {
    setError(null);
    updateConfig({ url: val });
  };

  const handleProceed = () => {
    if (!config.url.trim()) {
      setError("Target URL is required to begin autonomous testing.");
      return;
    }

    // Client-side quick SSRF inspection
    const lower = config.url.toLowerCase();
    if (
      lower.includes("localhost") ||
      lower.includes("127.0.0.1") ||
      lower.includes("169.254.") ||
      lower.includes("192.168.") ||
      lower.includes("10.")
    ) {
      setError("Security Guardrail: Private, internal IP or loopback addresses are blocked to prevent SSRF vulnerabilities.");
      return;
    }

    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <span>Step 1 of 6</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Target Web Application
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Specify your target URL, test credentials, and exploration depth.
            </p>
          </div>

          <button
            onClick={onLoadSample}
            type="button"
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fill Sample Target</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProceed();
          }}
          className="space-y-6"
        >
          {/* Target URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Public Target URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={config.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://app.yourdomain.com or https://example.com"
                className="w-full pl-10 pr-24 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> SSRF Safe
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Only public HTTP/HTTPS URLs. Private internal IP addresses and cloud metadata endpoints are strictly blocked.
            </p>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Project / Workspace Name
            </label>
            <input
              type="text"
              value={config.projectName}
              onChange={(e) => updateConfig({ projectName: e.target.value })}
              placeholder="e.g. ShopSphere Storefront Release"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Test Depth Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Autonomous Test Depth
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "quick" as TestDepth,
                  title: "Quick Smoke",
                  duration: "~2 mins",
                  desc: "Smoke checks, responsive layouts, broken links, security headers.",
                },
                {
                  id: "standard" as TestDepth,
                  title: "Standard QA",
                  duration: "~6 mins",
                  desc: "All functional flows, WCAG 2.2 accessibility, form edge cases, API fuzzing.",
                },
                {
                  id: "deep" as TestDepth,
                  title: "Deep Autonomous",
                  duration: "~15 mins",
                  desc: "Full 14 test types including k6 load soak, rate limiting, and exploratory agent.",
                },
              ].map((d) => (
                <div
                  key={d.id}
                  onClick={() => updateConfig({ depth: d.id })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    config.depth === d.id
                      ? "bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-100">{d.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {d.duration}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Test Account Credentials */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Optional Test Credentials
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={config.authEnabled}
                  onChange={(e) => updateConfig({ authEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Enable authenticated testing</span>
              </label>
            </div>

            {config.authEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Test Username / Email</label>
                  <input
                    type="text"
                    value={config.credentials?.username || ""}
                    onChange={(e) =>
                      updateConfig({
                        credentials: { ...config.credentials, username: e.target.value },
                      })
                    }
                    placeholder="qa-auditor@testpilot.ai"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Test Password / Token</label>
                  <input
                    type="password"
                    value={config.credentials?.password || ""}
                    onChange={(e) =>
                      updateConfig({
                        credentials: { ...config.credentials, password: e.target.value },
                      })
                    }
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional OpenAPI / Swagger URL */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Optional OpenAPI / Swagger Schema URL</span>
            </label>
            <input
              type="text"
              value={config.openApiUrl || ""}
              onChange={(e) => updateConfig({ openApiUrl: e.target.value })}
              placeholder="https://app.yourdomain.com/api/v1/openapi.json"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Footer Submit Button */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Verify Ownership & Consent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
