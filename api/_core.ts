import { LANGUAGE_NAMES } from "../shared/languages";

const DEFAULT_MODEL = "openai/gpt-oss-20b:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 20_000;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

export async function translate(
  text: string | undefined,
  targetLang: string | undefined
): Promise<string> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    throw new HttpError(400, "Please enter some text to translate.");
  }

  const languageName = targetLang ? LANGUAGE_NAMES[targetLang] : undefined;
  if (!languageName) {
    throw new HttpError(400, "Unsupported target language.");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "Server is missing OPENROUTER_API_KEY.");
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://polyglot-app.local",
        "X-Title": "PollyGlot",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              `You are a professional translator. Translate the user's text into ${languageName}. ` +
              "Return ONLY the translated text - no explanations, no quotes, no notes. " +
              "Preserve the tone and meaning of the original.",
          },
          { role: "user", content: trimmed },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new HttpError(504, "The translation service timed out. Please try again.");
    }
    throw new HttpError(502, "Could not reach the translation service. Check your connection.");
  }

  if (!response.ok) {
    console.error("OpenRouter error", response.status, await safeReadBody(response));
    if (response.status === 429) {
      throw new HttpError(429, "Rate limit reached (free tier: 50 requests/day). Try again later.");
    }
    if (response.status === 401) {
      throw new HttpError(502, "The translation service rejected the API key.");
    }
    throw new HttpError(502, "The translation service returned an error. Please try again.");
  }

  const data = (await response.json()) as ChatCompletion;
  const translation = data.choices?.[0]?.message?.content?.trim();
  if (!translation) {
    throw new HttpError(502, "The translation service returned an empty response.");
  }

  return translation;
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<unreadable body>";
  }
}
