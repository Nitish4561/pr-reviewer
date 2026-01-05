"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserProfileDropdown from "@/components/UserProfileDropdown";

export default function GitHubSettingsPage() {
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState(false);
  const [installationData, setInstallationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appSlug, setAppSlug] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    email: string;
    avatarUrl: string;
  } | null>(null);

  useEffect(() => {
    checkInstallation();
    fetchAppSlug();
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser({
            username: data.user.githubUsername || data.user.email.split("@")[0],
            email: data.user.email,
            avatarUrl: data.user.avatarUrl || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  }

  async function fetchAppSlug() {
    try {
      const res = await fetch("/api/github-app-slug");
      if (res.ok) {
        const data = await res.json();
        setAppSlug(data.slug);
      }
    } catch (error) {
      console.error("Failed to fetch app slug:", error);
    }
  }

  async function checkInstallation() {
    try {
      const res = await fetch("/api/installations");
      if (res.ok) {
        const data = await res.json();
        setIsInstalled(data.installed === true);
        setInstallationData(data);
      }
    } catch (error) {
      console.error("Failed to check installation:", error);
    } finally {
      setLoading(false);
    }
  }

  const installUrl = appSlug ? `https://github.com/apps/${appSlug}/installations/new` : "#";
  const manageUrl = appSlug ? `https://github.com/apps/${appSlug}` : "#";

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
                🔗 GitHub App Integration
              </h1>
            </div>
            {currentUser && (
              <UserProfileDropdown 
                username={currentUser.username}
                email={currentUser.email}
                avatarUrl={currentUser.avatarUrl}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Installation Status */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Installation Status
            </h2>
            
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                <p className="text-gray-600 dark:text-gray-300">Checking installation status...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Card */}
                <div className={`p-6 rounded-lg border-2 ${
                  isInstalled 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${
                        isInstalled 
                          ? 'bg-green-100 dark:bg-green-800'
                          : 'bg-orange-100 dark:bg-orange-800'
                      }`}>
                        {isInstalled ? (
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          isInstalled 
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-orange-900 dark:text-orange-100'
                        }`}>
                          {isInstalled ? 'NirikshanAI is Installed' : 'NirikshanAI Not Installed'}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          isInstalled 
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-orange-700 dark:text-orange-300'
                        }`}>
                          {isInstalled 
                            ? 'The GitHub App is installed and ready to review your PRs'
                            : 'Install the GitHub App to start automated PR reviews'
                          }
                        </p>
                        
                        {isInstalled && installationData?.repositories && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                              Repositories with access:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {installationData.repositories.map((repo: any) => (
                                <span
                                  key={repo.id}
                                  className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-md"
                                >
                                  {repo.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {!isInstalled ? (
                    <a
                      href={installUrl}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Install NirikshanAI
                    </a>
                  ) : (
                    <a
                      href={manageUrl}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Uninstall NirikshanAI
                    </a>
                  )}
                  
                  <a
                    href="https://github.com/settings/installations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage All GitHub Apps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🤖 How NirikshanAI Works
            </h3>
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Automatic Trigger</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">When you create or update a PR, NirikshanAI automatically starts reviewing</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">AI Analysis</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Our AI analyzes your code changes for bugs, security issues, and best practices</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Inline Comments</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Issues are posted as line-specific comments directly in your PR</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <p className="font-medium">Summary & Labels</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">A comprehensive summary is posted with appropriate labels (ai-reviewed, ai-approved)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions & Access */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔐 Permissions & Access
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">What NirikshanAI Can Do:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Read repository contents and PR changes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Post comments on pull requests
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Add and remove labels
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Read repository metadata
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">What NirikshanAI Cannot Do:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Modify or push code changes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Merge or close pull requests
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Access private repositories (unless granted)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Perform any destructive actions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Repository Selection */}
          <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📂 Repository Selection
            </h3>
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                When installing NirikshanAI, you can choose which repositories to grant access to:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔓 All Repositories</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Grant access to all current and future repositories. NirikshanAI will automatically 
                    review PRs in any repository you create or gain access to.
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎯 Selected Repositories</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Choose specific repositories for NirikshanAI to access. You can add or remove 
                    repositories later through GitHub's app settings.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Tip:</strong> You can modify repository access anytime by visiting the 
                  "Manage All GitHub Apps" link above and configuring NirikshanAI's permissions.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔧 Troubleshooting
            </h3>
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">NirikshanAI not reviewing PRs?</h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400 ml-4">
                  <li>• Ensure your OpenAI API key is configured and valid</li>
                  <li>• Check that the repository has NirikshanAI installed</li>
                  <li>• Verify the PR has actual code changes (not just documentation)</li>
                  <li>• Make sure you have sufficient OpenAI API credits</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Installation issues?</h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400 ml-4">
                  <li>• Try refreshing this page and checking the status again</li>
                  <li>• Ensure you're logged into the correct GitHub account</li>
                  <li>• Check GitHub's app installation page for any errors</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
