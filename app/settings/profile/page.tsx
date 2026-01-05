"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserProfileDropdown from "@/components/UserProfileDropdown";

interface UserProfile {
  id: string;
  email: string;
  githubUsername: string;
  githubId: string;
  avatarUrl?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || "Profile not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                👤 Your Profile
              </h1>
            </div>
            <UserProfileDropdown 
              username={profile.githubUsername}
              email={profile.email}
              avatarUrl={profile.avatarUrl || ""}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Profile Overview */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Profile Information
            </h2>
            
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={`${profile.githubUsername}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {profile.githubUsername.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      GitHub Username
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={profile.githubUsername}
                        disabled
                        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                      />
                      <a
                        href={`https://github.com/${profile.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="View GitHub Profile"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        profile.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {profile.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Status
                    </label>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      profile.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {profile.status === 'active' ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={new Date(profile.createdAt).toLocaleDateString()}
                      disabled
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Login
                    </label>
                    <input
                      type="text"
                      value={profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}
                      disabled
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Account Actions
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Refresh Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your profile information from GitHub
                  </p>
                </div>
                <button
                  onClick={fetchProfile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Refresh
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100">Sign Out</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Sign out of your NirikshanAI account
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border dark:border-gray-600 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔗 GitHub Integration
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Your NirikshanAI account is connected to your GitHub account. This integration allows us to:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Access your public profile information
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Authenticate your identity
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Review pull requests in authorized repositories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Post comments and manage labels
                </li>
              </ul>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Privacy Note:</strong> We only access the minimum permissions required for NirikshanAI to function. 
                  Your private repositories and personal data remain secure and are never shared with third parties.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              🔗 Quick Links
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/settings/openai")}
                className="p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔑</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">OpenAI API Key</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your API key settings</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/settings/github")}
                className="p-4 text-left bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">GitHub App</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Installation & repositories</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/how-it-works")}
                className="p-4 text-left bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">How It Works</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Learn about NirikshanAI</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="p-4 text-left bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Dashboard</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View your PR reviews & stats</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
