import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { translate, correct, fetchMeme, makeMeme, HttpError } from "./_core.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function chatCompletion(content: string): Response {
  return jsonResponse({ choices: [{ message: { content } }] });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test");
  vi.stubEnv("OPENROUTER_MODEL", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("translate", () => {
  it("returns the trimmed completion text", async () => {
    fetchMock.mockResolvedValue(chatCompletion("  Bonjour !  "));
    await expect(translate("Hello!", "fr")).resolves.toBe("Bonjour !");
  });

  it("rejects empty text with 400", async () => {
    await expect(translate("   ", "fr")).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported language with 400", async () => {
    await expect(translate("Hello", "zz")).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails with 500 when the API key is missing", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(translate("Hello", "fr")).rejects.toMatchObject({ status: 500 });
  });

  it("sends a fallback model chain", async () => {
    fetchMock.mockResolvedValue(chatCompletion("Hola"));
    await translate("Hello", "es");

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      model: string;
      models: string[];
    };
    expect(body.models.length).toBeGreaterThan(1);
    expect(body.model).toBe(body.models[0]);
  });

  it("puts the OPENROUTER_MODEL override first in the chain", async () => {
    vi.stubEnv("OPENROUTER_MODEL", "custom/model");
    fetchMock.mockResolvedValue(chatCompletion("Hola"));
    await translate("Hello", "es");

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as { models: string[] };
    expect(body.models[0]).toBe("custom/model");
  });

  it("maps upstream 429 to a rate-limit error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "limited" }, 429));
    await expect(translate("Hello", "fr")).rejects.toMatchObject({ status: 429 });
  });

  it("maps upstream 401 to 502 without leaking details", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "bad key" }, 401));
    await expect(translate("Hello", "fr")).rejects.toMatchObject({ status: 502 });
  });

  it("maps a timeout to 504", async () => {
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    fetchMock.mockRejectedValue(timeout);
    await expect(translate("Hello", "fr")).rejects.toMatchObject({ status: 504 });
  });

  it("maps a network failure to 502", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(translate("Hello", "fr")).rejects.toMatchObject({ status: 502 });
  });

  it("rejects an empty completion with 502", async () => {
    fetchMock.mockResolvedValue(chatCompletion(""));
    await expect(translate("Hello", "fr")).rejects.toMatchObject({ status: 502 });
  });
});

describe("correct", () => {
  it("returns the corrected text", async () => {
    fetchMock.mockResolvedValue(chatCompletion("I went to the store."));
    await expect(correct("i has went to the stor")).resolves.toBe("I went to the store.");
  });

  it("returns empty string for empty input without calling the API", async () => {
    await expect(correct("   ")).resolves.toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the original text when the completion is missing", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [] }));
    await expect(correct("hello there")).resolves.toBe("hello there");
  });
});

describe("fetchMeme", () => {
  it("returns the first safe image url", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        memes: [
          { url: "https://x/no.png", nsfw: true },
          { url: "https://x/spoiler.png", spoiler: true },
          { url: "https://x/not-image.mp4" },
          { url: "https://x/good.png" },
        ],
      })
    );
    await expect(fetchMeme()).resolves.toBe("https://x/good.png");
  });

  it("supports the single-meme response shape", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ url: "https://x/single.jpg" }));
    await expect(fetchMeme()).resolves.toBe("https://x/single.jpg");
  });

  it("fails with 502 when no safe meme is found", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ memes: [{ url: "https://x/a.png", nsfw: true }] }));
    await expect(fetchMeme()).rejects.toMatchObject({ status: 502 });
  });

  it("maps upstream failure to 502", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(fetchMeme()).rejects.toBeInstanceOf(HttpError);
  });
});

describe("makeMeme", () => {
  it("returns a captioned template chosen by the model", async () => {
    fetchMock.mockResolvedValueOnce(
      chatCompletion('{"template":"drake","top":"коли субота","bottom":"нарешті вихідні"}')
    );

    await expect(makeMeme("Нарешті вихідні!")).resolves.toEqual({
      imageUrl: "https://i.imgflip.com/30b1gx.jpg",
      topText: "коли субота",
      bottomText: "нарешті вихідні",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to a random meme when the model returns garbage", async () => {
    fetchMock
      .mockResolvedValueOnce(chatCompletion("sorry, no json here"))
      .mockResolvedValueOnce(jsonResponse({ url: "https://x/random.png" }));

    await expect(makeMeme("Hello there")).resolves.toEqual({
      imageUrl: "https://x/random.png",
    });
  });

  it("falls back to a random meme when the model names an unknown template", async () => {
    fetchMock
      .mockResolvedValueOnce(chatCompletion('{"template":"nonexistent","top":"a","bottom":"b"}'))
      .mockResolvedValueOnce(jsonResponse({ url: "https://x/random.png" }));

    await expect(makeMeme("Hello there")).resolves.toEqual({
      imageUrl: "https://x/random.png",
    });
  });

  it("skips the model entirely for empty text", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ url: "https://x/random.png" }));
    await expect(makeMeme("")).resolves.toEqual({ imageUrl: "https://x/random.png" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
