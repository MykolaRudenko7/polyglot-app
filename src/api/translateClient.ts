const REQUEST_TIMEOUT_MS = 25_000;

interface TranslateResponse {
  translation?: string;
  error?: string;
}

export async function requestTranslation(text: string, targetLang: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/translate", {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang }),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw new Error("Network error. Check your connection and try again.");
  }

  const data = (await res.json().catch(() => ({}))) as TranslateResponse;

  if (!res.ok) {
    throw new Error(data.error || "Translation failed. Please try again.");
  }

  if (!data.translation) {
    throw new Error("Received an empty translation. Please try again.");
  }

  return data.translation;
}
