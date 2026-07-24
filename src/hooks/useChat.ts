import { useState } from "react";
import { requestMeme, requestTranslation } from "@/api/apiClient";

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "bot";
  text?: string;
  status?: "loading" | "error";
  imageUrl?: string;
  imageStatus?: "loading" | "error";
  imageError?: string;
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

  async function addMeme(botId: string): Promise<void> {
    patch(botId, { imageStatus: "loading", imageError: undefined });
    try {
      const imageUrl = await requestMeme();
      patch(botId, { imageUrl, imageStatus: undefined });
    } catch (err) {
      patch(botId, {
        imageStatus: "error",
        imageError: err instanceof Error ? err.message : "Meme fetch failed.",
      });
    }
  }

  return { messages, send, addMeme };
}
