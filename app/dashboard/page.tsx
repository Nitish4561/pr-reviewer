"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const installationId = "101749808"; // replace from server later

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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">⚙️ PR Reviewer Settings</h1>
      <p className="mt-2 text-gray-600">
        Configure NirikshanAI for your GitHub repositories.
      </p>

      {/* OpenAI Key */}
      <div className="mt-8 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">OpenAI API Key</h2>
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

      {/* Instructions */}
      <div className="mt-8 rounded-xl bg-gray-50 p-6">
        <h3 className="font-semibold">📋 How it works</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          <li>Add your OpenAI API key</li>
          <li>Create or update a pull request</li>
          <li>NirikshanAI posts inline review comments automatically</li>
        </ol>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-700">
          Danger Zone
        </h3>
        <p className="mt-2 text-sm text-red-600">
          Uninstalling the app will stop all reviews and remove your data.
        </p>

        <a
          href={`https://github.com/settings/installations/${installationId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
        >
          Uninstall NirikshanAI from GitHub
        </a>
      </div>
    </div>
  );
}
