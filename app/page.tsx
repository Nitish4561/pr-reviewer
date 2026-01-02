"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ErrorHandler({ setStatus }: { setStatus: (status: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for messages in URL params
    const error = searchParams?.get("error");
    const emailParam = searchParams?.get("email");
    const installation = searchParams?.get("installation");
    const errorMessage = searchParams?.get("message");
    
    if (installation === "success") {
      setStatus("🎉 GitHub App installed successfully! Now sign in with GitHub to access your dashboard.");
    } else if (error === "not_approved" && emailParam) {
      setStatus(`❌ Your access request (${emailParam}) is pending admin approval. Please wait for approval before signing in.`);
    } else if (error === "auth_failed") {
      const message = errorMessage ? ` (${decodeURIComponent(errorMessage)})` : "";
      setStatus(`❌ GitHub authentication failed${message}. Please try again.`);
    } else if (error === "unauthorized") {
      setStatus("❌ Please sign in to access that page.");
    }
  }, [searchParams, setStatus]);

  return null;
}

export default function HomePage() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showCheckStatus, setShowCheckStatus] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<any>(null);

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, githubUsername, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ " + data.message);
        setName("");
        setEmail("");
        setGithubUsername("");
        setMessage("");
        setTimeout(() => setShowRequestForm(false), 3000);
      } else {
        setStatus("❌ " + (data.error || "Failed to submit request"));
      }
    } catch (err) {
      setStatus("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setApprovalStatus(null);

    try {
      const res = await fetch(`/api/check-approval?email=${encodeURIComponent(checkEmail)}`);
      const data = await res.json();

      if (res.ok) {
        setApprovalStatus(data);
      } else {
        setApprovalStatus({ error: data.error || "Failed to check status" });
      }
    } catch (err) {
      setApprovalStatus({ error: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-20">
      <Suspense fallback={null}>
        <ErrorHandler setStatus={setStatus} />
      </Suspense>

      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
          <span>🔒</span>
          <span>Private Beta</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          NirikshanAI
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered Pull Request reviews that think like a senior engineer.
        </p>

        {/* Show error/status messages */}
        {status && (
          <div className={`p-4 rounded-lg ${status.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status}
          </div>
        )}

        {!showRequestForm && !showCheckStatus ? (
          <>
            <div className="flex flex-col gap-4 items-center">
              {/* Primary CTA */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Request Beta Access
                </button>
                
                <a
                  href="/api/auth/github"
                  className="rounded-lg bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign in with GitHub
                </a>
              </div>

              {/* Check Status Link */}
              <button
                onClick={() => setShowCheckStatus(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Check my approval status
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Limited access during beta • Uses your own OpenAI key
            </p>
            
            <p className="text-sm text-gray-400 mt-4">
              Admin? <a href="/admin" className="text-blue-600 hover:underline">Login here</a>
            </p>
          </>
        ) : showCheckStatus ? (
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Check Approval Status</h3>
              <button
                onClick={() => {
                  setShowCheckStatus(false);
                  setApprovalStatus(null);
                  setCheckEmail("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={checkEmail}
                  onChange={(e) => setCheckEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Checking..." : "Check Status"}
              </button>

              {approvalStatus && (
                <div className={`p-4 rounded-lg ${
                  approvalStatus.error
                    ? 'bg-red-50 text-red-700'
                    : approvalStatus.approved
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {approvalStatus.error || approvalStatus.message}
                  
                  {approvalStatus.approved && (
                    <div className="mt-4">
                      <a
                        href="/api/auth/github"
                        className="block w-full bg-green-600 text-white text-center py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Sign in with GitHub →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Access</h3>
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setStatus("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username (optional)
                </label>
                <input
                  type="text"
                  id="github"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want access? (optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your use case..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>

              {status && (
                <p className="text-sm text-center mt-2">{status}</p>
              )}
            </form>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="grid sm:grid-cols-3 gap-8">
        {[
          ["Install", "Install the GitHub App on your repo"],
          ["Connect", "Add your OpenAI API key"],
          ["Review", "Get line-by-line PR feedback automatically"],
        ].map(([title, desc]) => (
          <div key={title} className="rounded-lg border p-6 text-center hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-600 mt-2">{desc}</p>
          </div>
        ))}
      </section>

      {/* Why */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Why NirikshanAI?</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Line-wise comments directly on GitHub PRs</li>
          <li>Multiple comments per file</li>
          <li>No hallucinations — only real diffs</li>
          <li>Uses your OpenAI key (no hidden costs)</li>
        </ul>
      </section>

      {/* Security */}
      <section className="rounded-lg bg-gray-50 border p-8 space-y-4">
        <h2 className="text-xl font-semibold">Security & Trust</h2>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>🔒 Your API key is encrypted</li>
          <li>📄 Only PR diffs are analyzed</li>
          <li>🧹 No long-term code storage</li>
          <li>🚫 Uninstall anytime from GitHub</li>
        </ul>
      </section>

      {/* Footer CTA */}
      <section className="text-center space-y-4">
        {!showRequestForm && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Request Beta Access →
          </button>
        )}
        
        <div className="text-sm text-gray-500">
          Already have access?{" "}
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Go to Dashboard
          </a>
        </div>
        
        <div className="text-xs text-gray-400 pt-4">
          Admin?{" "}
          <a href="/admin" className="text-gray-600 hover:underline">
            Access Admin Dashboard
          </a>
        </div>
      </section>
    </main>
  );
}