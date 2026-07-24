import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "@/hooks/useChat";

function makeMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return { id: "m1", role: "bot", text: "Bonjour", ...overrides };
}

describe("MessageBubble", () => {
  it("renders the message text", () => {
    render(<MessageBubble message={makeMessage({})} onIllustrate={vi.fn()} />);
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
  });

  it("shows a typing indicator while loading", () => {
    render(
      <MessageBubble
        message={makeMessage({ status: "loading", text: undefined })}
        onIllustrate={vi.fn()}
      />
    );
    expect(screen.getByRole("status", { name: "Translating" })).toBeInTheDocument();
  });

  it("offers a meme button on completed bot messages", async () => {
    const user = userEvent.setup();
    const onIllustrate = vi.fn();
    render(<MessageBubble message={makeMessage({})} onIllustrate={onIllustrate} />);

    await user.click(screen.getByRole("button", { name: /meme it/i }));

    expect(onIllustrate).toHaveBeenCalledWith("m1", "Bonjour");
  });

  it("does not offer a meme button on user messages", () => {
    render(<MessageBubble message={makeMessage({ role: "user" })} onIllustrate={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the meme with its captions instead of the button", () => {
    render(
      <MessageBubble
        message={makeMessage({
          meme: { imageUrl: "https://x/m.png", topText: "коли п'ятниця", bottomText: "нарешті" },
        })}
        onIllustrate={vi.fn()}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://x/m.png");
    expect(screen.getByText("коли п'ятниця")).toBeInTheDocument();
    expect(screen.getByText("нарешті")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the meme error next to the retry button", () => {
    render(
      <MessageBubble
        message={makeMessage({ memeStatus: "error", memeError: "Meme service down." })}
        onIllustrate={vi.fn()}
      />
    );
    expect(screen.getByText("Meme service down.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /meme it/i })).toBeInTheDocument();
  });
});
