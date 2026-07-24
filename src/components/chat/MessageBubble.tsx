import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/hooks/useChat";

interface MessageBubbleProps {
  message: ChatMessage;
  onIllustrate: (id: string) => void;
}

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
          <ImageSection message={message} onIllustrate={onIllustrate} />
        )}
      </div>
    </div>
  );
}

function ImageSection({ message, onIllustrate }: MessageBubbleProps) {
  if (message.imageUrl) {
    return (
      <img
        src={message.imageUrl}
        alt="A meme from the internet"
        className="mt-2 w-full max-w-[240px] rounded-lg"
      />
    );
  }

  if (message.imageStatus === "loading") {
    return (
      <Skeleton className="shimmer-line !animate-shimmer mt-2 aspect-square w-[160px] rounded-lg" />
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => onIllustrate(message.id)}
        className="inline-flex items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-sm font-semibold transition hover:bg-white/30"
      >
        <ImageIcon className="size-4" />
        Meme it 😂
      </button>
      {message.imageStatus === "error" && (
        <p className="mt-1 text-xs font-medium text-white/90">{message.imageError}</p>
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
