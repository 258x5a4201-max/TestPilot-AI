import React from "react";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Globe,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ComparisonPageProps {
  onStartWizard: () => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ onStartWizard }) => {
  const comparisonMatrix = [
    {
      capability: "Input Requirement",
      testpilot: "Public URL only (No repo or code access required)",
      qodo: "Source Code repo & IDE extension",
      playwright: "Manual TypeScript/Python code files",
      postman: "Manual API requests / collections",
      k6: "Manual JavaScript load scripts",
      zap: "Manual proxy / DAST config",
      applitools: "Manual visual SDK bindings",
    },
    {
      capability: "Autonomous Discovery & App Map",
      testpilot: true,
      qodo: false,
      playwright: false,
      postman: false,
      k6: false,
      zap: "Partial (Spider only)",
      applitools: false,
    },
    {
      capability: "AI Test Strategy Selection",
      testpilot: true,
      qodo: "Partial (Code unit test only)",
      playwright: false,
      postman: false,
      k6: false,
      zap: false,
      applitools: false,
    },
    {
      capability: "Synthetic Privacy-Safe Edge Data",
      testpilot: true,
      qodo: false,
      playwright: false,
      postman: "Mock servers only",
      k6: false,
      zap: false,
      applitools: false,
    },
    {
      capability: "Self-Healing Broken Selectors",
      testpilot: true,
      qodo: false,
      playwright: false,
      postman: false,
      k6: false,
      zap: false,
      applitools: "Visual only",
    },
    {
      capability: "Rate Limiting & 429 Burst Detection",
      testpilot: true,
      qodo: false,
      playwright: false,
      postman: false,
      k6: "Manual script",
      zap: false,
      applitools: false,
    },
    {
      capability: "WCAG 2.2 AA Axe-Core Accessibility",
      testpilot: true,
      qodo: false,
      playwright: "Manual plugin",
      postman: false,
      k6: false,
      zap: false,
      applitools: false,
    },
    {
      capability: "AI Failure Root Cause & Code Fixes",
      testpilot: true,
      qodo: "Unit test level only",
      playwright: false,
      postman: false,
      k6: false,
      zap: false,
      applitools: false,
    },
    {
      capability: "Unified Single-Dashboard Workflow",
      testpilot: true,
      qodo: false,
      playwright: false,
      postman: "API only",
      k6: "Load only",
      zap: "Security only",
      applitools: "Visual only",
    },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Competitive Architecture Matrix</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          TestPilot AI vs Legacy Testing Silos
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Why juggle 6 disconnected tools and write thousands of lines of fragile scripts?
          TestPilot AI unites end-to-end, API, performance, security, and accessibility under a single autonomous engine.
        </p>
      </div>

      {/* Feature Comparison Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
              <tr>
                <th className="p-4 font-bold uppercase tracking-wider text-slate-400 min-w-[200px]">
                  Capability / Feature
                </th>
                <th className="p-4 font-extrabold text-indigo-400 bg-indigo-950/30 border-x border-indigo-500/20 min-w-[180px]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>TestPilot AI</span>
                  </div>
                </th>
                <th className="p-4 font-semibold text-slate-400 min-w-[140px]">Qodo</th>
                <th className="p-4 font-semibold text-slate-400 min-w-[140px]">Playwright</th>
                <th className="p-4 font-semibold text-slate-400 min-w-[140px]">Postman</th>
                <th className="p-4 font-semibold text-slate-400 min-w-[140px]">k6 / JMeter</th>
                <th className="p-4 font-semibold text-slate-400 min-w-[140px]">OWASP ZAP</th>
                <th className="p-4 font-semibold text-slate-400 min-w-[140px]">Applitools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-semibold text-slate-200">
                    {row.capability}
                  </td>

                  {/* TestPilot Column (Highlighted) */}
                  <td className="p-4 bg-indigo-950/20 border-x border-indigo-500/20 font-bold text-white">
                    {row.testpilot === true ? (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Built-in Autonomous
                      </span>
                    ) : (
                      <span className="text-indigo-300 font-semibold">{row.testpilot}</span>
                    )}
                  </td>

                  {/* Qodo */}
                  <td className="p-4 text-slate-400">
                    {row.qodo === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : row.qodo === false ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span>{row.qodo}</span>
                    )}
                  </td>

                  {/* Playwright */}
                  <td className="p-4 text-slate-400">
                    {row.playwright === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : row.playwright === false ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span>{row.playwright}</span>
                    )}
                  </td>

                  {/* Postman */}
                  <td className="p-4 text-slate-400">
                    {row.postman === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : row.postman === false ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span>{row.postman}</span>
                    )}
                  </td>

                  {/* k6 */}
                  <td className="p-4 text-slate-400">
                    {row.k6 === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : row.k6 === false ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span>{row.k6}</span>
                    )}
                  </td>

                  {/* ZAP */}
                  <td className="p-4 text-slate-400">
                    {row.zap === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : row.zap === false ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span>{row.zap}</span>
                    )}
                  </td>

                  {/* Applitools */}
                  <td className="p-4 text-slate-400">
                    {row.applitools === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : row.applitools === false ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <span>{row.applitools}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Positioning Summary Callout */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-slate-900 to-indigo-900/30 border border-indigo-500/30 text-center space-y-4 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-white">
          The Only Unified, Zero-Code Autonomous QA Platform
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          While legacy tools force engineering teams to maintain separate testing frameworks, test data fixtures,
          and brittle XPath selectors, TestPilot AI delivers continuous regression protection from a simple URL.
        </p>
        <button
          onClick={onStartWizard}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <span>Launch Free Autonomous Audit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
