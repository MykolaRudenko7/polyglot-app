import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageBar } from "./LanguageBar";
import { LANGUAGES } from "../../../shared/languages";

function renderBar(overrides: Partial<Parameters<typeof LanguageBar>[0]> = {}) {
  const props = {
    lang: "fr",
    onSelect: vi.fn(),
    disabledCode: null as string | null,
    onReset: vi.fn(),
    ...overrides,
  };
  render(<LanguageBar {...props} />);
  return props;
}

describe("LanguageBar", () => {
  it("renders a button per language plus the clear button", () => {
    renderBar();
    expect(screen.getAllByRole("button")).toHaveLength(LANGUAGES.length + 1);
  });

  it("clears the chat via the clear button", async () => {
    const user = userEvent.setup();
    const props = renderBar();

    await user.click(screen.getByRole("button", { name: "Clear chat" }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it("marks the active language as pressed", () => {
    renderBar({ lang: "es" });
    expect(screen.getByRole("button", { name: "Translate to Spanish" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Translate to French" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("selects a language on click", async () => {
    const user = userEvent.setup();
    const props = renderBar();

    await user.click(screen.getByRole("button", { name: "Translate to Japanese" }));

    expect(props.onSelect).toHaveBeenCalledWith("ja");
  });

  it("disables the detected input language", () => {
    renderBar({ disabledCode: "uk" });
    expect(screen.getByRole("button", { name: "Translate to Ukrainian" })).toBeDisabled();
  });
});
