import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import { AccessDeniedView } from "../common/AccessDeniedView.tsx";
import type { UserRole, Permission } from "../../types/index.ts";
import { ROLE_PERMISSIONS } from "../../types/index.ts";
import type { AuditLogEntry } from "../../../backend/storage.ts";

interface UsersRolesPageProps {
  onGoBack: () => void;
}

export const UsersRolesPage: React.FC<UsersRolesPageProps> = ({ onGoBack }) => {
  const { can, users, updateUserRole, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "matrix" | "audit">("users");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Route Guard: Admin only
  if (!can("manage_users")) {
    return (
      <AccessDeniedView
        requiredRole="Admin"
        requiredPermission="manage_users"
        onGoBack={onGoBack}
      />
    );
  }

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const resp = await authFetch("/api/audit-logs");
      if (resp.ok) {
        const data = await resp.json();
        setAuditLogs(data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    await updateUserRole(userId, newRole);
    setUpdatingUserId(null);
  };

  const allPermissionsList: { key: Permission; label: string; desc: string }[] = [
    { key: "manage_users", label: "Manage Users", desc: "List all users and view administrative details" },
    { key: "change_roles", label: "Change User Roles", desc: "Promote or demote members between Admin, Tester, and Viewer" },
    { key: "verify_domain", label: "Verify Domain Ownership", desc: "Execute DNS TXT / well-known verification checks" },
    { key: "run_intrusive_tests", label: "Run Intrusive Tests", desc: "Unlock load soak, burst rate limiting, and security fuzzing" },
    { key: "run_tests", label: "Run Standard Tests", desc: "Execute functional, smoke, and accessibility test suites" },
    { key: "stop_runs", label: "Kill Switch (Stop Runs)", desc: "Trigger emergency kill switch to abort active runs" },
    { key: "generate_data", label: "Generate Synthetic Data", desc: "Create privacy-safe mock datasets and edge payloads" },
    { key: "export_reports", label: "Export Reports & Fixtures", desc: "Download JSON, CSV, SQL fixtures, and PDF summaries" },
    { key: "view_reports", label: "View Reports & Metrics", desc: "Inspect test dashboards, charts, and pass/fail logs" },
    { key: "delete_projects", label: "Delete Projects", desc: "Permanently delete targets and historical project runs" },
    { key: "view_audit_log", label: "View Security Audit Log", desc: "Inspect chronological system logs and blocked access attempts" },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Team Members & Role Permissions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Admin console for managing organization users, configuring role assignments, and reviewing the authorization matrix.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Admin-Only Console</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full flex border-b border-slate-800 pb-2 gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: "users", label: `Team Members (${users.length})` },
          { id: "matrix", label: "Permissions Matrix" },
          { id: "audit", label: "Security & Role Audit Log" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Team Members List (Spans Full 1280px Container Width) */}
      {activeTab === "users" && (
        <div className="w-full border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="w-full p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Assigned Organization Members
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Changes take effect immediately across all sessions
            </span>
          </div>

          <div className="w-full divide-y divide-slate-800/60">
            {users.map((u) => {
              const isUpdating = updatingUserId === u.id;
              const roleBadgeColor =
                u.role === "Admin"
                  ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                  : u.role === "Tester"
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700";

              return (
                <div
                  key={u.id}
                  className="w-full p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px] shrink-0">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {u.name.slice(0, 2)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white">{u.name}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${roleBadgeColor}`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {u.department} • Last active: {u.lastActive}
                      </div>
                    </div>
                  </div>

                  {/* Change Role Selector */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <span className="text-xs text-slate-400">Change Role:</span>
                    <select
                      value={u.role}
                      disabled={isUpdating}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="Admin">Admin (Full Control)</option>
                      <option value="Tester">Tester (Run & Generate)</option>
                      <option value="Viewer">Viewer (Read-Only)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Permissions Matrix (Spans Full 1280px Container Width) */}
      {activeTab === "matrix" && (
        <div className="w-full border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="w-1/2 p-4 font-bold uppercase tracking-wider text-slate-400">
                    Action / Permission
                  </th>
                  <th className="w-1/6 p-4 font-bold text-purple-400 text-center bg-purple-950/20 border-x border-purple-500/20">
                    Admin
                  </th>
                  <th className="w-1/6 p-4 font-bold text-cyan-400 text-center bg-cyan-950/20 border-r border-cyan-500/20">
                    Tester
                  </th>
                  <th className="w-1/6 p-4 font-bold text-slate-400 text-center">
                    Viewer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allPermissionsList.map((p) => {
                  const adminHas = ROLE_PERMISSIONS.Admin.includes(p.key);
                  const testerHas = ROLE_PERMISSIONS.Tester.includes(p.key);
                  const viewerHas = ROLE_PERMISSIONS.Viewer.includes(p.key);

                  return (
                    <tr key={p.key} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{p.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{p.desc}</div>
                      </td>

                      {/* Admin */}
                      <td className="p-4 text-center bg-purple-950/10 border-x border-purple-500/20">
                        {adminHas ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>

                      {/* Tester */}
                      <td className="p-4 text-center bg-cyan-950/10 border-r border-cyan-500/20">
                        {testerHas ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>

                      {/* Viewer */}
                      <td className="p-4 text-center">
                        {viewerHas ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Role Audit Log (Spans Full 1280px Container Width) */}
      {activeTab === "audit" && (
        <div className="w-full border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl backdrop-blur-sm space-y-4 p-5 sm:p-6">
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Security Audit Log</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable audit trail of role changes, access authorizations, and blocked intrusion attempts.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              disabled={isLoadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="w-full space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No audit log entries recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => {
                const statusColor =
                  log.status === "success"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : log.status === "blocked"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                return (
                  <div
                    key={log.id}
                    className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                          {log.status}
                        </span>
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-slate-400">by {log.userEmail}</span>
                      </div>
                      <div className="text-slate-300 text-[11px] font-sans">
                        {log.details || `Target: ${log.targetUrl}`}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 shrink-0 font-sans">
                      {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
