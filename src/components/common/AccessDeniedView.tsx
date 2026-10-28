import React from "react";
import { ShieldAlert, ArrowLeft, KeyRound, UserCheck, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import type { UserRole } from "../../types/index.ts";

interface AccessDeniedViewProps {
  requiredRole?: UserRole;
  requiredPermission?: string;
  onGoBack?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRole = "Admin",
  requiredPermission = "manage_users",
  onGoBack,
}) => {
  const { currentRole, setRole } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Access Denied • 403 Forbidden</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Insufficient Role Permissions
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          You are currently signed in as <strong className="text-indigo-400 font-mono">{currentRole}</strong>.
          This section requires <strong className="text-rose-400 font-mono">{requiredRole}</strong> role with the{" "}
          <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded text-xs">{requiredPermission}</code> permission.
        </p>

        {/* Demo Switcher Quick Action for Judges */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto mb-6 text-xs text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Judge / Evaluator Demo Switcher:</span>
          </span>
          <p className="text-slate-400 text-[11px] mb-3">
            Switch your role to <strong className="text-white">{requiredRole}</strong> right now to test and evaluate this feature:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setRole(requiredRole)}
              className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Switch to {requiredRole}</span>
            </button>
            <button
              onClick={() => setRole("Tester")}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Tester
            </button>
            <button
              onClick={() => setRole("Viewer")}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Viewer
            </button>
          </div>
        </div>

        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Allowed Section</span>
          </button>
        )}
      </div>
    </div>
  );
};
