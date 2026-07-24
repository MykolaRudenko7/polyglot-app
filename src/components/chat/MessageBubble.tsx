import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/hooks/useChat";

interface MessageBubbleProps {
  message: ChatMessage;
  onIllustrate: (id: string, text: string) => void;
}

const CAPTION_CLASS =
  "absolute inset-x-1 text-center font-['Impact','Arial_Black',sans-serif] text-lg leading-tight tracking-wide text-white uppercase [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]";

export function MessageBubble({ message, onIllustrate }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "animate-fade-in max-w-[85%] rounded-2xl px-3.5 py-2.5 text-base font-semibold",
          isUser
            ? "bg-brand-green rounded-br-sm text-[#0d182e]"
            : "bg-blue rounded-bl-sm text-white"
        )}
      >
        {message.status === "loading" ? (
          <TypingDots />
        ) : (
          <span className="whitespace-pre-wrap">{message.text}</span>
        )}

        {message.role === "bot" && message.status !== "loading" && message.status !== "error" && (
          <MemeSection message={message} onIllustrate={onIllustrate} />
        )}
      </div>
    </div>
  );
}

function MemeSection({ message, onIllustrate }: MessageBubbleProps) {
  if (message.meme) {
    return (
      <div className="relative mt-2 w-full max-w-[260px] overflow-hidden rounded-lg">
        <img
          src={message.meme.imageUrl}
          alt="Meme illustrating the translation"
          className="w-full"
        />
        {message.meme.topText && (
          <span className={cn(CAPTION_CLASS, "top-1")}>{message.meme.topText}</span>
        )}
        {message.meme.bottomText && (
          <span className={cn(CAPTION_CLASS, "bottom-1")}>{message.meme.bottomText}</span>
        )}
      </div>
    );
  }

  if (message.memeStatus === "loading") {
    return (
      <Skeleton className="shimmer-line !animate-shimmer mt-2 aspect-square w-[180px] rounded-lg" />
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => onIllustrate(message.id, message.text ?? "")}
        className="inline-flex items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-sm font-semibold transition hover:bg-white/30"
      >
        <ImageIcon className="size-4" />
        Meme it 😂
      </button>
      {message.memeStatus === "error" && (
        <p className="mt-1 text-xs font-medium text-white/90">{message.memeError}</p>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1" role="status" aria-label="Translating">
      <span className="size-2 animate-bounce rounded-full bg-white/80" />
      <span className="size-2 animate-bounce rounded-full bg-white/80 [animation-delay:150ms]" />
      <span className="size-2 animate-bounce rounded-full bg-white/80 [animation-delay:300ms]" />
    </span>
  );
}
