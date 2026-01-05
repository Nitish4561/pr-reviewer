"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import ContributionGridBackground from "@/components/ContributionGridBackground";
import { authStateManager } from "@/lib/auth-state";

function ErrorHandler({ setStatus, onLogout }: { setStatus: (status: string) => void; onLogout?: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for messages in URL params
    const error = searchParams?.get("error");
    const emailParam = searchParams?.get("email");
    const errorMessage = searchParams?.get("message");
    const installation = searchParams?.get("installation");
    
    if (installation === "success") {
      setStatus("🎉 GitHub App installed successfully! Sign in with GitHub to access your dashboard and add your OpenAI API key.");
    } else if (searchParams?.get("logout") === "true") {
      setStatus("✅ You have been logged out successfully.");
      // Force refresh auth status after logout
      if (onLogout) {
        onLogout();
      }
      setTimeout(() => {
        window.history.replaceState({}, "", "/"); // Remove logout param
        setStatus(""); // Clear the logout message
      }, 2000);
    } else if (error === "not_approved" && emailParam) {
      // Check if this user was previously approved (might be revoked)
      const lastCheckedEmail = localStorage.getItem('lastCheckedEmail');
      if (lastCheckedEmail === emailParam) {
        setStatus(`🚫 Access revoked: Your access for ${emailParam} has been revoked by an administrator. Please contact support if you believe this is an error.`);
        localStorage.removeItem('lastCheckedEmail'); // Clear stored approval
      } else {
        setStatus(`❌ Access pending: Your access request for ${emailParam} is pending admin approval. Please wait for approval before signing in.`);
      }
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null); // null = unknown, true = approved, false = not approved
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    email: string;
    avatarUrl: string;
  } | null>(null);

  useEffect(() => {
    checkAuthStatus();
    
    // Subscribe to auth state changes
    const unsubscribe = authStateManager.subscribe(() => {
      console.log("🔔 Auth state change received, rechecking...");
      checkAuthStatus();
    });
    
    // Set up a periodic check for auth status (every 10 seconds when page is active)
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkAuthStatus();
      }
    }, 10000);
    
    // Also check auth status when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Page became visible, rechecking auth status...");
        checkAuthStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add a manual refresh function for debugging
  const handleRefreshAuth = () => {
    console.log("🔄 Manually refreshing auth status...");
    // Force clear all state first
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsApproved(null);
    // Then recheck
    checkAuthStatus();
  };

  // Check for logout parameter on every render (more reliable than useEffect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      console.log("🚪 Logout detected, forcing state reset...");
      setIsLoggedIn(false);
      setCurrentUser(null);
      setIsApproved(null);
      setStatus("✅ You have been logged out successfully.");
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(""), 3000);
    }
  }, []);

  async function checkAuthStatus() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          console.log("✅ User is authenticated:", data.user.email);
          setIsLoggedIn(true);
          setIsApproved(true); // If logged in, they must be approved
          setCurrentUser({
            username: data.user.githubUsername || data.user.email.split("@")[0],
            email: data.user.email,
            avatarUrl: data.user.avatarUrl || "",
          });
        } else {
          console.log("❌ User is not authenticated");
          setIsLoggedIn(false);
          setCurrentUser(null); // Clear user data
          // Check if user has an email in localStorage (previously checked approval)
          const lastCheckedEmail = localStorage.getItem('lastCheckedEmail');
          if (lastCheckedEmail) {
            console.log("🔍 Checking approval for stored email:", lastCheckedEmail);
            await checkUserApprovalStatus(lastCheckedEmail);
          } else {
            console.log("📭 No stored email found");
            setIsApproved(null); // Reset approval status
          }
        }
      } else {
        console.log("❌ Auth check failed with status:", res.status);
        setIsLoggedIn(false);
        setCurrentUser(null);
        setIsApproved(null);
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setIsLoggedIn(false);
      setCurrentUser(null);
      setIsApproved(null);
    }
  }

  async function checkUserApprovalStatus(email: string) {
    try {
      const res = await fetch(`/api/check-approval?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setIsApproved(data.approved);
        if (data.approved) {
          localStorage.setItem('lastCheckedEmail', email);
        } else {
          localStorage.removeItem('lastCheckedEmail');
        }
      }
    } catch (error) {
      console.error("Failed to check approval status:", error);
    }
  }

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
        // Store email if approved for future login attempts
        if (data.approved) {
          localStorage.setItem('lastCheckedEmail', checkEmail);
          setIsApproved(true);
        } else {
          setIsApproved(false);
        }
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
    <main className="min-h-screen bg-black transition-colors relative overflow-hidden">
      {/* Animated Background - Always visible */}
      <ContributionGridBackground />
      
      {/* Content wrapper with high z-index to sit above background */}
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20 relative z-10">
        {/* User Profile / Theme Toggle */}
        <div className="fixed top-6 right-6 z-10">
          {isLoggedIn && currentUser ? (
            <UserProfileDropdown 
              username={currentUser.username}
              email={currentUser.email}
              avatarUrl={currentUser.avatarUrl}
            />
          ) : (
            <ThemeToggle />
          )}
        </div>

        <Suspense fallback={null}>
          <ErrorHandler setStatus={setStatus} onLogout={handleRefreshAuth} />
        </Suspense>

      {/* Hero */}
      <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 text-yellow-200 text-sm font-medium shadow-lg">
          <span>🔒</span>
          <span>Private Beta</span>
        </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
          NirikshanAI
        </h1>
          <p className="text-xl text-gray-200 drop-shadow-md">
          AI-powered Pull Request reviews that think like a senior engineer.
        </p>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded flex items-center justify-between">
            <span>Debug: isLoggedIn={String(isLoggedIn)}, isApproved={String(isApproved)}, currentUser={currentUser ? 'exists' : 'null'}</span>
            <button 
              onClick={handleRefreshAuth}
              className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Refresh Auth
            </button>
          </div>
        )}

        {/* Show error/status messages */}
        {status && (
          <div className={`p-4 rounded-lg backdrop-blur-sm border shadow-lg ${
            status.startsWith('✅') || status.startsWith('🎉') 
              ? 'bg-green-500/20 border-green-400/30 text-green-200' 
              : 'bg-red-500/20 border-red-400/30 text-red-200'
          }`}>
            {status}
          </div>
        )}

        {!showRequestForm && !showCheckStatus ? (
          <>
            <div className="flex flex-col gap-4 items-center">
              {/* Conditional CTA based on user state */}
              {isLoggedIn ? (
                // User is logged in - show dashboard link
                <div className="flex gap-4">
                  <a
                    href="/dashboard"
                    className="rounded-lg bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 transition-colors"
                  >
                    Go to Dashboard
                  </a>
                </div>
              ) : isApproved === true ? (
                // User is approved but not logged in - show sign in button
                <div className="flex gap-4">
                  <a
                    href="/api/auth/github"
                    className="rounded-lg bg-gray-900 dark:bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors"
                  >
                    Sign in with GitHub
                  </a>
                </div>
              ) : isApproved === false ? (
                // User is not approved - show request access
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Request Beta Access
                  </button>
                </div>
              ) : (
                // Unknown state - show both options
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    Request Beta Access
                  </button>
                  
                  <a
                    href="/api/auth/github"
                    className="rounded-lg bg-gray-900 dark:bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors"
                  >
                    Sign in with GitHub
                  </a>
                </div>
              )}

              {/* Check Status Link - show for non-logged-in users */}
              {!isLoggedIn && (
                <button
                  onClick={() => setShowCheckStatus(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Check my approval status
                </button>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Limited access during beta • Uses your own OpenAI key
            </p>
            
            <p className="text-sm text-gray-400 mt-4">
              Admin? <a href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline">Login here</a>
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
          <div className="max-w-md mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-600/30 p-6 text-left shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Request Access</h3>
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setStatus("");
                }}
                className="text-gray-400 hover:text-gray-200"
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
          <div key={title} className="rounded-lg border border-gray-600/30 bg-gray-900/40 backdrop-blur-sm p-6 text-center hover:shadow-xl hover:bg-gray-900/60 transition-all duration-300">
            <h3 className="font-semibold text-lg text-white">{title}</h3>
            <p className="text-sm text-gray-300 mt-2">{desc}</p>
          </div>
        ))}
      </section>

      {/* Why */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white drop-shadow-lg">Why NirikshanAI?</h2>
        <ul className="list-disc list-inside text-gray-200 space-y-2">
          <li>Line-wise comments directly on GitHub PRs</li>
          <li>Multiple comments per file</li>
          <li>No hallucinations — only real diffs</li>
          <li>Uses your OpenAI key (no hidden costs)</li>
        </ul>
      </section>

      {/* Security */}
      <section className="rounded-lg bg-gray-900/40 backdrop-blur-sm border border-gray-600/30 p-8 space-y-4 shadow-xl">
        <h2 className="text-xl font-semibold text-white">Security & Trust</h2>
        <ul className="text-sm text-gray-200 space-y-2">
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
        
        <div className="text-sm text-gray-300">
          Already have access?{" "}
          <a href="/dashboard" className="text-green-400 hover:underline">
            Go to Dashboard
          </a>
        </div>
        
        <div className="text-xs text-gray-400 pt-4">
          Admin?{" "}
          <a href="/admin" className="text-gray-400 hover:underline">
            Access Admin Dashboard
          </a>
        </div>
      </section>
      </div>
    </main>
  );
}