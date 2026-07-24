import { useState } from "react";
import { requestMeme, requestTranslation, type MemeCard } from "@/api/apiClient";

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "bot";
  text?: string;
  status?: "loading" | "error";
  meme?: MemeCard;
  memeStatus?: "loading" | "error";
  memeError?: string;
}

const GREETING: ChatMessage = {
  id: "greeting",
  role: "system",
  text: "Select a language, type your text and hit send! 👇",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);

  function patch(id: string, changes: Partial<ChatMessage>) {
    setMessages((prev) =>
      prev.map((message) => (message.id === id ? { ...message, ...changes } : message))
    );
  }

  async function send(text: string, targetLang: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const botId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
      { id: botId, role: "bot", status: "loading" },
    ]);

    try {
      const translation = await requestTranslation(trimmed, targetLang);
      patch(botId, { text: translation, status: undefined });
    } catch (err) {
      patch(botId, {
        text: err instanceof Error ? err.message : "Translation failed.",
        status: "error",
      });
    }
  }

  async function addMeme(botId: string, text: string): Promise<void> {
    patch(botId, { memeStatus: "loading", memeError: undefined });
    try {
      const meme = await requestMeme(text);
      patch(botId, { meme, memeStatus: undefined });
    } catch (err) {
      patch(botId, {
        memeStatus: "error",
        memeError: err instanceof Error ? err.message : "Meme fetch failed.",
      });
    }
  }

  return { messages, send, addMeme };
}
