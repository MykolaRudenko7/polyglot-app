import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HttpError } from "./_core.js";

export function parseBody(body: unknown): Record<string, unknown> {
  if (typeof body === "string") return safeParse(body);
  return isRecord(body) ? body : {};
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

export async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  fn: (body: Record<string, unknown>) => Promise<Record<string, unknown>>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  let body: Record<string, unknown>;
  try {
    body = parseBody(req.body);
  } catch {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  try {
    const result = await fn(body);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error("Unexpected server error", err);
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
}
