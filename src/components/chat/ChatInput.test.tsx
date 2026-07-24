import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "./ChatInput";

function renderInput(overrides: Partial<Parameters<typeof ChatInput>[0]> = {}) {
  const props = {
    text: "",
    onTextChange: vi.fn(),
    suggestion: null as string | null,
    onApplySuggestion: vi.fn(),
    onSend: vi.fn(),
    ...overrides,
  };
  render(<ChatInput {...props} />);
  return props;
}

describe("ChatInput", () => {
  it("disables the send button when the text is blank", () => {
    renderInput({ text: "   " });
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends on button click", async () => {
    const user = userEvent.setup();
    const props = renderInput({ text: "Hello" });

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(props.onSend).toHaveBeenCalledTimes(1);
  });

  it("sends on Enter", async () => {
    const user = userEvent.setup();
    const props = renderInput({ text: "Hello" });

    await user.type(screen.getByRole("textbox", { name: "Text to translate" }), "{Enter}");

    expect(props.onSend).toHaveBeenCalledTimes(1);
  });

  it("shows the suggestion and applies it on click", async () => {
    const user = userEvent.setup();
    const props = renderInput({ text: "fixd", suggestion: "fixed" });

    await user.click(screen.getByText("fixed"));

    expect(props.onApplySuggestion).toHaveBeenCalledTimes(1);
  });

  it("hides the suggestion block when there is none", () => {
    renderInput({ text: "hello" });
    expect(screen.queryByText(/did you mean/i)).not.toBeInTheDocument();
  });
});
