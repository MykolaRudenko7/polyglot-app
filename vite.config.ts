import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { translate, correct, fetchMeme, HttpError } from "./api/_core.js";

interface RequestBody {
  text?: string;
  targetLang?: string;
  prompt?: string;
}

type RouteHandler = (body: RequestBody) => Promise<Record<string, unknown>>;

const routes: Record<string, RouteHandler> = {
  "/api/translate": async (body) => ({ translation: await translate(body.text, body.targetLang) }),
  "/api/correct": async (body) => ({ corrected: await correct(body.text) }),
  "/api/meme": async () => ({ meme: await fetchMeme() }),
};

function devApiPlugin(env: Record<string, string>): PluginOption {
  if (env.OPENROUTER_API_KEY) process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  if (env.OPENROUTER_MODEL) process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL;

  return {
    name: "dev-api",
    configureServer(server) {
      for (const [route, handler] of Object.entries(routes)) {
        server.middlewares.use(route, (req, res) => {
          void handleRequest(req, res, handler);
        });
      }
    },
  };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  handler: RouteHandler
): Promise<void> {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  try {
    const result = await handler(await readJson(req));
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = err instanceof HttpError ? err.status : 500;
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Request failed." }));
  }
}

function readJson(req: IncomingMessage): Promise<RequestBody> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on("end", () => {
      try {
        const raw: unknown = data ? JSON.parse(data) : {};
        const record = isRecord(raw) ? raw : {};
        resolve({
          text: asString(record.text),
          targetLang: asString(record.targetLang),
          prompt: asString(record.prompt),
        });
      } catch {
        reject(new HttpError(400, "Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), devApiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
    },
  };
});
