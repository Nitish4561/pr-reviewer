"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleBarChart, SimplePieChart } from "@/components/SimpleChart";
import UserProfileDropdown from "@/components/UserProfileDropdown";

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
  const [reviews, setReviews] = useState<PRReview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

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
          setUserEmail(data.user.email || "");
          setAvatarUrl(data.user.avatarUrl || "");
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



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">📊 Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            View your PR reviews and configure settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {username && (
            <UserProfileDropdown 
              username={username}
              email={userEmail}
              avatarUrl={avatarUrl}
            />
          )}
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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push("/settings/openai")}
          className="p-6 text-left bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🔑</span>
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">OpenAI API Key</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasKey ? "✅ Configured and ready" : "⚠️ Setup required"}
          </p>
        </button>

        <button
          onClick={() => router.push("/settings/github")}
          className="p-6 text-left bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🔗</span>
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GitHub App</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isInstalled ? "✅ Installed and active" : "⚠️ Installation needed"}
          </p>
        </button>

        <button
          onClick={() => router.push("/how-it-works")}
          className="p-6 text-left bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📚</span>
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Learn about NirikshanAI features
          </p>
        </button>
      </div>
      </div>
    </div>
  );
}
