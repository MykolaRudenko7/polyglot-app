import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { translate, HttpError } from "./api/_core";

function devApiPlugin(env: Record<string, string>): PluginOption {
  process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL;

  return {
    name: "dev-api-translate",
    configureServer(server) {
      server.middlewares.use("/api/translate", (req, res) => {
        void handleTranslate(req, res);
      });
    },
  };
}

async function handleTranslate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  try {
    const { text, targetLang } = await readJson(req);
    const translation = await translate(text, targetLang);
    res.end(JSON.stringify({ translation }));
  } catch (err) {
    res.statusCode = err instanceof HttpError ? err.status : 500;
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Translation failed." }));
  }
}

function readJson(req: IncomingMessage): Promise<{ text?: string; targetLang?: string }> {
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
          text: typeof record.text === "string" ? record.text : undefined,
          targetLang: typeof record.targetLang === "string" ? record.targetLang : undefined,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
