import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { UserRole, Permission, AppUser } from "../types/index.ts";
import { ROLE_PERMISSIONS } from "../types/index.ts";

interface AuthContextType {
  currentRole: UserRole;
  currentUser: AppUser;
  setRole: (role: UserRole) => void;
  can: (permission: Permission) => boolean;
  users: AppUser[];
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  allPermissions: Permission[];
}

const DEFAULT_USERS: AppUser[] = [
  {
    id: "usr-1",
    name: "Teja Chirumella",
    email: "chirumellateja@gmail.com",
    role: "Admin",
    department: "Core Platform & Infrastructure",
    lastActive: "Just now",
  },
  {
    id: "usr-2",
    name: "Alex Rivera",
    email: "alex.rivera@testpilot.ai",
    role: "Tester",
    department: "Autonomous QA Engineering",
    lastActive: "5 mins ago",
  },
  {
    id: "usr-3",
    name: "Sarah Connor",
    email: "sarah.connor@testpilot.ai",
    role: "Tester",
    department: "Frontend Automation & Viewports",
    lastActive: "22 mins ago",
  },
  {
    id: "usr-4",
    name: "Rachel Green",
    email: "rachel.pm@testpilot.ai",
    role: "Viewer",
    department: "Product Management & Audits",
    lastActive: "1 hour ago",
  },
  {
    id: "usr-5",
    name: "David Kim",
    email: "david.auditor@testpilot.ai",
    role: "Viewer",
    department: "External Security & Compliance",
    lastActive: "3 hours ago",
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem("testpilot_current_role");
      if (saved && ["Admin", "Tester", "Viewer"].includes(saved)) {
        return saved as UserRole;
      }
    } catch {}
    return "Admin";
  });

  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);

  // Sync role to localStorage and update current user representation
  const setRole = useCallback((newRole: UserRole) => {
    setCurrentRoleState(newRole);
    try {
      localStorage.setItem("testpilot_current_role", newRole);
    } catch {}
  }, []);

  // Compute simulated logged-in user profile matching active role
  const currentUser = useMemo(() => {
    const userMatch = users.find((u) => u.role === currentRole);
    if (userMatch) return userMatch;
    return {
      id: `usr-${currentRole.toLowerCase()}`,
      name: `${currentRole} User`,
      email: `${currentRole.toLowerCase()}@testpilot.ai`,
      role: currentRole,
      department: "TestPilot QA Team",
      lastActive: "Active Now",
    };
  }, [currentRole, users]);

  // Hook function: can(permission) -> boolean
  const can = useCallback(
    (permission: Permission): boolean => {
      const allowed = ROLE_PERMISSIONS[currentRole] || [];
      return allowed.includes(permission);
    },
    [currentRole]
  );

  // Authenticated fetch wrapper passing role headers to enforce backend RBAC
  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers || {});
      headers.set("x-user-role", currentRole);
      headers.set("x-user-email", currentUser.email);

      return fetch(input, {
        ...init,
        headers,
      });
    },
    [currentRole, currentUser.email]
  );

  // Fetch users from server if Admin
  const refreshUsers = useCallback(async () => {
    if (!can("manage_users")) return;
    try {
      const resp = await authFetch("/api/users");
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      }
    } catch {
      // Fallback to local default users
    }
  }, [can, authFetch]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Update user role handler
  const updateUserRole = useCallback(
    async (userId: string, newRole: UserRole): Promise<boolean> => {
      if (!can("change_roles")) {
        alert("Permission Denied: Only Admin can change user roles.");
        return false;
      }

      try {
        const resp = await authFetch(`/api/users/${userId}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });

        if (resp.ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole, lastActive: "Just now" } : u))
          );
          return true;
        } else {
          const err = await resp.json();
          alert(err.error || "Failed to update role");
          return false;
        }
      } catch (e: any) {
        // Optimistic local fallback
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole, lastActive: "Just now" } : u))
        );
        return true;
      }
    },
    [can, authFetch]
  );

  const value = useMemo(
    () => ({
      currentRole,
      currentUser,
      setRole,
      can,
      users,
      updateUserRole,
      authFetch,
      allPermissions: ROLE_PERMISSIONS[currentRole] || [],
    }),
    [currentRole, currentUser, setRole, can, users, updateUserRole, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
