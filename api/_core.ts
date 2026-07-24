import { LANGUAGE_NAMES } from "../shared/languages.js";

const FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MEME_API = "https://meme-api.com/gimme/6";
const REQUEST_TIMEOUT_MS = 30_000;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

interface MemeApiResponse {
  memes?: MemeApiItem[];
  url?: string;
  nsfw?: boolean;
  spoiler?: boolean;
}

interface MemeApiItem {
  url?: string;
  nsfw?: boolean;
  spoiler?: boolean;
}

function requireApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new HttpError(500, "Server is missing OPENROUTER_API_KEY.");
  return apiKey;
}

function modelChain(): string[] {
  const override = process.env.OPENROUTER_MODEL;
  if (!override) return [...FREE_MODELS];
  return [override, ...FREE_MODELS.filter((model) => model !== override)];
}

async function callOpenRouter(body: Record<string, unknown>): Promise<ChatCompletion> {
  const apiKey = requireApiKey();

  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://polyglot-app.local",
        "X-Title": "PollyGlot",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw timeoutOrNetworkError(err, "AI service");
  }

  if (!response.ok) {
    console.error("OpenRouter error", response.status, await safeReadBody(response));
    if (response.status === 429) {
      throw new HttpError(429, "Rate limit reached (free tier: 50 requests/day). Try again later.");
    }
    if (response.status === 401) {
      throw new HttpError(502, "The AI service rejected the API key.");
    }
    throw new HttpError(502, "The AI service returned an error. Please try again.");
  }

  return (await response.json()) as ChatCompletion;
}

export async function translate(
  text: string | undefined,
  targetLang: string | undefined
): Promise<string> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) throw new HttpError(400, "Please enter some text to translate.");

  const languageName = targetLang ? LANGUAGE_NAMES[targetLang] : undefined;
  if (!languageName) throw new HttpError(400, "Unsupported target language.");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        `You are a professional translator. Translate the user's text into ${languageName}. ` +
        "Return ONLY the translated text - no explanations, no quotes, no notes. " +
        "Preserve the tone and meaning of the original.",
    },
    { role: "user", content: trimmed },
  ];

  const chain = modelChain();
  const data = await callOpenRouter({
    model: chain[0],
    models: chain,
    temperature: 0.2,
    max_tokens: 500,
    messages,
  });

  const translation = data.choices?.[0]?.message?.content?.trim();
  if (!translation) throw new HttpError(502, "The translation service returned an empty response.");
  return translation;
}

export async function correct(text: string | undefined): Promise<string> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return "";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a spelling and grammar corrector. Fix spelling and grammar mistakes in the " +
        "user's text while keeping the SAME language and meaning. Return ONLY the corrected " +
        "text - no quotes, no explanations. If the text is already correct, return it unchanged.",
    },
    { role: "user", content: trimmed },
  ];

  const chain = modelChain();
  const data = await callOpenRouter({
    model: chain[0],
    models: chain,
    temperature: 0,
    max_tokens: 300,
    messages,
  });

  return data.choices?.[0]?.message?.content?.trim() ?? trimmed;
}

const MEME_TEMPLATES: Record<string, string> = {
  drake: "https://i.imgflip.com/30b1gx.jpg",
  "distracted-boyfriend": "https://i.imgflip.com/1ur9b0.jpg",
  "two-buttons": "https://i.imgflip.com/1g8my4.jpg",
  "change-my-mind": "https://i.imgflip.com/24y43o.jpg",
  "expanding-brain": "https://i.imgflip.com/1jwhww.jpg",
  "woman-yelling-at-cat": "https://i.imgflip.com/345v97.jpg",
  "surprised-pikachu": "https://i.imgflip.com/2kbn1e.jpg",
  "this-is-fine": "https://i.imgflip.com/wxica.jpg",
};

export interface MemeCard {
  imageUrl: string;
  topText?: string;
  bottomText?: string;
}

export async function makeMeme(text: string | undefined): Promise<MemeCard> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return { imageUrl: await fetchMeme() };

  try {
    const keys = Object.keys(MEME_TEMPLATES).join(", ");
    const chain = modelChain();
    const data = await callOpenRouter({
      model: chain[0],
      models: chain,
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            `You caption memes. Given a phrase, pick the best-fitting template from: ${keys}. ` +
            'Reply with ONLY compact JSON: {"template":"<key>","top":"<caption>","bottom":"<caption>"}. ' +
            "Captions must relate to the phrase, be funny and friendly, at most 8 words each, " +
            "and use the same language as the phrase.",
        },
        { role: "user", content: trimmed },
      ],
    });

    const raw = data.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { template?: string; top?: string; bottom?: string };
      const imageUrl = parsed.template ? MEME_TEMPLATES[parsed.template] : undefined;
      if (imageUrl) return { imageUrl, topText: parsed.top, bottomText: parsed.bottom };
    }
  } catch (err) {
    console.error("Meme captioning failed, falling back to a random meme", err);
  }

  return { imageUrl: await fetchMeme() };
}

export async function fetchMeme(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(MEME_API, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw timeoutOrNetworkError(err, "meme service");
  }

  if (!response.ok) {
    throw new HttpError(502, "The meme service returned an error. Please try again.");
  }

  const data = (await response.json()) as MemeApiResponse;
  const candidates: MemeApiItem[] = data.memes ?? [
    { url: data.url, nsfw: data.nsfw, spoiler: data.spoiler },
  ];

  const safe = candidates.find(
    (meme) => meme.url && !meme.nsfw && !meme.spoiler && /\.(jpe?g|png|gif|webp)$/i.test(meme.url)
  );
  if (!safe?.url) throw new HttpError(502, "Could not find a suitable meme. Please try again.");
  return safe.url;
}

function timeoutOrNetworkError(err: unknown, service: string): HttpError {
  const name = err instanceof Error ? err.name : "";
  if (name === "TimeoutError" || name === "AbortError") {
    return new HttpError(504, `The ${service} timed out. Please try again.`);
  }
  return new HttpError(502, `Could not reach the ${service}. Check your connection.`);
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<unreadable body>";
  }
}
