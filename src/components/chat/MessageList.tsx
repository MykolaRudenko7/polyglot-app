import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { ChatMessage } from "@/hooks/useChat";

interface MessageListProps {
  messages: ChatMessage[];
  onIllustrate: (id: string) => void;
}

export function MessageList({ messages, onIllustrate }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onIllustrate={onIllustrate} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
