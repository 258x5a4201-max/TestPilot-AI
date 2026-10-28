import React, { useState } from "react";
import {
  Globe,
  ShieldCheck,
  Network,
  BrainCircuit,
  Database,
  Activity,
  Check,
} from "lucide-react";
import type {
  TargetConfig,
  DiscoveredApp,
  TestStrategyItem,
  SyntheticDataset,
  TestCase,
  TestRunReport,
} from "../../types/index.ts";
import { Step1SubmitTarget } from "./Step1SubmitTarget.tsx";
import { Step2OwnershipVerification } from "./Step2OwnershipVerification.tsx";
import { Step3DiscoveryAppMap } from "./Step3DiscoveryAppMap.tsx";
import { Step4StrategySelection } from "./Step4StrategySelection.tsx";
import { Step5SyntheticDataTestCases } from "./Step5SyntheticDataTestCases.tsx";
import { Step6ExecutionReport } from "./Step6ExecutionReport.tsx";

interface WizardContainerProps {
  config: TargetConfig;
  updateConfig: (patch: Partial<TargetConfig>) => void;
  app: DiscoveredApp | null;
  onCrawl: () => Promise<void>;
  isCrawling: boolean;
  strategies: TestStrategyItem[];
  onToggleStrategy: (id: string) => void;
  onSelectAllStrategies: (select: boolean) => void;
  syntheticDatasets: SyntheticDataset[];
  testCases: TestCase[];
  report: TestRunReport | null;
  isRunningTest: boolean;
  currentTestName?: string;
  progressPercent: number;
  liveLogs: string[];
  onStartExecution: () => void;
  onKillSwitch: () => void;
  onRestart: () => void;
  onLoadSample: () => void;
  onViewReportsDashboard: () => void;
}

export const WizardContainer: React.FC<WizardContainerProps> = (props) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    { number: 1, label: "Submit Target", icon: Globe },
    { number: 2, label: "Verify Ownership", icon: ShieldCheck },
    { number: 3, label: "AI Discovery", icon: Network },
    { number: 4, label: "Test Strategy", icon: BrainCircuit },
    { number: 5, label: "Synthetic Data", icon: Database },
    { number: 6, label: "Execution & Report", icon: Activity },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-6">
      {/* 6-Step Breadcrumb Stepper */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            const Icon = s.icon;

            return (
              <div
                key={s.number}
                onClick={() => {
                  if (s.number < currentStep || isCompleted) {
                    setCurrentStep(s.number);
                  }
                }}
                className={`relative z-10 flex flex-col items-center group ${
                  s.number < currentStep ? "cursor-pointer" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/40"
                      : isCurrent
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-500/20"
                      : "bg-slate-900 border border-slate-800 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`mt-2 text-[11px] font-medium hidden sm:block ${
                    isCurrent
                      ? "text-indigo-400 font-bold"
                      : isCompleted
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Render */}
      <div>
        {currentStep === 1 && (
          <Step1SubmitTarget
            config={props.config}
            updateConfig={props.updateConfig}
            onNext={() => setCurrentStep(2)}
            onLoadSample={props.onLoadSample}
          />
        )}

        {currentStep === 2 && (
          <Step2OwnershipVerification
            config={props.config}
            updateConfig={props.updateConfig}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3DiscoveryAppMap
            targetUrl={props.config.url}
            app={props.app}
            onCrawl={props.onCrawl}
            isCrawling={props.isCrawling}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4StrategySelection
            strategies={props.strategies}
            targetConfig={props.config}
            onToggleStrategy={props.onToggleStrategy}
            onSelectAll={props.onSelectAllStrategies}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5SyntheticDataTestCases
            syntheticDatasets={props.syntheticDatasets}
            testCases={props.testCases}
            onNext={() => {
              setCurrentStep(6);
              if (!props.report && !props.isRunningTest) {
                props.onStartExecution();
              }
            }}
            onBack={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step6ExecutionReport
            report={props.report}
            isRunning={props.isRunningTest}
            currentTestName={props.currentTestName}
            progressPercent={props.progressPercent}
            liveLogs={props.liveLogs}
            onStartExecution={props.onStartExecution}
            onKillSwitch={props.onKillSwitch}
            onRestart={props.onRestart}
            onViewReportsDashboard={props.onViewReportsDashboard}
          />
        )}
      </div>
    </div>
  );
};
