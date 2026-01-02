"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleBarChart, SimplePieChart } from "@/components/SimpleChart";

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
  const [installationSuccess, setInstallationSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkInstallation();
    
    // Check if redirected from successful installation
    const params = new URLSearchParams(window.location.search);
    if (params.get("installation") === "success") {
      setInstallationSuccess(true);
      // Remove the query param
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  async function checkInstallation() {
    try {
      const res = await fetch("/api/installations");
      if (res.ok) {
        const data = await res.json();
        setIsInstalled(!!data.installation);
      }
    } catch (err) {
      console.error("Failed to check installation:", err);
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
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Dashboard</h1>
          <p className="mt-1 text-gray-600">
            View your PR reviews and configure settings
          </p>
        </div>
        <a
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Home
        </a>
      </div>

      {/* Welcome Message for New Users */}
      {!loading && stats?.totalReviews === 0 && !installationSuccess && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">👋</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Welcome to NirikshanAI!
              </h2>
              <p className="text-gray-700 mb-4">
                Get started in 3 simple steps:
              </p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Add your OpenAI API key below</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Install the GitHub App on your repositories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Create or update a PR to see NirikshanAI review it automatically!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Installation Success Message */}
      {installationSuccess && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                GitHub App Installed Successfully!
              </h2>
              <p className="text-gray-700 mb-3">
                Great! NirikshanAI is now installed on your repositories.
              </p>
              <p className="text-sm text-gray-600">
                Next step: Add your OpenAI API key below to start reviewing PRs.
              </p>
              <button
                onClick={() => setInstallationSuccess(false)}
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
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
            <div className="bg-white rounded-lg border p-6">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="text-2xl font-bold text-green-600">
                {stats.cleanPRs}
              </div>
              <div className="text-sm text-gray-600">Clean PRs</div>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="text-2xl font-bold text-red-600">
                {stats.criticalIssues}
              </div>
              <div className="text-sm text-gray-600">Critical Issues</div>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalIssues}
              </div>
              <div className="text-sm text-gray-600">Total Issues</div>
            </div>
          </div>

          {/* Charts Section */}
          {stats.totalReviews > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">📊 Review Analytics</h2>
                <button
                  onClick={() => setShowCharts(!showCharts)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showCharts ? "Hide" : "Show"} Charts
                </button>
              </div>

              {showCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* PR Status Distribution */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">PR Status Distribution</h3>
                    <SimplePieChart
                      data={[
                        { label: "Clean PRs", value: stats.cleanPRs, color: "#10b981" },
                        { label: "With Issues", value: stats.totalReviews - stats.cleanPRs - stats.criticalIssues, color: "#f59e0b" },
                        { label: "Critical", value: stats.criticalIssues, color: "#ef4444" },
                      ]}
                    />
                  </div>

                  {/* Issue Severity */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Review Metrics</h3>
                    <SimpleBarChart
                      data={[
                        { label: "Total Reviews", value: stats.totalReviews, color: "#3b82f6" },
                        { label: "Clean PRs", value: stats.cleanPRs, color: "#10b981" },
                        { label: "Critical Issues", value: stats.criticalIssues, color: "#ef4444" },
                        { label: "Total Issues", value: stats.totalIssues, color: "#f59e0b" },
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
        <h2 className="text-xl font-semibold">📋 Recent PR Reviews</h2>

        {loading ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No PR reviews yet. Reviews will appear here after NirikshanAI analyzes your pull requests.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {review.owner}/{review.repo} #{review.prNumber}
                      </h3>
                      {review.issuesFound === 0 ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✅ Clean
                        </span>
                      ) : review.hasHighSeverity ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          🔴 Critical
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          ⚠️ {review.issuesFound} Issues
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mt-1">
                      {review.prTitle}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Reviewed {new Date(review.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={`https://github.com/${review.owner}/${review.repo}/pull/${review.prNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View PR →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OpenAI Key */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">🔑 OpenAI API Key</h2>
          <p className="mt-1 text-sm text-gray-600">
            This key is used only to generate reviews for your pull requests.
          </p>

          <input
            type="password"
            placeholder="sk-proj-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-4 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={saveKey}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Save OpenAI Key
          </button>

          {saved && (
            <p className="mt-2 text-sm text-green-600">
              ✅ Key saved successfully
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* GitHub App Installation */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">🔗 GitHub App</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isInstalled 
              ? "NirikshanAI is installed on your repositories."
              : "Install NirikshanAI on your repositories to enable PR reviews."}
          </p>

          <div className="mt-4 space-y-3">
            {!isInstalled ? (
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "nirikshanai"}/installations/new`}
                className="block w-full text-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                Install on Repositories
              </a>
            ) : (
              <a
                href="https://github.com/settings/installations"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                Manage Installation
              </a>
            )}

            <a
              href="https://github.com/settings/installations"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              View All Installations
            </a>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 After installation, create or update a PR to see NirikshanAI in action!
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="rounded-xl bg-gray-50 p-6">
        <h3 className="font-semibold">📋 How NirikshanAI Works</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          <li>Add your OpenAI API key above</li>
          <li>Create or update a pull request in your repository</li>
          <li>NirikshanAI automatically analyzes the code</li>
          <li>Inline comments and labels are added to the PR</li>
          <li>Review history appears here on your dashboard</li>
        </ol>
      </div>
    </div>
  );
}
