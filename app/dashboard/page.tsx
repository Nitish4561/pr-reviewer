"use client";

import { useState, useEffect, ChangeEvent } from "react";

interface Installation {
  installationId: number;
  accountLogin: string;
  repoCount: number;
  hasOpenAIKey: boolean;
}

interface LastReview {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  repoName: string;
  reviewedAt: string;
  commentUrl: string;
}

export default function DashboardPage() {
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [lastReview, setLastReview] = useState<LastReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInstallation();
  }, []);

  async function fetchInstallation() {
    try {
      const res = await fetch("/api/installations");
      const data = await res.json();
      
      if (data.installation) {
        setInstallation(data.installation);
        // Fetch reviews after getting installation
        fetchLastReview(data.installation.installationId);
      }
    } catch (err) {
      console.error("Failed to load installation:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLastReview(installationId: number) {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?installationId=${installationId}`);
      const data = await res.json();
      
      if (data.lastReview) {
        setLastReview(data.lastReview);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function saveKey() {
    if (!installation) return;
    
    setSaved(false);
    setError("");

    const res = await fetch("/api/settings/openai-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        installationId: installation.installationId,
        openaiKey: key 
      }),
    });

    if (res.ok) {
      setKey("");
      setSaved(true);
      // Refresh installation data
      fetchInstallation();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Something went wrong");
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold">⚙️ NirikshanAI Settings</h1>
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">⚙️ NirikshanAI Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure NirikshanAI to automatically review your pull requests.
          </p>
        </div>
        
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h3 className="font-semibold text-yellow-900">⚠️ No active installation found</h3>
          <p className="text-sm text-yellow-800 mt-2">
            Install the GitHub App on a repository first to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          ⚙️ NirikshanAI Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Configure NirikshanAI to automatically review your pull requests.
        </p>
      </div>

      {/* Repo Info */}
      <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
        <div>
          <p className="font-medium">{installation.accountLogin}</p>
          <p className="text-sm text-gray-600">
            {installation.repoCount} repository{installation.repoCount !== 1 ? 'ies' : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Installation ID: {installation.installationId}
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          installation.hasOpenAIKey 
            ? 'text-green-700 bg-green-100' 
            : 'text-yellow-700 bg-yellow-100'
        }`}>
          {installation.hasOpenAIKey ? '✅ Key configured' : '⚠️ No key'}
        </span>
      </div>

      {/* How it works */}
      <section className="rounded-lg border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">⚙️ How NirikshanAI Works</h2>
        <ol className="list-decimal list-inside text-gray-700 space-y-1">
          <li>Install the GitHub App on your repository</li>
          <li>Add your OpenAI API key below</li>
          <li>Create or update a Pull Request</li>
          <li>NirikshanAI reviews the code and comments on the PR</li>
        </ol>
      </section>

      {/* OpenAI Key */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">🔐 OpenAI API Key</h2>
        <p className="text-sm text-gray-600">
          This key is used only to review your pull requests.
        </p>

        <input
          type="password"
          placeholder="sk-proj-..."
          value={key}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setKey(e.currentTarget.value)
          }
          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={saveKey}
          disabled={!key}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save OpenAI Key
        </button>

        {saved && (
          <p className="text-sm text-green-600">✅ Saved successfully</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </section>

      {/* Last PR Reviewed */}
      <section className="rounded-lg border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">📊 Last PR Reviewed</h2>
        
        {loadingReviews ? (
          <p className="text-sm text-gray-500">Loading reviews...</p>
        ) : lastReview ? (
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <a
                  href={lastReview.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  #{lastReview.prNumber} {lastReview.prTitle}
                </a>
                <p className="text-sm text-gray-600 mt-1">
                  {lastReview.repoName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Reviewed {new Date(lastReview.reviewedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <a
              href={lastReview.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              View Review Comment →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              No pull requests reviewed yet.
            </p>
            <p className="text-sm text-gray-500">
              Open or update a PR to trigger the AI review.
            </p>
          </div>
        )}
      </section>

      {/* Security */}
      <section className="rounded-lg border bg-gray-50 p-6 space-y-2">
        <h2 className="text-lg font-semibold">🔒 Security & Privacy</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Your OpenAI API key is encrypted and stored securely</li>
          <li>NirikshanAI only reads Pull Request diffs</li>
          <li>Your code is never stored permanently</li>
          <li>You can uninstall the GitHub App at any time</li>
        </ul>
      </section>

      {/* Troubleshooting */}
      <section className="rounded-lg border bg-gray-50 p-6 space-y-2">
        <h2 className="text-lg font-semibold">🛠 Troubleshooting</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Ensure the GitHub App is installed on the repository</li>
          <li>Make sure the PR contains code changes</li>
          <li>Check that your OpenAI key has available credits</li>
          <li>Try reopening or updating the PR</li>
        </ul>
      </section>
    </div>
  );
}
