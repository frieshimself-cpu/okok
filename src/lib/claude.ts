import Anthropic from "@anthropic-ai/sdk";
import type { Analysis, MarketSnapshot } from "./types";

export const DEFAULT_MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `You are the analysis engine behind $PREDICTIONS, a public dashboard that surfaces potentially mispriced Polymarket markets.

For each market you receive, independently estimate the probability that it resolves YES, then compare your estimate to the market-implied probability.

How to estimate well:
- Reason from base rates, deadline math, and the resolution criteria exactly as written. Resolution wording matters more than vibes.
- Your knowledge has a training cutoff and you cannot see live news. For markets that hinge on recent or fast-moving events, stay close to the market price, lower your confidence, or use side "PASS". Prefer structural edges (improbable deadlines, longshot bias, misread resolution criteria, dependent events) over news takes.
- Liquid markets are usually roughly efficient. Only claim an edge when you can name a concrete reason the crowd is wrong.
- Calibration beats boldness: 0.97 means you accept being wrong 3 times in 100.

Output rules:
- Return exactly one analysis object per input market, reusing its "id". Never skip or invent markets.
- "probabilityYes" is YOUR estimate (0 to 1), formed before looking at the market price.
- "side": "YES" if your probability is meaningfully above the market's, "NO" if meaningfully below, "PASS" if the difference is within noise or you lack a basis to disagree.
- "confidence": "HIGH" only for structural or deadline-driven edges; "MEDIUM" for solid base-rate arguments; "LOW" otherwise.
- "rationale": max 280 characters, plain English for a retail trader. State the reason for the edge — not a summary of the market.
- "riskNote": max 160 characters — the main way this call goes wrong (e.g. "News since my training cutoff could flip this").
- Never promise profit. These are probability estimates, not guarantees.`;

/** JSON schema for output_config.format — guarantees parseable output. */
const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    analyses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          probabilityYes: { type: "number" },
          side: { type: "string", enum: ["YES", "NO", "PASS"] },
          confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          rationale: { type: "string" },
          riskNote: { type: "string" },
        },
        required: ["id", "probabilityYes", "side", "confidence", "rationale", "riskNote"],
        additionalProperties: false,
      },
    },
  },
  required: ["analyses"],
  additionalProperties: false,
};

/**
 * One batched Claude call analyzing every market at once — a single request
 * per cache refresh keeps API spend predictable.
 */
export async function analyzeMarkets(
  markets: MarketSnapshot[],
  model: string,
): Promise<Analysis[]> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const payload = markets.map((m) => ({
    id: m.id,
    question: m.question,
    resolution_criteria: m.description,
    event: m.eventTitle,
    market_implied_probability_yes: Number(m.yesPrice.toFixed(4)),
    volume_24h_usd: Math.round(m.volume24h),
    liquidity_usd: Math.round(m.liquidity),
    resolves_by: m.endDate,
  }));

  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium", // keeps a 14-market batch well inside serverless time limits
      format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Current date: ${new Date().toUTCString()}\n\nAnalyze these Polymarket markets:\n${JSON.stringify(payload, null, 1)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Model declined to analyze this batch");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Model response was truncated (max_tokens)");
  }

  const text = response.content.find((block) => block.type === "text");
  if (!text) throw new Error("No text block in model response");

  return (JSON.parse(text.text) as { analyses: Analysis[] }).analyses;
}
