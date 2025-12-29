export default function HomePage() {
  // Get GitHub App slug from environment variable
  const githubAppSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "nirikshanai";
  const githubAppUrl = `https://github.com/apps/${githubAppSlug}`;

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-20">

      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          NirikshanAI
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered Pull Request reviews that think like a senior engineer.
        </p>

        <a
          href={githubAppUrl}
          className="inline-block rounded-lg bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Install GitHub App
        </a>

        <p className="text-sm text-gray-500">
          Free during beta • Uses your own OpenAI key
        </p>
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
      <section className="text-center">
        <div className="space-y-4">
          <a
            href={githubAppUrl}
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started with NirikshanAI →
          </a>
          <div className="text-sm text-gray-500">
            Already installed?{" "}
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}