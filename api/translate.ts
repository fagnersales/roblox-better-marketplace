import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "GET") {
    return new Response(null, { status: 405 });
  }

  const token = process.env.API_TOKEN;
  const auth = req.headers.get("authorization");
  if (!token || auth !== `Bearer ${token}`) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return new Response(JSON.stringify({ error: "missing q parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: z.object({
        variants: z
          .array(z.string())
          .describe("Up to 3 English translations/variations of the input"),
      }),
      prompt: `You are a translator for a Roblox marketplace search engine. Given a word or phrase in any language, provide up to 3 English translations or variations that a user might search for. If the input is already in English, return up to 3 synonyms or alternate phrasings. Be concise — return only the search terms, no explanations.\n\nInput: "${query}"`,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
