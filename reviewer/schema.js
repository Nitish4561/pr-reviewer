export const REVIEW_SCHEMA = {
    summary: "string",
    quality_score: "number (1-10)",
    should_block_merge: "boolean",
    issues: [
      {
        severity: "low | medium | high",
        description: "string",
        suggestion: "string",
      },
    ],
    positive_notes: ["string"],
  };
  