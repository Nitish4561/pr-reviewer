import { runPRReview } from "@/reviewer/index";

interface GitHubWebhookEvent {
  action: string;
  repository: {
    owner: {
      login: string;
    };
    name: string;
  };
  pull_request: {
    number: number;
  };
}

export async function POST(req: Request) {
  const event = await req.json() as GitHubWebhookEvent;

  if (event.action !== "opened") {
    return new Response("Ignored");
  }

  await runPRReview({
    owner: event.repository.owner.login,
    repo: event.repository.name,
    pull_number: event.pull_request.number,
    githubToken: process.env.GITHUB_TOKEN!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
  });

  return new Response("OK");
}
