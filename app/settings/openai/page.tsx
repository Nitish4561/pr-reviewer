"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Modal from "@/components/Modal";

export default function OpenAISettingsPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [openaiValidation, setOpenaiValidation] = useState<{
    valid: boolean;
    keyPrefix?: string;
    modelCount?: number;
    message?: string;
  } | null>(null);
  const [loadingValidation, setLoadingValidation] = useState(false);
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
    fetchKeyStatus();
  }, []);

  useEffect(() => {
    if (hasKey) {
      validateOpenAIKey();
    }
  }, [hasKey]);

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
    setModal(prev => ({ ...prev, isOpen: false }));
  };

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

  async function validateOpenAIKey() {
    if (!hasKey) return;
    
    setLoadingValidation(true);
    try {
      const res = await fetch("/api/user/openai-usage");
      if (res.ok) {
        const data = await res.json();
        if (data.configured && data.valid) {
          setOpenaiValidation({
            valid: true,
            keyPrefix: data.keyPrefix,
            modelCount: data.modelCount,
            message: data.message,
          });
        } else {
          setOpenaiValidation({
            valid: false,
            message: data.message || "Unable to validate API key",
          });
        }
      } else {
        setOpenaiValidation({
          valid: false,
          message: "Failed to validate API key",
        });
      }
    } catch (err) {
      console.error("Failed to validate OpenAI key:", err);
      setOpenaiValidation({
        valid: false,
        message: "Error validating API key",
      });
    } finally {
      setLoadingValidation(false);
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
      await fetchKeyStatus();
      await validateOpenAIKey();
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
        const res = await fetch("/api/user/settings", { method: "DELETE" });
        if (res.ok) {
          setHasKey(false);
          setKeyPreview(null);
          setOpenaiValidation(null);
          showModal("Success", "OpenAI API key deleted successfully", "success");
        } else {
          const data = await res.json();
          setError(data.error || "Failed to delete key");
        }
      },
      true
    );
  }

  const startEditingKey = () => {
    setIsEditingKey(true);
    setSaved(false);
    setError("");
  };

  const cancelEditingKey = () => {
    setIsEditingKey(false);
    setKey("");
    setError("");
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
                🔑 OpenAI API Key
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Introduction */}
          <div className="rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your OpenAI API Key
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              NirikshanAI uses your own OpenAI API key to power code reviews. This ensures you have 
              full control over usage and costs. Your key is securely stored and only used for your repositories.
            </p>

            {/* Key Management */}
            <div className="space-y-6">
              {/* Show saved key (not editing) */}
              {hasKey && !isEditingKey && (
                <div className="space-y-4">
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

                  {/* OpenAI Key Validation */}
                  {loadingValidation ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Validating API key...
                        </p>
                      </div>
                    </div>
                  ) : openaiValidation ? (
                    <div className={`p-4 rounded-lg border ${
                      openaiValidation.valid 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {openaiValidation.valid ? (
                              <>
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                                  API Key Valid
                                </p>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                                  Validation Failed
                                </p>
                              </>
                            )}
                          </div>
                          
                          {openaiValidation.valid ? (
                            <div className="mt-2 space-y-1">
                              {openaiValidation.keyPrefix && (
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  Key: {openaiValidation.keyPrefix}
                                </p>
                              )}
                              {openaiValidation.modelCount && (
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  {openaiValidation.modelCount} models available
                                </p>
                              )}
                              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                                <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                                  💳 Check Your Usage & Billing:
                                </p>
                                <a
                                  href="https://platform.openai.com/settings/organization/billing/overview"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                                >
                                  OpenAI Billing Dashboard
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  View your credit balance, usage, and payment methods
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                              {openaiValidation.message || "Unable to validate key"}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={validateOpenAIKey}
                          className={`p-2 rounded-md transition ${
                            openaiValidation.valid
                              ? 'hover:bg-green-100 dark:hover:bg-green-800'
                              : 'hover:bg-red-100 dark:hover:bg-red-800'
                          }`}
                          title="Refresh validation"
                        >
                          <svg className={`w-5 h-5 ${
                            openaiValidation.valid
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Show input field (adding new or editing) */}
              {(!hasKey || isEditingKey) && (
                <div className="space-y-4">
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
          </div>

          {/* How to Get API Key */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔗 How to Get Your OpenAI API Key
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <p>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OpenAI API Keys</a></p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <p>Click "Create new secret key"</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <p>Copy the key (starts with "sk-proj-..." or "sk-...")</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <p>Paste it above and save</p>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔒 Security & Privacy
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Your Key, Your Control:</strong> We never store or share your OpenAI API key with third parties.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Encrypted Storage:</strong> Your key is encrypted and stored securely in our database.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Usage Transparency:</strong> Only you can see your OpenAI usage and billing.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Repository Isolation:</strong> Your key is only used for your own repositories.</span>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
