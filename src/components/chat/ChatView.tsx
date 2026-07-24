import { useState } from "react";
import { detectLanguageCode } from "@/lib/detectLanguage";
import { useChat } from "@/hooks/useChat";
import { useCorrection } from "@/hooks/useCorrection";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { LanguageBar } from "@/components/chat/LanguageBar";
import { LANGUAGES } from "../../../shared/languages";

const DEFAULT_LANG = LANGUAGES[0].code;

export function ChatView() {
  const { messages, send, addMeme } = useChat();
  const [text, setText] = useState("");
  const [lang, setLang] = useState(DEFAULT_LANG);
  const suggestion = useCorrection(text);
  const detectedCode = detectLanguageCode(text);

  function handleTextChange(value: string) {
    setText(value);
    const detected = detectLanguageCode(value);
    if (detected && detected === lang) {
      const fallback = LANGUAGES.find((language) => language.code !== detected);
      if (fallback) setLang(fallback.code);
    }
  }

  function handleSend() {
    if (!text.trim()) return;
    void send(text, lang);
    setText("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList
        messages={messages}
        onIllustrate={(id, text) => {
          void addMeme(id, text);
        }}
      />
      <ChatInput
        text={text}
        onTextChange={handleTextChange}
        suggestion={suggestion}
        onApplySuggestion={() => {
          setText(suggestion ?? "");
        }}
        onSend={handleSend}
      />
      <LanguageBar lang={lang} onSelect={setLang} disabledCode={detectedCode} />
    </div>
  );
}
