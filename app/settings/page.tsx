"use client";

import { useState, useEffect } from "react";

interface Installation {
  installationId: number;
  accountLogin: string;
  repoCount: number;
  hasOpenAIKey: boolean;
}

export default function SettingsPage() {
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstallation();
  }, []);

  async function fetchInstallation() {
    try {
      const res = await fetch("/api/installations");
      const data = await res.json();
      
      if (data.installation) {
        setInstallation(data.installation);
      } else {
        setStatus("❌ No active installation found. Install the GitHub App first.");
      }
    } catch (err) {
      setStatus("❌ Failed to load installation");
    } finally {
      setLoading(false);
    }
  }

  async function saveKey() {
    if (!installation) return;
    
    setStatus("Saving...");
    
    try {
      const res = await fetch("/api/settings/openai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationId: installation.installationId,
          openaiKey,
        }),
      });

      if (res.ok) {
        setStatus("✅ Saved successfully!");
        setOpenaiKey("");
        // Refresh installation data
        fetchInstallation();
      } else {
        const data = await res.json();
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: 20 }}>
        <h1>⚙️ PR Reviewer Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!installation) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: 20 }}>
        <h1>⚙️ PR Reviewer Settings</h1>
        <div style={{ marginTop: 20, padding: 15, backgroundColor: "#fff3cd", borderRadius: 4 }}>
          <strong>⚠️ No active installation found</strong>
          <p>Install the GitHub App on a repository first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 20 }}>
      <h1>⚙️ PR Reviewer Settings</h1>
      
      <div style={{ marginTop: 20, padding: 15, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{installation.accountLogin || "GitHub Installation"}</strong>
            <div style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
              {installation.repoCount} repository{installation.repoCount !== 1 ? "ies" : ""}
            </div>
          </div>
          <div style={{ 
            padding: "4px 12px", 
            borderRadius: 12, 
            fontSize: 12,
            backgroundColor: installation.hasOpenAIKey ? "#d4edda" : "#fff3cd",
            color: installation.hasOpenAIKey ? "#155724" : "#856404",
          }}>
            {installation.hasOpenAIKey ? "✅ Key configured" : "⚠️ No key"}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#999" }}>
          Installation ID: {installation.installationId}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>
          <strong>OpenAI API Key</strong>
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-proj-..."
            style={{
              width: "100%",
              padding: 10,
              marginTop: 5,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />
        </label>
      </div>

      <button
        onClick={saveKey}
        disabled={!openaiKey}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: openaiKey ? "pointer" : "not-allowed",
          opacity: openaiKey ? 1 : 0.5,
        }}
      >
        Save OpenAI Key
      </button>

      {status && (
        <p style={{ marginTop: 20, fontSize: 14 }}>
          {status}
        </p>
      )}

      <div style={{ marginTop: 40, padding: 15, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
        <h3>📝 Instructions:</h3>
        <ol>
          <li>Enter your OpenAI API key (starts with <code>sk-proj-...</code>)</li>
          <li>Click "Save OpenAI Key"</li>
          <li>Create or update a PR to trigger the AI review</li>
        </ol>
      </div>
    </div>
  );
}

