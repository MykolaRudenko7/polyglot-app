const REQUEST_TIMEOUT_MS = 35_000;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw new Error("Network error. Check your connection and try again.");
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed. Please try again."
    );
  }

  return data as T;
}

export async function requestTranslation(text: string, targetLang: string): Promise<string> {
  const { translation } = await postJson<{ translation: string }>("/api/translate", {
    text,
    targetLang,
  });
  return translation;
}

export async function requestCorrection(text: string): Promise<string> {
  const { corrected } = await postJson<{ corrected: string }>("/api/correct", { text });
  return corrected;
}

export async function requestMeme(): Promise<string> {
  const { meme } = await postJson<{ meme: string }>("/api/meme", {});
  return meme;
}
