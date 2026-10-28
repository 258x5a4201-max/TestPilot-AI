import React, { useState, useEffect } from "react";
import {
  Network,
  Cpu,
  Layers,
  FileText,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Code2,
} from "lucide-react";
import type { DiscoveredApp, AppMapNode } from "../../types/index.ts";

interface Step3Props {
  targetUrl: string;
  app: DiscoveredApp | null;
  onCrawl: () => Promise<void>;
  isCrawling: boolean;
  onNext: () => void;
  onBack: () => void;
}

export const Step3DiscoveryAppMap: React.FC<Step3Props> = ({
  targetUrl,
  app,
  onCrawl,
  isCrawling,
  onNext,
  onBack,
}) => {
  const [selectedNode, setSelectedNode] = useState<AppMapNode | null>(null);
  const [nodeFilter, setNodeFilter] = useState<string>("all");

  useEffect(() => {
    if (!app && !isCrawling) {
      onCrawl();
    }
  }, [app, isCrawling, onCrawl]);

  const filteredNodes = (app?.appMap.nodes || []).filter((node) => {
    if (nodeFilter === "all") return true;
    return node.type === nodeFilter;
  });

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <span>Step 3 of 6</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Network className="w-6 h-6 text-indigo-400" />
              <span>AI Discovery & App Map</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Autonomous crawler mapped architecture, routes, forms, APIs, and security headers.
            </p>
          </div>

          <button
            onClick={() => onCrawl()}
            disabled={isCrawling}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCrawling ? "animate-spin text-indigo-400" : ""}`} />
            <span>{isCrawling ? "Crawling App..." : "Re-crawl App"}</span>
          </button>
        </div>

        {/* Loading Spinner during crawl */}
        {isCrawling ? (
          <div className="py-20 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-pulse" />
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Autonomous Crawler in Progress...
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Scanning DOM elements, inspecting forms & input fields, discovering XHR/Fetch endpoints, and detecting tech stack.
            </p>
          </div>
        ) : app ? (
          <div className="space-y-6">
            {/* Tech Stack Bar */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Detected Tech Stack & Environment</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Target: <span className="font-mono text-slate-300">{targetUrl}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {app.techStack.frontend?.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
                  >
                    🎨 {tech}
                  </span>
                ))}
                {app.techStack.backend?.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium"
                  >
                    ⚙️ {tech}
                  </span>
                ))}
                {app.techStack.server?.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium"
                  >
                    🌐 {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-2xl font-extrabold text-white">{app.pages.length}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Discovered Pages</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-2xl font-extrabold text-indigo-400">{app.forms.length}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Interactive Forms</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-2xl font-extrabold text-sky-400">{app.apiEndpoints.length}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">API Endpoints</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-2xl font-extrabold text-emerald-400">
                  {Object.keys(app.techStack.securityHeaders || {}).length}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Security Headers</div>
              </div>
            </div>

            {/* Interactive App Map Canvas */}
            <div className="border border-slate-800 rounded-xl bg-slate-950/90 overflow-hidden">
              <div className="p-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Interactive App Map</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({app.appMap.nodes.length} nodes, {app.appMap.edges.length} edges)
                  </span>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1">
                  {["all", "page", "form", "input", "api", "auth"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNodeFilter(type)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                        nodeFilter === type
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Nodes Grid */}
              <div className="p-6 min-h-[300px] max-h-[460px] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const badgeColor =
                      node.riskLevel === "critical"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        : node.riskLevel === "high"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : node.riskLevel === "medium"
                        ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                        : "border-slate-700 bg-slate-800/40 text-slate-300";

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 shadow-md"
                            : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {node.type}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                            {node.riskLevel || "low"} risk
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 truncate" title={node.label}>
                          {node.label}
                        </h4>
                        {node.url && (
                          <div className="text-[10px] text-slate-500 truncate font-mono mt-1">
                            {node.url}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspector Drawer for clicked node */}
              {selectedNode && (
                <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">{selectedNode.label}</span>
                    <span className="text-slate-400 ml-2 font-mono">[{selectedNode.type}]</span>
                    {selectedNode.details && (
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Details: {JSON.stringify(selectedNode.details)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-slate-500 hover:text-slate-300 underline text-xs cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ownership</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!app || isCrawling}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>Proceed to AI Strategy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
