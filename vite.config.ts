import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv, type PluginOption } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { translate, correct, makeMeme, HttpError } from "./api/_core.js";

const pwaPlugin = VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["apple-touch-icon.png"],
  manifest: {
    name: "PollyGlot",
    short_name: "PollyGlot",
    description: "Perfect Translation Every Time",
    theme_color: "#0d182e",
    background_color: "#f4f4f6",
    display: "standalone",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/api\//,
        handler: "NetworkOnly",
      },
    ],
  },
});

interface RequestBody {
  text?: string;
  targetLang?: string;
  prompt?: string;
}

type RouteHandler = (body: RequestBody) => Promise<Record<string, unknown>>;

const routes: Record<string, RouteHandler> = {
  "/api/translate": async (body) => ({ translation: await translate(body.text, body.targetLang) }),
  "/api/correct": async (body) => ({ corrected: await correct(body.text) }),
  "/api/meme": async (body) => ({ ...(await makeMeme(body.text)) }),
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
    plugins: [react(), tailwindcss(), pwaPlugin, devApiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}", "api/**/*.test.ts", "shared/**/*.test.ts"],
    },
  };
});
