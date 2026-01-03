"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleBarChart, SimplePieChart } from "@/components/SimpleChart";
import ThemeToggle from "@/components/ThemeToggle";
import Modal from "@/components/Modal";
import MermaidDiagram from "@/components/MermaidDiagram";

interface PRReview {
  id: string;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  issuesFound: number;
  hasHighSeverity: boolean;
  reviewedAt: string;
}

interface Stats {
  totalReviews: number;
  criticalIssues: number;
  cleanPRs: number;
  totalIssues: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [username, setUsername] = useState<string>("");
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

  useEffect(() => {
    fetchCurrentUser();
    fetchReviews();
    checkInstallation();
    fetchKeyStatus();
    
    // Check if redirected from successful installation
    const params = new URLSearchParams(window.location.search);
    if (params.get("installation") === "success") {
      setShowInstallSuccess(true);
      setIsInstalled(true); // Optimistically set as installed
      // Remove the query param
      window.history.replaceState({}, "", "/dashboard");
      // Recheck installation status after a short delay
      setTimeout(() => checkInstallation(), 1000);
    }
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUsername(data.user.githubUsername || data.user.email.split("@")[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  }

  async function checkInstallation() {
    try {
      console.log("🔍 Checking installation status...");
      const res = await fetch("/api/installations");
      if (res.ok) {
        const data = await res.json();
        console.log("   Installation data:", data);
        setIsInstalled(data.installed === true);
        console.log(`   Is installed: ${data.installed === true}`);
      } else {
        console.log("   ❌ Failed to fetch installation status");
        setIsInstalled(false);
      }
    } catch (err) {
      console.error("Failed to check installation:", err);
      setIsInstalled(false);
    }
  }

  async function fetchKeyStatus() {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.hasKey);
        setKeyPreview(data.keyPreview);
      }
    } catch (err) {
      console.error("Failed to fetch key status:", err);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch("/api/user/reviews?limit=10");
      if (res.status === 401) {
        router.push("/?error=unauthorized");
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveKey() {
    setSaved(false);
    setError("");

    const res = await fetch("/api/user/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openaiKey: key }),
    });

    if (res.ok) {
      setKey("");
      setSaved(true);
      setIsEditingKey(false);
      await fetchKeyStatus(); // Refresh key status
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
  }

  async function deleteKey() {
    showModal(
      "Delete OpenAI API Key",
      "Are you sure you want to delete your OpenAI API key?\n\nNirikshanAI won't be able to review PRs until you add a new key.",
      "danger",
      async () => {
        setError("");
        const res = await fetch("/api/user/settings", {
          method: "DELETE",
        });

        if (res.ok) {
          setHasKey(false);
          setKeyPreview(null);
          setKey("");
          setSaved(false);
          setIsEditingKey(false);
          showModal("Success", "OpenAI API key deleted successfully.", "success");
        } else {
          const data = await res.json();
          setError(data.error || "Failed to delete key");
          showModal("Error", data.error || "Failed to delete key", "danger");
        }
      },
      true
    );
  }

  function startEditingKey() {
    setIsEditingKey(true);
    setKey("");
    setSaved(false);
    setError("");
  }

  function cancelEditingKey() {
    setIsEditingKey(false);
    setKey("");
    setSaved(false);
    setError("");
  }

  const showModal = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "danger",
    onConfirm?: () => void,
    showCancel: boolean = false
  ) => {
    setModal({ isOpen: true, title, message, type, onConfirm, showCancel });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
      />
      
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          {username && (
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
              Welcome, <span className="font-semibold text-gray-900 dark:text-gray-100">{username}</span>! 👋
            </p>
          )}
          <h1 className="text-3xl font-bold dark:text-white">📊 Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            View your PR reviews and configure settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      {/* Welcome Message for New Users */}
      {!loading && stats?.totalReviews === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700 p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">👋</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to NirikshanAI!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Get started in 3 simple steps:
              </p>
              <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                  <span>Add your OpenAI API key below</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                  <span>Install the GitHub App on your repositories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                  <span>Create or update a PR to see NirikshanAI review it automatically!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Installation Success Message */}
      {showInstallSuccess && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700 p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                GitHub App Installed Successfully!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Great! NirikshanAI is now installed on your repositories.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next step: Add your OpenAI API key below to start reviewing PRs.
              </p>
              <button
                onClick={() => setShowInstallSuccess(false)}
                className="mt-4 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Reviews</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.cleanPRs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Clean PRs</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.criticalIssues}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Critical Issues</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.totalIssues}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Issues</div>
            </div>
          </div>

          {/* Charts Section */}
          {stats.totalReviews > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold dark:text-white">📊 Review Analytics</h2>
                <button
                  onClick={() => setShowCharts(!showCharts)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showCharts ? "Hide" : "Show"} Charts
                </button>
              </div>

              {showCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* PR Status Distribution */}
                  <div>
                    <h3 className="text-lg font-medium dark:text-gray-100 mb-4">PR Status Distribution</h3>
                    <SimplePieChart
                      data={[
                        { label: "Clean PRs", value: stats.cleanPRs, color: "#10b981", className: "text-gray-600 dark:text-gray-300" },
                        { label: "With Issues", value: stats.totalReviews - stats.cleanPRs - stats.criticalIssues, color: "#f59e0b", className: "text-gray-600 dark:text-gray-300" },
                        { label: "Critical", value: stats.criticalIssues, color: "#ef4444", className: "text-gray-600 dark:text-gray-300" },
                      ]}
                    />
                  </div>

                  {/* Issue Severity */}
                  <div>
                    <h3 className="text-lg font-medium dark:text-gray-100 mb-4">Review Metrics</h3>
                    <SimpleBarChart
                      data={[
                        { label: "Total Reviews", value: stats.totalReviews, color: "#3b82f6", className: "text-gray-600 dark:text-gray-300" },
                        { label: "Clean PRs", value: stats.cleanPRs, color: "#10b981", className: "text-gray-600 dark:text-gray-300" },
                        { label: "Critical Issues", value: stats.criticalIssues, color: "#ef4444", className: "text-gray-600 dark:text-gray-300" },
                        { label: "Total Issues", value: stats.totalIssues, color: "#f59e0b", className: "text-gray-600 dark:text-gray-300" },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Recent PR Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold dark:text-white">📋 Recent PR Reviews</h2>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            No PR reviews yet. Reviews will appear here after NirikshanAI analyzes your pull requests.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    PR Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className={`hover:opacity-90 transition-colors ${
                      review.issuesFound === 0 
                        ? "bg-green-50 dark:bg-green-900/20" 
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {review.owner}/{review.repo} #{review.prNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {review.prTitle}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(review.reviewedAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(review.reviewedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {review.issuesFound === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Clean
                        </span>
                      ) : review.hasHighSeverity ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          🔴 Critical
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ Has Issues
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {review.issuesFound}
                      </div>
                      {review.hasHighSeverity && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Critical
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://github.com/${review.owner}/${review.repo}/pull/${review.prNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        View PR →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* OpenAI Key */}
        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold dark:text-white">🔑 OpenAI API Key</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          This key is used only to generate reviews for your pull requests.
        </p>

        {/* Show saved key (not editing) */}
        {hasKey && !isEditingKey && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={keyPreview || ""}
                disabled
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
              />
              <button
                onClick={startEditingKey}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Edit
              </button>
              <button
                onClick={deleteKey}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ✅ OpenAI API key is configured
            </p>
          </div>
        )}

        {/* Show input field (adding new or editing) */}
        {(!hasKey || isEditingKey) && (
          <div className="mt-4 space-y-3">
        <input
          type="password"
          placeholder="sk-proj-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-md border dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />

            <div className="flex gap-2">
        <button
          onClick={saveKey}
                disabled={!key}
                className="px-4 py-2 rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save OpenAI Key
        </button>
              {isEditingKey && (
                <button
                  onClick={cancelEditingKey}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              )}
            </div>

        {saved && (
              <p className="text-sm text-green-600 dark:text-green-400">
            ✅ Key saved successfully
          </p>
        )}
        {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
        )}
      </div>

        {/* GitHub App Installation */}
        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold dark:text-white">🔗 GitHub App</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {isInstalled 
              ? "NirikshanAI is installed on your repositories."
              : "Install NirikshanAI on your repositories to enable PR reviews."}
          </p>
          
          {/* Debug Info */}
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Debug: isInstalled = {String(isInstalled)}
          </div>

          <div className="mt-4 space-y-3">
            {!isInstalled ? (
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "nirikshanai"}/installations/new`}
                className="block w-full text-center rounded-md bg-gray-900 dark:bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-indigo-700 transition"
              >
                Install NirikshanAI
              </a>
            ) : (
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "nirikshanai"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center rounded-md bg-gray-900 dark:bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-indigo-700 transition"
              >
                Uninstall NirikshanAI
              </a>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 After installation, create or update a PR to see NirikshanAI in action!
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-6">
        <h3 className="font-semibold dark:text-white">📋 How NirikshanAI Works</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
          <li>Add your OpenAI API key above</li>
          <li>Create or update a pull request in your repository</li>
          <li>NirikshanAI automatically analyzes the code</li>
          <li>Inline comments and labels are added to the PR</li>
          <li>Review history appears here on your dashboard</li>
        </ol>
      </div>

      {/* PR Review Flow Diagram */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold dark:text-white mb-4">🔄 PR Review Flow</h3>
        <MermaidDiagram
          chart={`
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant App as NirikshanAI
    participant AI as OpenAI GPT-4

    Dev->>GH: Create/Update Pull Request
    GH->>App: Webhook: PR opened/updated
    App->>GH: Fetch PR files & diffs
    GH-->>App: PR content
    App->>AI: Analyze code with context
    AI-->>App: Review results & suggestions
    App->>GH: Post inline comments
    App->>GH: Apply labels (ai-reviewed, ai-approved, ai-critical)
    App->>App: Save review to database
    GH-->>Dev: Notifications & comments
    Dev->>Dev: View review on GitHub PR
          `}
        />
      </div>
    </div>
    </div>
  );
}
