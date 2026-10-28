import React from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe,
} from "lucide-react";

interface LandingHeroProps {
  onStartWizard: () => void;
  onLoadDemo: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartWizard, onLoadDemo }) => {
  return (
    <div className="relative overflow-hidden py-10 lg:py-14 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -top-24 right-1/4 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="w-full max-w-[1280px] mx-auto px-6 relative z-10">
        {/* Badge & Headline */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Software Testing & Synthetic Data Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight mb-5">
            Replace Manual QA with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Autonomous AI Testing
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Paste any web application URL. TestPilot AI crawls the interface, selects suitable test types
            with Gemini, generates privacy-safe synthetic edge payloads, and executes self-healing tests with
            root-cause fix suggestions.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartWizard}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Launch Autonomous Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all hover:border-slate-600 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Explore Pre-Baked Demo</span>
            </button>
          </div>
        </div>

        {/* Problem -> Solution -> Impact Architecture Card (Section 11) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto mt-6">
          {/* 1. Problem */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-rose-500/20 hover:border-rose-500/40 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              The Problem
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Manual QA Bottlenecks & PII Risks
            </h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>Manual testing takes days; test suites break whenever DOM CSS classes change.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>Test datasets often contain leaked customer PII or lack boundary edge cases.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>Teams juggle 5 disconnected tools (Postman, k6, ZAP, Axe, Playwright).</span>
              </li>
            </ul>
          </div>

          {/* 2. Solution */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              The AI Solution
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Unified Autonomous Intelligence
            </h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>Single URL input → Gemini creates an interactive App Map of pages, forms, and APIs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>AI selects 14 test types with risk scores and generates 100% PII-free synthetic data.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>Self-healing selectors recover from DOM mutations automatically in real-time.</span>
              </li>
            </ul>
          </div>

          {/* 3. Impact */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              The Impact
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              85% Cycle Reduction & Enterprise Grade
            </h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Shrink regression testing cycles from 48 hours to under 3 minutes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Zero manual test script writing needed; runnable Playwright code auto-generated.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>Continuous CI/CD pipeline integration via GitHub Actions and webhooks.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Highlight Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-800/40 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SSRF Guardrails & Ownership Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Burst Rate-Limiting & Throttling Threshold</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>WCAG 2.2 AA Axe-Core Automated Audit</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>100% PII-Free Synthetic Data Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
