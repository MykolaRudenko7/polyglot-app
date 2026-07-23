# PollyGlot — Специфікація проєкту

AI-перекладач (solo-проєкт). Одна картка-екран за дизайном з Figma, переклад через OpenAI-сумісний API з прихованим ключем.

---

## 1. TL;DR — рішення по стеку

**Рекомендація: Vite + React + одна serverless-функція на Vercel (`/api/translate`).**

Не Next.js 16. Причина коротко: застосунок — це **один екран** (форма → результат, або чат). Весь важіль Next.js (SSR, App Router, PPR, Cache Components, Server Actions) тут не використовується — це over-engineering для однієї картки. Єдина реальна серверна потреба — сховати API-ключ — вирішується **однією** функцією `/api/translate.js`, яку Vercel хостить поряд зі статикою Vite без додаткової конфігурації. Той самий один файл знадобився б і в Next (route handler), тож Next не дає виграшу, лише важчий рантайм.

Коли Next.js був би правильним: якби планувались кілька сторінок, SSR/SEO, або спільний бек+фронт, що росте. Для solo-перекладача — ні.

> Skipped: Next.js App Router. Add when проєкт виростає в багатосторінковий продукт із SSR/SEO.

---

## 2. Ресьорч: Next.js 16 vs Vite (для цього завдання)

Актуально на липень 2026: **Next.js 16** — stable (реліз ~травень 2026), Turbopack за замовчуванням, React 19.2, React Compiler stable. **Vite 6/7** — stable, dev-сервер на Rolldown/esbuild, миттєвий HMR.

| Критерій | Next.js 16 | Vite + React | Хто виграє тут |
|---|---|---|---|
| Складність для 1 екрана | Фреймворк із SSR/роутингом, більшість не потрібна | Мінімальний SPA, нічого зайвого | **Vite** |
| Приховати API-ключ | Route Handler `app/api/translate/route.ts` (вбудовано) | 1 файл `api/translate.js` (Vercel Function) | нічия — 1 файл в обох |
| Локальна розробка | `next dev` (усе разом) | `vite` + `vercel dev` для функції | Next трохи зручніше, але терпимо |
| Розмір/швидкість бандла | Важчий рантайм, гідрація | Крихітний статичний бандл | **Vite** |
| Деплой на Vercel | Zero-config | Zero-config (static + `/api`) | нічия |
| Близькість до духу завдання («HTML/CSS/JS з нуля») | Ховає HTML у фреймворку | Ближче до чистого HTML/CSS/JS | **Vite** |
| Крива входу / час до результату | Більше концепцій | Менше рухомих частин | **Vite** |

**Вердикт:** Vite. Ключ ховаємо однією функцією — це не привід тягнути весь Next.

Джерела:
- [Upgrading: Version 16 | Next.js](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16 in 2026: What's New](https://nirajiitr.com/blog/nextjs-16-2026-whats-new-what-to-use)
- [Next.js Blog](https://nextjs.org/blog)

---

## 3. Дизайн-токени (витягнуто з Figma, канал 6jj4as3l)

Картка: ширина фрейму **390px**, внутрішня картка **362px**, `border-radius: 15px`, `border: 1px solid #252f42`, фон `#ffffff`.

### Кольори
| Токен | Hex | Використання |
|---|---|---|
| `--navy` | `#0d182e` | шапка (header) |
| `--card-border` | `#252f42` | рамка картки |
| `--brand-green` | `#32cd32` | логотип «PollyGlot», зелена бульбашка юзера (stretch) |
| `--blue` | `#035a9d` | заголовки секцій, кнопки, бульбашки перекладу |
| `--radio-dot` | `#008bf7` | активна крапка радіо |
| `--field-bg` | `#eff0f4` | фон textarea/полів |
| `--text-dark` | `#333333` | основний текст, лейбли радіо |
| `--text-black` | `#000000` | текст перекладу |
| `--field-stroke` | `#bcbcbc` | обведення радіо |
| `--flag-stroke` | `#999999` | рамка прапорців |
| білий | `#ffffff` | текст на темному, фон картки |

### Типографіка
| Елемент | Шрифт | Стиль | Розмір |
|---|---|---|---|
| Логотип «PollyGlot» | Big Shoulders Display | ExtraBold 800 | 43px, колір `#32cd32` |
| Тег «Perfect Translation Every Time» | Poppins | SemiBold 600 | 12px, білий |
| Заголовки секцій («Text to translate 👇») | Poppins | Bold 700 | 20px, `#035a9d` |
| Лейбли мов (French/Spanish/Japanese) | Poppins | Bold 700 | 20px, `#333` |
| Текст у полях | Poppins | SemiBold 600 | 20px |
| Кнопки (Translate / Start Over) | Poppins | Bold 700 | 24px, білий |

Шрифти підключити через Google Fonts: **Poppins** (600, 700), **Big Shoulders Display** (800).

### Розміри елементів
- Textarea: `317×118`, `radius 8`, фон `#eff0f4`.
- Кнопка: `322×50`, `radius 6`, фон `#035a9d`.
- Радіо: коло `16px`, біле, обведення `#bcbcbc`; активне — внутрішня крапка `#008bf7`.
- Прапорці: `30×20`, обведення `#999999`.
- Шапка: висота `213px`, фон `#0d182e` з фоновою мапою світу.

---

## 4. Екрани та компоненти

### Core (2 стани одного екрана)
1. **Initial view** — шапка (лого+тег) → заголовок «Text to translate 👇» → textarea з введеним текстом → «Select language 👇» → радіо French/Spanish/Japanese з прапорцями → кнопка **Translate**.
2. **Results view** — та сама шапка → «Original text 👇» (оригінал, read-only) → «Your translation 👇» (результат від API) → кнопка **Start Over** (скидає стан у Initial).

### Stretch (chat-like) — окремий режим
- Стрічка бульбашок: інструкція (синя) → текст юзера (зелена, `#32cd32`) → переклад (синя, `#035a9d`).
- Поле вводу з зеленою кнопкою-стрілкою (send).
- Ряд прапорців-перемикачів мови внизу.

Компоненти (React): `Header`, `TranslatorForm`, `LanguagePicker`, `ResultView`, (`ChatView` для stretch), `useTranslate()` хук.

---

## 5. Архітектура

```
polyglot-app/
├─ index.html
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ components/ (Header, TranslatorForm, ResultView, ...)
│  ├─ hooks/useTranslate.js      # fetch до /api/translate
│  └─ styles.css                 # токени як CSS custom properties
├─ api/
│  └─ translate.js               # Vercel Serverless Function — тут живе ключ
├─ public/assets/                # parrot, world-map, прапорці
├─ .env.local                    # OPENROUTER_API_KEY (не комітиться)
└─ package.json
```

**Потік перекладу:** клієнт `POST /api/translate {text, targetLang}` → функція читає `process.env.OPENROUTER_API_KEY`, викликає OpenRouter, повертає `{translation}`. Ключ **ніколи** не потрапляє в клієнтський бандл.

> Ключ ховаємо з самого початку (не лише в stretch #5) — клієнтський fetch напряму до OpenRouter засвітив би ключ. Проксі-функція — базова вимога коректності, не опція.

---

## 6. Конфіг AI (провайдер: OpenRouter)

- **Провайдер:** OpenRouter (OpenAI-сумісний API). `baseURL: https://openrouter.ai/api/v1`, авторизація `Bearer OPENROUTER_API_KEY`. Клієнт — той самий `openai` SDK з підміненим `baseURL`.
- **Модель (безкоштовна):** основна `meta-llama/llama-3.3-70b-instruct:free` (стабільна мультимовна: EN/DE/FR/IT/PT/HI/ES/TH). Для якісної **японської** — актуальний `qwen/qwen3-*:free` (Qwen сильний на JP/азійських). Точні id звірити live перед кодом: `https://openrouter.ai/models?max_price=0`.
- **Fallback:** free-ростер ротується — закласти ланцюжок із 2-3 моделей або юзати роутер `openrouter/auto`. Ліміти free: **20 req/min**, **50 req/день** (без поповнення) / 1000/день (після разового топапу $10).
- **temperature:** `0.2` — переклад точний/детермінований, не «творчий».
- **max_tokens:** `~500` — короткі фрази; захист від overrun.
- **Structured output:** не потрібен (free-моделі його строго не гарантують). Повертаємо звичайний текст.
- **Prompt (system):**
  > You are a professional translator. Translate the user's text into {targetLanguage}. Return ONLY the translated text — no explanations, no quotes, no notes. Preserve tone and meaning.
- **user message:** сам текст для перекладу.
- Рендер `completion` (`choices[0].message.content`) у блок «Your translation».
- **Заголовки OpenRouter (опційно):** `HTTP-Referer` і `X-Title` — для рейтингу на openrouter.ai, не обов'язкові.

---

## 7. Обсяг: core vs stretch

**Core (обов'язково):** пункти 1–8 вимог — форма, вибір мови, виклик API, prompt, temperature, max_tokens, рендер результату, відповідність дизайну.

**Stretch (лише якщо core готовий чисто):**
1. Chat-інтерфейс (окремий режим/гілка).
2. Виправлення помилок «на льоту» під час вводу.
3. AI-згенеровані зображення (`images.generate`).
4. **Обробка помилок** — явне повідомлення юзеру, якщо API недоступний (це варто зробити навіть у core — try/catch + банер помилки).
5. Деплой з прихованим ключем — вже закладено архітектурою (розділ 5).

---

## 8. Асети (експортувати з Figma)

Потрібно витягти з макета (є як зображення в дизайні):
- `parrot` — лого папуги (~95×85).
- `world-map` — фонова мапа шапки.
- 3 прапорці: `fr-flag`, `sp-flag`, `jpn-flag` (30×20).

Експорт через `export_node_as_image` на етапі імплементації (node-id відомі: parrot `1:202`, прапорці `1:219/1:220/1:221`).

---

## 9. Деплой

Vercel. `OPENROUTER_API_KEY` — у Environment Variables проєкту (не в репозиторії). Vite статика + `/api/translate.js` як функція деплояться разом, zero-config.

---

## 10. Відкриті питання (уточнити на /grill-me)

1. **React чи vanilla JS?** Дизайн — 1 картка; vanilla теж потягне. React обрано заради простоти стану для chat-stretch. Прийнятно?
2. **Tailwind чи чистий CSS?** Для однієї картки чистий CSS з CSS-змінними достатньо (лінивіше). Tailwind — опційно.
3. ~~Провайдер API~~ — вирішено: **OpenRouter**, безкоштовні `:free`-моделі (див. розділ 6).
4. **Мови:** фіксовані 3 (FR/ES/JP) як у дизайні, чи розширюваний список?
5. **Core-only чи одразу закладати chat-режим** у структуру компонентів?
```
