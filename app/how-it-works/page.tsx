"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import MermaidDiagram from "@/components/MermaidDiagram";

export default function HowItWorksPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    email: string;
    avatarUrl: string;
  } | null>(null);

  useEffect(() => {
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

  const flowDiagram = `
    sequenceDiagram
      participant Dev as Developer
      participant GH as GitHub
      participant NK as NirikshanAI
      participant AI as OpenAI GPT-4
      
      Dev->>GH: Create/Update Pull Request
      GH->>NK: Webhook: PR opened/synchronized
      NK->>GH: Fetch PR diff & files
      NK->>AI: Analyze code changes
      AI->>NK: Return review (issues, suggestions)
      NK->>GH: Post inline comments
      NK->>GH: Add labels (ai-reviewed, ai-critical)
      NK->>GH: Post summary comment
      GH->>Dev: Notification: Review complete
      Dev->>GH: View feedback & make changes
  `;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                📚 How NirikshanAI Works
              </h1>
            </div>
            {currentUser ? (
              <UserProfileDropdown 
                username={currentUser.username}
                email={currentUser.email}
                avatarUrl={currentUser.avatarUrl}
              />
            ) : (
              <ThemeToggle />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Introduction */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                AI-Powered Code Review That Thinks Like a Senior Engineer
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                NirikshanAI automatically reviews your pull requests, providing intelligent feedback,
                catching bugs, and suggesting improvements—all before human review.
              </p>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🔄 Step-by-Step Process
            </h3>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Add Your OpenAI API Key
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Configure your own OpenAI API key in the dashboard. This ensures you have full control
                    and transparency over AI usage and costs. Your key is securely stored and only used
                    for your repositories.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Create or Update a Pull Request
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    When you create or update a pull request in your connected repository, GitHub
                    automatically notifies NirikshanAI via webhook. The review process begins immediately.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    NirikshanAI Analyzes the Code
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our system fetches the PR diff and changed files from GitHub, then sends them to
                    OpenAI GPT-4 with specialized prompts designed for code review. The AI analyzes:
                  </p>
                  <ul className="mt-2 ml-6 space-y-1 text-gray-600 dark:text-gray-300 list-disc">
                    <li>Code quality and best practices</li>
                    <li>Potential bugs and security issues</li>
                    <li>Performance concerns</li>
                    <li>Maintainability and readability</li>
                    <li>Edge cases and error handling</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Inline Comments & Labels Are Added
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    NirikshanAI posts detailed inline comments directly on the specific lines of code
                    that need attention. It also applies labels to categorize the PR:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      ai-reviewed
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      ai-approved
                    </span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                      ai-critical
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-lg">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Review History Appears on Your Dashboard
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    All review results are saved and displayed on your dashboard, giving you insights into:
                  </p>
                  <ul className="mt-2 ml-6 space-y-1 text-gray-600 dark:text-gray-300 list-disc">
                    <li>Total reviews performed</li>
                    <li>Clean PRs vs PRs with issues</li>
                    <li>Critical issues found</li>
                    <li>Historical trends and analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Flow Diagram */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🔄 PR Review Flow
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Here's a visual representation of how NirikshanAI integrates with your development workflow:
            </p>
            <MermaidDiagram chart={flowDiagram} />
          </div>

          {/* Key Features */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ✨ Key Features
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Line-by-Line Analysis
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Precise inline comments on specific lines that need attention, not just generic feedback.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your Key, Your Control
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Use your own OpenAI API key. Full transparency on usage and costs. No hidden charges.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Instant Feedback
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Reviews complete in seconds, not hours. Get immediate feedback as soon as you push code.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Analytics & Insights
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Track review history, monitor code quality trends, and identify improvement areas.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">🏷️</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Labeling
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Automatic labels help you quickly identify PR status: reviewed, approved, or needs attention.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">🔄</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sequence Diagrams
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Visual sequence diagrams in PR summaries show how your code changes affect system flow.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🔐 Security & Privacy
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Your Code Stays Private:</strong> We only process code changes during reviews. Nothing is permanently stored beyond review metadata.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>GitHub App Permissions:</strong> Only requests read access to code and write access to comments/labels.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>API Key Security:</strong> Your OpenAI key is encrypted and stored securely. It's only used for your repositories.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>No Data Sharing:</strong> Your code and reviews are never shared with third parties or used for training models.</span>
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-6 opacity-90">
              Head back to your dashboard and start reviewing PRs with AI!
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Go to Dashboard →
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Need help? Check out our documentation or contact support.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

