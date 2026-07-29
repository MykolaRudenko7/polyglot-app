import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetCorrectionCache, useCorrection } from "./useCorrection";
import { requestCorrection } from "@/api/apiClient";

vi.mock("@/api/apiClient", () => ({
  requestCorrection: vi.fn(),
}));

const correctionMock = vi.mocked(requestCorrection);

beforeEach(() => {
  vi.useFakeTimers();
  correctionMock.mockReset();
  resetCorrectionCache();
});

afterEach(() => {
  vi.useRealTimers();
});

async function flushDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}

describe("useCorrection", () => {
  it("does not request corrections for short text", async () => {
    renderHook(() => useCorrection("hi"));
    await flushDebounce();
    expect(correctionMock).not.toHaveBeenCalled();
  });

  it("suggests the corrected text after the debounce", async () => {
    correctionMock.mockResolvedValue("I went to the store.");
    const { result } = renderHook(() => useCorrection("i has went to the stor"));

    await flushDebounce();

    expect(result.current).toBe("I went to the store.");
  });

  it("returns null when the text is already correct", async () => {
    correctionMock.mockResolvedValue("All good here.");
    const { result } = renderHook(() => useCorrection("All good here."));

    await flushDebounce();

    expect(result.current).toBeNull();
  });

  it("debounces rapid typing into a single request", async () => {
    correctionMock.mockResolvedValue("typed text");
    const { rerender } = renderHook(({ text }) => useCorrection(text), {
      initialProps: { text: "typing te" },
    });

    rerender({ text: "typing tex" });
    rerender({ text: "typed text!" });
    await flushDebounce();

    expect(correctionMock).toHaveBeenCalledTimes(1);
    expect(correctionMock).toHaveBeenCalledWith("typed text!");
  });

  it("does not re-check text that matches the applied suggestion", async () => {
    correctionMock.mockResolvedValue("Fixed sentence.");
    const { result, rerender } = renderHook(({ text }) => useCorrection(text), {
      initialProps: { text: "fixd sentense" },
    });

    await flushDebounce();
    expect(result.current).toBe("Fixed sentence.");

    rerender({ text: "Fixed sentence." });
    await flushDebounce();

    expect(correctionMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();
  });

  it("stays silent when the correction request fails", async () => {
    correctionMock.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useCorrection("some broken text"));

    await flushDebounce();

    expect(result.current).toBeNull();
  });

  it("reuses a cached verdict instead of spending a second request", async () => {
    correctionMock.mockResolvedValue("Corrected text.");
    const { result, rerender } = renderHook(({ text }) => useCorrection(text), {
      initialProps: { text: "corrcted text" },
    });

    await flushDebounce();
    expect(result.current).toBe("Corrected text.");

    // Typing something else, then coming back to the exact same input.
    rerender({ text: "unrelated words" });
    rerender({ text: "corrcted text" });
    await flushDebounce();

    expect(correctionMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe("Corrected text.");
  });

  it("answers from cache without waiting for the debounce", async () => {
    correctionMock.mockResolvedValue("Fixed now.");
    const { rerender } = renderHook(({ text }) => useCorrection(text), {
      initialProps: { text: "fixd now" },
    });
    await flushDebounce();

    const { result } = renderHook(() => useCorrection("fixd now"));

    expect(result.current).toBe("Fixed now.");
    expect(correctionMock).toHaveBeenCalledTimes(1);
    rerender({ text: "fixd now" });
  });

  it("does not cache failures, so a later attempt can still succeed", async () => {
    correctionMock.mockRejectedValueOnce(new Error("offline"));
    const { result, rerender } = renderHook(({ text }) => useCorrection(text), {
      initialProps: { text: "flaky sentense" },
    });
    await flushDebounce();
    expect(result.current).toBeNull();

    correctionMock.mockResolvedValue("Flaky sentence.");
    rerender({ text: "other text here" });
    rerender({ text: "flaky sentense" });
    await flushDebounce();

    expect(result.current).toBe("Flaky sentence.");
  });
});
