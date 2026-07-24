import { type KeyboardEvent } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";

interface ChatInputProps {
  text: string;
  onTextChange: (value: string) => void;
  suggestion: string | null;
  onApplySuggestion: () => void;
  onSend: () => void;
}

export function ChatInput({
  text,
  onTextChange,
  suggestion,
  onApplySuggestion,
  onSend,
}: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="border-t border-[#eee] p-3">
      {suggestion && (
        <button
          type="button"
          onClick={onApplySuggestion}
          className="mb-2 flex w-full items-start gap-1.5 rounded-lg bg-[#f4f7fb] px-3 py-2 text-left text-sm"
        >
          <Sparkles className="text-blue mt-0.5 size-4 shrink-0" />
          <span>
            <span className="text-[#666]">Did you mean: </span>
            <span className="text-blue font-semibold">{suggestion}</span>
          </span>
        </button>
      )}

      <div className="flex items-center gap-2 rounded-full border border-[#ddd] bg-white py-1.5 pr-1.5 pl-4">
        <input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your text…"
          aria-label="Text to translate"
          className="min-w-0 flex-1 bg-transparent text-base font-medium text-[#333] outline-none"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!text.trim()}
          aria-label="Send"
          className="bg-brand-green grid size-9 shrink-0 place-content-center rounded-full text-white transition hover:brightness-105 disabled:opacity-40"
        >
          <SendHorizontal className="size-5" />
        </button>
      </div>
    </div>
  );
}
