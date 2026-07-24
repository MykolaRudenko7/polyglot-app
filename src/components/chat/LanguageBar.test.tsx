import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageBar } from "./LanguageBar";
import { LANGUAGES } from "../../../shared/languages";

describe("LanguageBar", () => {
  it("renders a button per language", () => {
    render(<LanguageBar lang="fr" onSelect={vi.fn()} disabledCode={null} />);
    expect(screen.getAllByRole("button")).toHaveLength(LANGUAGES.length);
  });

  it("marks the active language as pressed", () => {
    render(<LanguageBar lang="es" onSelect={vi.fn()} disabledCode={null} />);
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
    const onSelect = vi.fn();
    render(<LanguageBar lang="fr" onSelect={onSelect} disabledCode={null} />);

    await user.click(screen.getByRole("button", { name: "Translate to Japanese" }));

    expect(onSelect).toHaveBeenCalledWith("ja");
  });

  it("disables the detected input language", () => {
    render(<LanguageBar lang="fr" onSelect={vi.fn()} disabledCode="uk" />);
    expect(screen.getByRole("button", { name: "Translate to Ukrainian" })).toBeDisabled();
  });
});
