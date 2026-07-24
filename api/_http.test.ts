import { describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handlePost, parseBody } from "./_http.js";
import { HttpError } from "./_core.js";

interface RecordedResponse {
  res: VercelResponse;
  statusCode: () => number | undefined;
  jsonBody: () => unknown;
}

function makeRes(): RecordedResponse {
  let code: number | undefined;
  let body: unknown;
  const res = {
    setHeader: vi.fn(),
    status(next: number) {
      code = next;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as VercelResponse;
  return { res, statusCode: () => code, jsonBody: () => body };
}

function makeReq(method: string, body?: unknown): VercelRequest {
  return { method, body } as unknown as VercelRequest;
}

describe("parseBody", () => {
  it("passes through an object body", () => {
    expect(parseBody({ text: "hi" })).toEqual({ text: "hi" });
  });

  it("parses a JSON string body", () => {
    expect(parseBody('{"text":"hi"}')).toEqual({ text: "hi" });
  });

  it("returns an empty object for malformed JSON strings", () => {
    expect(parseBody("not json")).toEqual({});
  });

  it("returns an empty object for null and non-objects", () => {
    expect(parseBody(null)).toEqual({});
    expect(parseBody(42)).toEqual({});
  });
});

describe("handlePost", () => {
  it("rejects non-POST methods with 405", async () => {
    const { res, statusCode, jsonBody } = makeRes();
    await handlePost(makeReq("GET"), res, () => Promise.resolve({}));
    expect(statusCode()).toBe(405);
    expect(jsonBody()).toEqual({ error: "Method not allowed" });
  });

  it("returns the handler result with 200", async () => {
    const { res, statusCode, jsonBody } = makeRes();
    await handlePost(makeReq("POST", { text: "hi" }), res, (body) =>
      Promise.resolve({ echoed: body.text })
    );
    expect(statusCode()).toBe(200);
    expect(jsonBody()).toEqual({ echoed: "hi" });
  });

  it("returns 400 when reading the body throws", async () => {
    const { res, statusCode, jsonBody } = makeRes();
    const req = {
      method: "POST",
      get body(): unknown {
        throw new Error("invalid json");
      },
    } as unknown as VercelRequest;
    await handlePost(req, res, () => Promise.resolve({}));
    expect(statusCode()).toBe(400);
    expect(jsonBody()).toEqual({ error: "Invalid JSON body." });
  });

  it("maps HttpError to its status and message", async () => {
    const { res, statusCode, jsonBody } = makeRes();
    await handlePost(makeReq("POST", {}), res, () =>
      Promise.reject(new HttpError(429, "Slow down."))
    );
    expect(statusCode()).toBe(429);
    expect(jsonBody()).toEqual({ error: "Slow down." });
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { res, statusCode, jsonBody } = makeRes();
    await handlePost(makeReq("POST", {}), res, () => Promise.reject(new Error("secret detail")));
    expect(statusCode()).toBe(500);
    expect(JSON.stringify(jsonBody())).not.toContain("secret detail");
    consoleSpy.mockRestore();
  });
});
