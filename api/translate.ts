import type { VercelRequest, VercelResponse } from "@vercel/node";
import { translate, HttpError } from "./_core";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, targetLang } = parseBody(req.body);

  try {
    const translation = await translate(text, targetLang);
    return res.status(200).json({ translation });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Unexpected translation error", err);
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
}

function parseBody(body: unknown): { text?: string; targetLang?: string } {
  const record = typeof body === "string" ? safeParse(body) : isRecord(body) ? body : {};
  return {
    text: typeof record.text === "string" ? record.text : undefined,
    targetLang: typeof record.targetLang === "string" ? record.targetLang : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeParse(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
