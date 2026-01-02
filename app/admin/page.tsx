"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Modal from "@/components/Modal";

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  message?: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface WhitelistedUser {
  email: string;
  githubUsername?: string;
  addedAt: string;
  addedBy: string;
}

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "revoked">("pending");
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "danger";
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEmail) return;

    setLoading(true);
    const success = await fetchData();
    if (success) {
    setIsAuthenticated(true);
    }
    setLoading(false);
  }

  async function fetchData(): Promise<boolean> {
    try {
      const res = await fetch(`/api/access-request?adminEmail=${encodeURIComponent(adminEmail)}`);
      const data = await res.json();

      if (res.ok) {
        setRequests(data.requests || []);
        setWhitelist(data.whitelist || []);
        return true; // Success
      } else {
        // Show error and prevent login
        alert(data.error || "Failed to fetch data");
        setIsAuthenticated(false);
        return false; // Failed
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
      alert("Failed to fetch access requests");
      return false; // Failed
    }
  }

  async function handleUpdateStatus(requestId: string, status: "approved" | "rejected") {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    try {
      const res = await fetch(`/api/access-request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewedBy: adminEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Request ${status} successfully!${status === "approved" ? "\n\nNext: Send the user the installation link." : ""}`);
        await fetchData(); // Refresh the list
      } else {
        // Handle 404 specifically
        if (res.status === 404) {
          alert("❌ " + data.error + "\n\nRefreshing the page...");
          await fetchData();
        } else {
          alert("❌ " + (data.error || "Failed to update request"));
        }
      }
    } catch (err) {
      console.error("Failed to update:", err);
      alert("❌ Failed to update request. Please try again.");
    }
  }

  async function handleRevokeAccess(email: string) {
    if (!confirm(`⚠️ Revoke access for ${email}?\n\nThis will remove them from the whitelist and they won't be able to sign in.`)) return;

    try {
      const res = await fetch("/api/admin/revoke-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          revokedBy: adminEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Access revoked for ${email}`);
        await fetchData(); // Refresh the list
      } else {
        alert("❌ " + (data.error || "Failed to revoke access"));
      }
    } catch (err) {
      console.error("Failed to revoke:", err);
      alert("❌ Failed to revoke access. Please try again.");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="fixed top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold dark:text-white mb-6">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredRequests = requests.filter(
    (req) => filter === "all" || req.status === filter
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const revokedCount = requests.filter((r) => r.status === "revoked").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold dark:text-white">🛡️ Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Logged in as: {adminEmail}</p>
        </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
        <button
          onClick={() => setIsAuthenticated(false)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Logout
        </button>
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Home
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold">{pendingCount}</div>
          <div className="text-sm text-gray-600">Pending Requests</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold">{approvedCount}</div>
          <div className="text-sm text-gray-600">Approved Users</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl font-bold">{whitelist.length}</div>
          <div className="text-sm text-gray-600">Whitelisted</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {(["all", "pending", "approved", "revoked", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              filter === f
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
            {f === "revoked" && revokedCount > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {revokedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Access Requests */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold dark:text-white">Access Requests</h2>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No {filter !== "all" ? filter : ""} requests found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{req.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : req.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : req.status === "revoked"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{req.email}</p>
                    {req.githubUsername && (
                      <p className="text-gray-500 text-sm">
                        GitHub: @{req.githubUsername}
                      </p>
                    )}
                    {req.message && (
                      <p className="text-gray-700 text-sm mt-2 italic">
                        "{req.message}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Requested: {new Date(req.requestedAt).toLocaleString()}
                    </p>
                    {req.reviewedAt && (
                      <p className="text-xs text-gray-400">
                        Reviewed by {req.reviewedBy} on{" "}
                        {new Date(req.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {req.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(req.id, "approved")}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, "rejected")}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this request? The user can re-request after.")) {
                            // Just reject it for now
                            await handleUpdateStatus(req.id, "rejected");
                          }
                        }}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                      >
                        Delete
                      </button>
                    </div>
                  ) : req.status === "approved" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRevokeAccess(req.email)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Revoke Access
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Whitelisted Users Section */}
      {whitelist.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold dark:text-white">✅ Whitelisted Users</h2>
          <div className="space-y-3">
            {whitelist.map((user) => (
              <div
                key={user.email}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{user.email}</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>
                    {user.githubUsername && (
                      <p className="text-gray-600 text-sm mt-1">
                        GitHub: @{user.githubUsername}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Added: {new Date(user.addedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Added by: {user.addedBy}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRevokeAccess(user.email)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchData}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm dark:text-white"
        >
          🔄 Refresh Data
        </button>
      </div>
      </div>
    </div>
  );
}

