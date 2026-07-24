# PollyGlot 🦜

AI translator with a chat interface. Type a phrase, pick a target language (French, Spanish, Japanese, Ukrainian, or English), and get the translation as a chat reply — with live typo correction while you type and a "Meme it" button that matches a meme to the translated phrase. The OpenRouter API key stays server-side and never reaches the browser.

Live: https://polyglot-app-fawn.vercel.app

## Features

- **Chat translation** — messages as bubbles, typing indicator, auto-scroll
- **Language auto-detection** — the language you typed in gets disabled as a target, and the selection switches away automatically
- **Live correction** — debounced "Did you mean:" suggestion while typing
- **Memes** — a language model picks a fitting template and writes captions in the phrase's language; falls back to a random safe meme
- **Model fallback chain** — free models are tried in order when one is rate-limited
- **Error handling** — timeouts, rate limits, and network failures all surface as friendly messages in the chat

## Stack

- **Vite + React 19 + TypeScript** (strict)
- **Tailwind CSS v4** + shadcn/ui primitives
- **OpenRouter** (OpenAI-compatible) called from serverless functions
- **Vitest + Testing Library** — 82 tests across API, hooks, and components
- **ESLint 9** (type-checked) + **Prettier** + **GitHub Actions CI**

## Architecture

```
Browser (src/)                     Server — Node, key lives here
─────────────                      ─────────────────────────────
apiClient.ts                       api/translate.ts ─┐
  ├─ POST /api/translate  ───►     api/correct.ts   ─┤ Vercel Serverless Functions
  ├─ POST /api/correct    ───►     api/meme.ts      ─┘ (dev: vite.config.ts middleware)
  └─ POST /api/meme       ───►       └─ api/_core.ts → OpenRouter / meme-api
```

The browser only talks to its own `/api/*` endpoints. No API key, no SDK, no `dangerouslyAllowBrowser` in the client bundle.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your key
npm run dev                  # http://localhost:5173
```

Get a key at https://openrouter.ai/keys and set it in `.env.local`:

```
OPENROUTER_API_KEY=sk-or-...
```

Free-tier limits: 20 requests/min, 50/day (1000/day after a one-time $10 top-up). The daily cap is account-wide; the fallback chain helps with per-model congestion.

## Scripts

```bash
npm run dev           # dev server (frontend + /api middleware)
npm run build         # tsc --noEmit && vite build
npm test              # vitest run
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run format        # prettier --write .
```

## Deploy

Pushes to `main` run CI (format, lint, typecheck, tests, build) via GitHub Actions and auto-deploy on Vercel. Set **`OPENROUTER_API_KEY`** in the Vercel project's Environment Variables.
