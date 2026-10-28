import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Activity,
  Database,
  Layers,
  BarChart3,
  Scale,
  Sparkles,
  StopCircle,
  User,
  ChevronDown,
  Users,
  Eye,
  Lock,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import type { UserRole } from "../types/index.ts";
import { useAuth } from "../context/AuthContext.tsx";

interface NavbarProps {
  activeTab: "wizard" | "synthetic" | "reports" | "comparison" | "users";
  setActiveTab: (tab: "wizard" | "synthetic" | "reports" | "comparison" | "users") => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  isTestRunning: boolean;
  onKillSwitch: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDemoMode,
  onToggleDemoMode,
  isTestRunning,
  onKillSwitch,
  userRole,
  setUserRole,
}) => {
  const { can, currentUser } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Tester":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "Viewer":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    }
  };

  const navItems = [
    {
      id: "wizard" as const,
      label: "Autonomous Wizard",
      icon: Layers,
    },
    {
      id: "synthetic" as const,
      label: "Synthetic Data Lab",
      icon: Database,
    },
    {
      id: "reports" as const,
      label: "Reports & Dashboard",
      icon: BarChart3,
    },
    {
      id: "comparison" as const,
      label: "vs Others",
      icon: Scale,
    },
    {
      id: "users" as const,
      label: "Users & Roles",
      icon: Users,
      badge: can("manage_users") ? "Admin" : undefined,
      locked: !can("manage_users"),
    },
  ];

  const handleSelectTab = (tab: "wizard" | "synthetic" | "reports" | "comparison" | "users") => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/90 border-b border-slate-800/80">
        {/* Single-row Flex Container with matching max-width and padding */}
        <div className="w-full max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-3 flex-nowrap">
          {/* Left Group: Logo + Desktop Nav Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 flex-nowrap shrink-0">
            {/* Brand / Logo */}
            <div
              className="h-[44px] flex items-center gap-3 cursor-pointer group shrink-0"
              onClick={() => handleSelectTab("wizard")}
            >
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
              <div className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    TestPilot<span className="text-indigo-400">.AI</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                    Autonomous QA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-none whitespace-nowrap hidden xl:block">
                  Autonomous App Tester & Synthetic Data
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Screens >= 1024px) */}
            <nav className="hidden lg:flex items-center gap-1.5 flex-nowrap shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`h-[44px] px-3.5 flex items-center gap-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                    title={
                      item.id === "users" && !can("manage_users")
                        ? "Admin Only: Click to view route guard page"
                        : undefined
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                        {item.badge}
                      </span>
                    ) : item.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Group: Target Toggle + Role Badge + Switch Role + Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-nowrap shrink-0">
            {/* Kill Switch (Visible when tests are actively running) */}
            {isTestRunning ? (
              <button
                onClick={onKillSwitch}
                disabled={!can("stop_runs")}
                title={
                  can("stop_runs")
                    ? "Instantly stop the active test run"
                    : "Requires Tester role to abort test runs"
                }
                className={`h-[44px] px-3.5 flex items-center gap-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-600/30 whitespace-nowrap shrink-0 transition-all ${
                  can("stop_runs")
                    ? "bg-rose-600 hover:bg-rose-500 animate-pulse cursor-pointer"
                    : "bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed"
                }`}
              >
                <StopCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Abort Run</span>
                <span className="sm:hidden">Abort</span>
              </button>
            ) : null}

            {/* Target Mode Toggle ("Demo Target: Custom" shortened to "Target: Custom" to prevent wrapping) */}
            <button
              onClick={onToggleDemoMode}
              className={`h-[44px] px-3.5 flex items-center gap-2 rounded-xl text-xs font-semibold border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isDemoMode
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Toggle between demo target (ShopSphere) and custom URL"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Target:</span>
              <span className={isDemoMode ? "text-cyan-300 font-bold" : "text-slate-300 font-bold"}>
                {isDemoMode ? "ShopSphere" : "Custom"}
              </span>
            </button>

            {/* Role Badge - Always visible, uniform 44px height */}
            <div
              className={`h-[44px] px-3.5 flex items-center gap-2 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 ${getRoleBadgeColor(
                userRole
              )}`}
              title={`Logged in as ${currentUser.name} (${userRole})`}
            >
              {userRole === "Admin" && <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
              {userRole === "Tester" && <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              {userRole === "Viewer" && <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span>{userRole}</span>
            </div>

            {/* Switch Role Dropdown Trigger - Uniform 44px height */}
            <div className="relative shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="h-[44px] px-3.5 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                title="Judge Demo: Instant Role Switcher"
              >
                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline font-medium">Switch Role</span>
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              </button>

              {/* Role Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 mb-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Judge Demo: Role Switcher
                  </div>
                  {(
                    [
                      {
                        role: "Admin",
                        desc: "Full access, intrusive tests, role management",
                        icon: Shield,
                      },
                      {
                        role: "Tester",
                        desc: "Execute runs, generate synthetic data, export",
                        icon: Activity,
                      },
                      {
                        role: "Viewer",
                        desc: "Read-only reports, audit logs, trends",
                        icon: Eye,
                      },
                    ] as const
                  ).map(({ role, desc, icon: Icon }) => (
                    <button
                      key={role}
                      onClick={() => {
                        setUserRole(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                        userRole === role
                          ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                          : "text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold flex items-center justify-between">
                          <span>{role}</span>
                          {userRole === role && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hamburger Button on Screens < 1024px */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden h-[44px] w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 shrink-0 cursor-pointer transition-colors"
              title="Toggle navigation menu"
              aria-label="Toggle navigation"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile / Tablet Navigation: Horizontal Swipeable Bar */}
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 overflow-x-auto no-scrollbar">
          <div className="w-full max-w-[1280px] mx-auto px-6 py-2 flex items-center gap-2 flex-nowrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`h-[38px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="text-[9px] uppercase font-bold px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                      {item.badge}
                    </span>
                  ) : item.locked ? (
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Mobile Drawer when Hamburger is clicked */}
        {isMobileNavOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-6 py-4 space-y-1.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
              Navigation Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full h-[44px] px-3.5 flex items-center justify-between rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                      {item.badge}
                    </span>
                  ) : item.locked ? (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Admin Only</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Prominent Read-Only Mode Banner for Viewer Role with matching 1280px max-width */}
      {userRole === "Viewer" && (
        <div className="bg-amber-950/60 border-b border-amber-500/30 text-amber-200 py-2.5 text-xs shadow-md animate-in fade-in duration-200">
          <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-amber-100">Read-Only Mode:</strong> You are browsing as{" "}
                <span className="font-semibold text-white">{currentUser.name}</span> (Viewer). All test executions, intrusive security toggles, and data generation mutations are restricted.
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 shrink-0">
              <span>Judge test:</span>
              <button
                onClick={() => setUserRole("Tester")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-white font-medium border border-amber-500/40 cursor-pointer transition-colors"
              >
                Switch to Tester
              </button>
              <button
                onClick={() => setUserRole("Admin")}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white font-medium border border-purple-500/40 cursor-pointer transition-colors"
              >
                Switch to Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
