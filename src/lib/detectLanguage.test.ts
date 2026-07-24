import { describe, expect, it } from "vitest";
import { detectLanguageCode } from "./detectLanguage";

describe("detectLanguageCode", () => {
  it("returns null for empty or very short text", () => {
    expect(detectLanguageCode("")).toBeNull();
    expect(detectLanguageCode(" a ")).toBeNull();
  });

  it("detects Japanese by script", () => {
    expect(detectLanguageCode("こんにちは、お元気ですか")).toBe("ja");
  });

  it("detects Ukrainian by characteristic letters", () => {
    expect(detectLanguageCode("Привіт, як твої справи сьогодні?")).toBe("uk");
  });

  it("detects English", () => {
    expect(detectLanguageCode("Good morning everyone, I hope you are all doing well today")).toBe(
      "en"
    );
  });

  it("returns null for short ambiguous text instead of guessing", () => {
    expect(detectLanguageCode("Good morning, how are you doing today my friend?")).toBeNull();
  });

  it("detects French", () => {
    expect(detectLanguageCode("Bonjour, comment allez-vous aujourd'hui mes amis ?")).toBe("fr");
  });

  it("detects Spanish", () => {
    expect(detectLanguageCode("Buenos días, ¿cómo estás hoy amigo mío?")).toBe("es");
  });

  it("returns null for languages outside the supported set", () => {
    expect(detectLanguageCode("Guten Morgen, wie geht es dir heute mein Freund?")).toBeNull();
  });
});
