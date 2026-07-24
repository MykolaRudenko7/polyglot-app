import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchMeme } from "./_core.js";
import { handlePost } from "./_http.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handlePost(req, res, async () => ({ meme: await fetchMeme() }));
}
