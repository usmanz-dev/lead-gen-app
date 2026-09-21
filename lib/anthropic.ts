import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

/**
 * Server-only Anthropic client, lazily created so pages that don't need AI
 * generation don't fail just because ANTHROPIC_API_KEY isn't set yet.
 *
 * TODO(Phase 4 — Contact & Outreach): wire this into the AI Email Generator
 * per leadgen.md §4 step 7 and §5 "Outreach".
 */
export function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env.local file."
    );
  }

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}
