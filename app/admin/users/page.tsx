"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  githubUsername?: string;
  role: "admin" | "user";
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admin" | "user" | "suspended">("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      
      if (res.status === 401 || res.status === 403) {
        router.push("/?error=unauthorized");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, role: "admin" | "user") {
    if (!confirm(`Change user role to ${role}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        alert(`✅ User role updated to ${role}`);
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || "Failed to update role"}`);
      }
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("❌ Failed to update user role");
    }
  }

  async function suspendUser(userId: string) {
    if (!confirm("Suspend this user? They won't be able to access the app.")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ User suspended successfully");
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || "Failed to suspend user"}`);
      }
    } catch (err) {
      console.error("Failed to suspend user:", err);
      alert("❌ Failed to suspend user");
    }
  }

  async function reactivateUser(userId: string) {
    if (!confirm("Reactivate this user?")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (res.ok) {
        alert("✅ User reactivated successfully");
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || "Failed to reactivate user"}`);
      }
    } catch (err) {
      console.error("Failed to reactivate user:", err);
      alert("❌ Failed to reactivate user");
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    if (filter === "suspended") return user.status === "suspended";
    return user.role === filter;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👥 User Management</h1>
          <p className="mt-1 text-gray-600">Manage user roles and access</p>
        </div>
        <a
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Admin
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-sm text-gray-600">Users</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          <div className="text-sm text-gray-600">Suspended</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {(["all", "admin", "user", "suspended"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-b-2 transition-colors capitalize ${
              filter === f
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No users found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{user.email}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role}
                      </span>
                      {user.status === "suspended" && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Suspended
                        </span>
                      )}
                    </div>
                    {user.githubUsername && (
                      <p className="text-gray-600 text-sm mt-1">
                        GitHub: @{user.githubUsername}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    {user.lastLoginAt && (
                      <p className="text-xs text-gray-400">
                        Last login: {new Date(user.lastLoginAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {user.status === "active" ? (
                      <>
                        {user.role === "user" ? (
                          <button
                            onClick={() => updateUserRole(user.id, "admin")}
                            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserRole(user.id, "user")}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          >
                            Make User
                          </button>
                        )}
                        <button
                          onClick={() => suspendUser(user.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Suspend
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => reactivateUser(user.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchUsers}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

