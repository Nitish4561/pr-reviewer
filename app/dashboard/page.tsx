"use client";

import { useState, ChangeEvent } from "react";

export default function DashboardPage() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
      const data = await res.json() as { error?: string };
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "80px auto" }}>
      <h1>🔐 OpenAI API Key</h1>
      <p>This key will be used to review your pull requests.</p>

      <input
        type="password"
        placeholder="sk-..."
        value={key}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setKey(e.currentTarget.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 10,
        }}
      />

      <button
        onClick={saveKey}
        style={{ marginTop: 12, padding: 10 }}
      >
        Save Key
      </button>

      {saved && <p style={{ color: "green" }}>✅ Saved successfully</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
