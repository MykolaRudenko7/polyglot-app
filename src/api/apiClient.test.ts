import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestTranslation, requestCorrection, requestMeme } from "./apiClient";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("requestTranslation", () => {
  it("posts text and language and returns the translation", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ translation: "Bonjour" }));
    await expect(requestTranslation("Hello", "fr")).resolves.toBe("Bonjour");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/translate");
    expect(JSON.parse(init?.body as string)).toEqual({ text: "Hello", targetLang: "fr" });
  });

  it("surfaces the server's error message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Rate limit reached." }, 429));
    await expect(requestTranslation("Hello", "fr")).rejects.toThrow("Rate limit reached.");
  });

  it("gives a generic message when the response is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("A server error", { status: 500 }));
    await expect(requestTranslation("Hello", "fr")).rejects.toThrow(
      "Request failed. Please try again."
    );
  });

  it("maps timeouts to a friendly message", async () => {
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    fetchMock.mockRejectedValue(timeout);
    await expect(requestTranslation("Hello", "fr")).rejects.toThrow(
      "The request timed out. Please try again."
    );
  });

  it("maps network failures to a friendly message", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(requestTranslation("Hello", "fr")).rejects.toThrow(
      "Network error. Check your connection and try again."
    );
  });
});

describe("requestCorrection", () => {
  it("returns the corrected text", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ corrected: "Fixed text." }));
    await expect(requestCorrection("fixd text")).resolves.toBe("Fixed text.");
  });
});

describe("requestMeme", () => {
  it("posts the text and returns the meme card", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ imageUrl: "https://x/m.png", topText: "TOP" }));
    await expect(requestMeme("Bonjour")).resolves.toEqual({
      imageUrl: "https://x/m.png",
      topText: "TOP",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/meme");
    expect(JSON.parse(init?.body as string)).toEqual({ text: "Bonjour" });
  });
});
