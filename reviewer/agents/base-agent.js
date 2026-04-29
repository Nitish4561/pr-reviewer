/**
 * Base Agent Class
 * All specialized agents inherit from this
 */

export class BaseAgent {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.model = "gpt-4o-mini"; // Default model
  }

  /**
   * Call OpenAI API
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User content
   * @param {string} apiKey - OpenAI API key
   * @param {Object} options - Additional options (temperature, max_tokens, etc.)
   * @returns {Object} Parsed JSON response
   */
  async callLLM(systemPrompt, userPrompt, apiKey, options = {}) {
    const {
      temperature = 0.1,
      max_tokens = 2000,
      model = this.model,
    } = options;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`${this.name} API error: ${response.status} - ${text}`);
      throw new Error(`LLM API call failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Clean up markdown code blocks if present
    if (content.startsWith("```")) {
      content = content.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
    }

    return JSON.parse(content);
  }

  /**
   * Main analyze method - must be implemented by subclasses
   * @param {Object} context - PR context (files, diff, metadata, etc.)
   * @param {string} apiKey - OpenAI API key
   * @returns {Object} Analysis results
   */
  async analyze(context, apiKey) {
    throw new Error(`${this.name} must implement analyze() method`);
  }

  /**
   * Format agent results for display
   * @param {Object} results - Analysis results
   * @returns {string} Formatted markdown
   */
  format(results) {
    return JSON.stringify(results, null, 2);
  }
}

