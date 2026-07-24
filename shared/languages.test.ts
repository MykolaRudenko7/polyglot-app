import { describe, expect, it } from "vitest";
import { LANGUAGES, LANGUAGE_NAMES } from "./languages";

describe("languages", () => {
  it("has unique codes", () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("derives LANGUAGE_NAMES from LANGUAGES", () => {
    for (const { code, name } of LANGUAGES) {
      expect(LANGUAGE_NAMES[code]).toBe(name);
    }
  });
});
