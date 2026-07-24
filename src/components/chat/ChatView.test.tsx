import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatView } from "./ChatView";
import { requestTranslation } from "@/api/apiClient";

vi.mock("@/api/apiClient", () => ({
  requestTranslation: vi.fn(),
  requestCorrection: vi.fn().mockResolvedValue(""),
  requestMeme: vi.fn(),
}));

const translationMock = vi.mocked(requestTranslation);

beforeEach(() => {
  translationMock.mockReset();
});

describe("ChatView", () => {
  it("shows the greeting on start", () => {
    render(<ChatView />);
    expect(screen.getByText(/select a language/i)).toBeInTheDocument();
  });

  it("sends the typed text and renders the translation", async () => {
    const user = userEvent.setup();
    translationMock.mockResolvedValue("Bonjour tout le monde");
    render(<ChatView />);

    await user.type(
      screen.getByRole("textbox", { name: "Text to translate" }),
      "Hello everyone out there"
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("Hello everyone out there")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Bonjour tout le monde")).toBeInTheDocument();
    });
    expect(translationMock).toHaveBeenCalledWith("Hello everyone out there", "fr");
  });

  it("clears the input after sending", async () => {
    const user = userEvent.setup();
    translationMock.mockResolvedValue("Bonjour");
    render(<ChatView />);

    const input = screen.getByRole("textbox", { name: "Text to translate" });
    await user.type(input, "Hello everyone out there");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(input).toHaveValue("");
  });

  it("renders the error text in the bot bubble when translation fails", async () => {
    const user = userEvent.setup();
    translationMock.mockRejectedValue(new Error("Rate limit reached."));
    render(<ChatView />);

    await user.type(
      screen.getByRole("textbox", { name: "Text to translate" }),
      "Hello everyone out there"
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Rate limit reached.")).toBeInTheDocument();
    });
  });

  it("disables the detected input language in the language bar", async () => {
    const user = userEvent.setup();
    render(<ChatView />);

    await user.type(
      screen.getByRole("textbox", { name: "Text to translate" }),
      "Привіт, як твої справи сьогодні?"
    );

    expect(screen.getByRole("button", { name: "Translate to Ukrainian" })).toBeDisabled();
  });

  it("switches away from a language that becomes the detected input", async () => {
    const user = userEvent.setup();
    translationMock.mockResolvedValue("Hello");
    render(<ChatView />);

    await user.click(screen.getByRole("button", { name: "Translate to Ukrainian" }));
    await user.type(
      screen.getByRole("textbox", { name: "Text to translate" }),
      "Привіт, як твої справи сьогодні?"
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(translationMock).toHaveBeenCalled();
    });
    expect(translationMock.mock.calls[0][1]).not.toBe("uk");
  });
});
