# PollyGlot 🦜

AI translator (solo project). Single-screen app that translates text into French, Spanish, or Japanese via an OpenAI-compatible model on OpenRouter. The API key stays server-side and never reaches the browser.

## Stack

- **Vite + React 19 + TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **OpenRouter** (OpenAI-compatible) called from a serverless function
- **ESLint 9** flat config (typescript-eslint type-checked, react-hooks, jsx-a11y)

## Architecture

```
Browser (src/)                     Server — Node, key lives here
─────────────                      ─────────────────────────────
requestTranslation()               api/translate.ts   ← Vercel Serverless Function (prod)
  └─ POST /api/translate  ───►     vite.config.ts middleware ← local dev
        { text, targetLang }         └─ api/_core.ts → fetch OpenRouter (Bearer KEY)
  ◄─── { translation }
```

The browser only talks to its own `/api/translate`. No API key, no SDK, no `dangerouslyAllowBrowser` in the client bundle.

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

## Model

Configurable via env — no code change needed:

```
OPENROUTER_MODEL=google/gemma-4-31b-it:free   # default
# openai/gpt-oss-20b:free                      # free alternative
# openai/gpt-5-mini                            # paid, higher quality
```

Free tier limits: 20 requests/min, 50/day (1000/day after a one-time $10 top-up).

## Scripts

```bash
npm run dev        # dev server (frontend + /api middleware)
npm run build      # tsc --noEmit && vite build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it on https://vercel.com/new — Vercel auto-detects Vite and the `api/` function.
3. Add the environment variable **`OPENROUTER_API_KEY`** in Project → Settings → Environment Variables.
4. Deploy. `dist/` is served statically; `api/translate.ts` runs as a serverless function.

## Assets

The parrot logo and country flags currently use emoji placeholders. To match the
Figma design pixel-for-pixel, export the raster assets from the Figma file and
drop them into `public/assets/`, then swap the emoji `<span>`s for `<img>` tags
in `src/components/Header.tsx` and `src/components/TranslatorForm.tsx`.
