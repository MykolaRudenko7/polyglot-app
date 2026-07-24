import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChat } from "./useChat";
import { requestMeme, requestTranslation } from "@/api/apiClient";

vi.mock("@/api/apiClient", () => ({
  requestTranslation: vi.fn(),
  requestMeme: vi.fn(),
}));

const translationMock = vi.mocked(requestTranslation);
const memeMock = vi.mocked(requestMeme);

beforeEach(() => {
  translationMock.mockReset();
  memeMock.mockReset();
});

describe("useChat", () => {
  it("starts with the greeting message", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("system");
  });

  it("adds a user message and a bot reply on send", async () => {
    translationMock.mockResolvedValue("Bonjour");
    const { result } = renderHook(() => useChat());

    await act(() => result.current.send("Hello", "fr"));

    const [, user, bot] = result.current.messages;
    expect(user).toMatchObject({ role: "user", text: "Hello" });
    expect(bot).toMatchObject({ role: "bot", text: "Bonjour" });
    expect(bot.status).toBeUndefined();
  });

  it("shows a loading bot message while the request is pending", async () => {
    let resolveTranslation: (value: string) => void = () => undefined;
    translationMock.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveTranslation = resolve;
      })
    );
    const { result } = renderHook(() => useChat());

    let pending: Promise<void>;
    act(() => {
      pending = result.current.send("Hello", "fr");
    });

    expect(result.current.messages[2]).toMatchObject({ role: "bot", status: "loading" });

    resolveTranslation("Bonjour");
    await act(() => pending);
    expect(result.current.messages[2]).toMatchObject({ text: "Bonjour" });
  });

  it("marks the bot message as an error when translation fails", async () => {
    translationMock.mockRejectedValue(new Error("Rate limit reached."));
    const { result } = renderHook(() => useChat());

    await act(() => result.current.send("Hello", "fr"));

    expect(result.current.messages[2]).toMatchObject({
      role: "bot",
      status: "error",
      text: "Rate limit reached.",
    });
  });

  it("ignores blank input", async () => {
    const { result } = renderHook(() => useChat());
    await act(() => result.current.send("   ", "fr"));
    expect(result.current.messages).toHaveLength(1);
    expect(translationMock).not.toHaveBeenCalled();
  });

  it("attaches a meme card to the requested bot message", async () => {
    translationMock.mockResolvedValue("Bonjour");
    memeMock.mockResolvedValue({ imageUrl: "https://x/m.png", topText: "TOP" });
    const { result } = renderHook(() => useChat());

    await act(() => result.current.send("Hello", "fr"));
    const botId = result.current.messages[2].id;
    await act(() => result.current.addMeme(botId, "Bonjour"));

    await waitFor(() => {
      expect(result.current.messages[2].meme).toEqual({
        imageUrl: "https://x/m.png",
        topText: "TOP",
      });
    });
    expect(memeMock).toHaveBeenCalledWith("Bonjour");
  });

  it("resets the conversation back to the greeting", async () => {
    translationMock.mockResolvedValue("Bonjour");
    const { result } = renderHook(() => useChat());

    await act(() => result.current.send("Hello", "fr"));
    expect(result.current.messages.length).toBeGreaterThan(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("system");
  });

  it("records a meme error on the message without dropping the translation", async () => {
    translationMock.mockResolvedValue("Bonjour");
    memeMock.mockRejectedValue(new Error("Meme service down."));
    const { result } = renderHook(() => useChat());

    await act(() => result.current.send("Hello", "fr"));
    const botId = result.current.messages[2].id;
    await act(() => result.current.addMeme(botId, "Bonjour"));

    expect(result.current.messages[2]).toMatchObject({
      text: "Bonjour",
      memeStatus: "error",
      memeError: "Meme service down.",
    });
  });
});
