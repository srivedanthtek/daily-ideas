# Spark – Private Daily Idea Journal

A production‑ready Next.js 14 (App Router) application that generates a single business idea every day using multiple LLM providers, stores it in Supabase, emails it via Resend, and displays the ideas on a clean Medium‑style website.

## Design Flow:

**Flow of events when `/api/trigger` (or the cron endpoint) is called**

1. **Request arrives**  
   - The request hits `app/api/trigger/route.ts` (the same code is used by the cron route).  
   - The handler reads the `Authorization` header (or a `?secret=` query‑string) and checks it against the `CRON_SECRET` environment variable. If the secret does not match, a **401 Unauthorized** response is returned.

2. **Run the generation pipeline**  
   - The handler calls `runIdeaGenerationAndEmailPipeline()` from `lib/claude.ts`.

3. **Determine which LLM to use (deterministic round‑robin)**  
   - `runIdeaGenerationAndEmailPipeline` queries Supabase for the total number of rows in the `ideas` table (`SELECT COUNT(*)`).  
   - `rotationIndex = ideasCount % ROTATION.length`.  
   - `ROTATION` (defined in `lib/modelRotation.ts`) contains four entries:  
     1. `{ provider: "anthropic", model: "claude-3-5-sonnet-20241022", label: "Claude Sonnet 4" }`  
     2. `{ provider: "gemini", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" }`  
     3. `{ provider: "openrouter", model: "meta-llama/llama-3-70b-instruct", label: "Llama 4 Maverick" }`  
     4. `{ provider: "openrouter", model: "deepseek/deepseek-r1", label: "DeepSeek R1" }`  
   - The selected entry (`chosenModel`) becomes the **primary provider** for this run.

4. **Generate the idea**  
   - `generateIdea(chosenModel, CLAUDE_SYSTEM_PROMPT)` (in `lib/providers/index.ts`) creates an instance of the concrete provider class based on `chosenModel.provider`:
     * `AnthropicProvider` for `"anthropic"`  
     * `GeminiProvider` for `"gemini"`  
     * `OpenRouterProvider` for `"openrouter"`  
   - The provider’s `generate()` method is called with the **exact system prompt** (`CLAUDE_SYSTEM_PROMPT`).  
   - **Error handling / fallback**:  
     * If the primary provider throws an error (network failure, API limit, etc.), the `try / catch` block in `generateIdea` catches it.  
     * If the failing provider is **not** Anthropic, the code **falls back to a fresh `AnthropicProvider`** (the default “Claude” model) and retries the generation once.  
     * If Anthropic itself fails, the error propagates and the whole pipeline aborts – there is no further fallback beyond Anthropic.

5. **Parse title and date**  
   - The raw markdown returned by the LLM is examined with a regular expression that looks for a line like:  
     `### 📅 <date> — <Product Name>:`  
   - If the pattern is found, `dateLabel` and `title` are extracted; otherwise a generic title and the current date are used.

6. **Store the idea in Supabase**  
   - An `INSERT` is performed on the `ideas` table with the fields:  
     `title`, `date_label`, `content` (full markdown), `provider` (e.g. `"anthropic"`), `model_label` (e.g. `"Claude Sonnet 4"`), `sent_email: false`.  
   - The inserted row (including the generated `id`) is returned.

7. **Send the email**  
   - `sendEmail()` (in `lib/email.ts`) builds an HTML email:
     * Subject: `✦ Spark — ${title} · ${modelLabel} · ${dateLabel}`  
     * Body: a minimal, white‑background layout with the title, date, model badge, and the markdown converted to simple HTML.  
     * A “Read on Spark →” button links to `https://spark.srivedanthtek.com/ideas/<id>`.  
   - The email is sent via the Resend SDK.  
   - If the send succeeds, the `sent_email` column of the newly inserted row is updated to `true`.

8. **Response back to the caller**  
   - The pipeline returns `{ success: true, idea: <record> }`.  
   - The API route wraps this in a JSON response:  

```json
{
  "message": "Manual trigger successful! Generated, stored, and emailed.",
  "idea": { /* full idea record */ }
}
```

   - If any step fails (count query, generation after fallback, DB insert, or email send), an error object is returned and the route responds with a **500** status and an error description.

**Summary of provider usage**

- **Primary selection** follows the deterministic rotation based on the current number of stored ideas.  
- **Only one provider is used per request** (the one selected by the rotation).  
- **Fallback**: If that provider fails, the system **automatically retries with Anthropic (Claude)**. No further attempts are made with the other providers (Gemini, OpenRouter) after a failure.  

Thus the flow is:

`/api/trigger` → auth → `runIdeaGenerationAndEmailPipeline` → count ideas → pick provider via ROTATION → call that provider → on error → retry with Anthropic → parse result → insert into Supabase → send Resend email → update `sent_email` → JSON response.

The same pipeline is used by the cron route (`/api/cron/generate-idea`), so both endpoints behave identically apart from how they are scheduled.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
  - [1️⃣ Clone the repo](#1-clone-the-repo)
  - [2️⃣ Install dependencies](#2-install-dependencies)
  - [3️⃣ Supabase schema](#3-supabase-schema)
  - [4️⃣ Environment variables](#4-environment-variables)
  - [5️⃣ Run locally](#5-run-locally)
  - [6️⃣ Deploy to Vercel](#6-deploy-to-vercel)
- [Cron & Manual Trigger](#cron--manual-trigger)
- [Project Structure](#project-structure)
- [License](#license)

## Features

- **Daily cron job** (`/api/cron/generate-idea`) that calls Claude, Gemini, or OpenRouter in a deterministic round‑robin rotation.
- **Supabase** table `ideas` with columns: `id`, `created_at`, `title`, `date_label`, `content`, `sent_email`, `provider`, `model_label`.
- **Resend** email delivery with a styled HTML template.
- **Public UI**:
  - `/` – latest idea.
  - `/archive` – grid of all ideas with model filter.
  - `/ideas/[id]` – individual idea page.
- **Tailwind CSS** + **Inter** (UI) & **Georgia/Lora** (body) typography.
- **Responsive** design, no sidebars, minimal UI.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 14** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** |
| Database | **Supabase (Postgres)** |
| Email | **Resend** |
| AI Providers | **Anthropic Claude**, **Google Gemini**, **OpenRouter** (Llama 4, DeepSeek) |
| Deployment | **Vercel** (cron via `vercel.json`) |

## Setup

### 1️⃣ Clone the repo

```bash
git clone https://github.com/your‑username/spark-daily-ideas.git
cd spark-daily-ideas
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Supabase schema

Create the `ideas` table in your Supabase project:

```sql
create table ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  date_label text not null,
  content text not null,
  sent_email boolean default false,
  provider text not null,
  model_label text not null
);
```

> **Tip:** Enable Row Level Security (RLS) if you plan to expose write endpoints later. The server‑side code uses the service role key, so it bypasses RLS safely.

### 4️⃣ Environment variables

Copy the example file and fill in your secrets:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic SDK key |
| `GEMENI_API_KEY` | Google Gemini API key |
| `DEEPSEEK_API_KEY` | (optional) OpenRouter DeepSeek key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key (used client‑side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server‑side) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address (e.g., `noreply@spark.srivedanthtek.com`) |
| `CRON_SECRET` | High‑entropy secret for protecting cron & manual trigger |
| `MY_EMAIL` | Destination email for daily ideas |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the deployed site (e.g., `https://spark.srivedanthtek.com`) |

### 5️⃣ Run locally

```bash
npm run dev
```

- Visit `http://localhost:3000` – you’ll see the “No Ideas Found Yet” placeholder.
- Trigger a generation manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/trigger
```

Check your inbox – you should receive the formatted email and the idea will appear on the homepage.

### 6️⃣ Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, import the project and set the **framework preset** to **Next.js**.
3. Add all environment variables (same as `.env.local`).
4. Vercel will automatically read `vercel.json` and schedule the cron job at **7 AM CST (13:00 UTC)**.
5. After deployment, the site will be reachable at `https://spark.srivedanthtek.com`.

## Cron & Manual Trigger

- **Cron**: Vercel calls `GET /api/cron/generate-idea` daily at 13:00 UTC. The route validates the `Authorization` header against `CRON_SECRET`.
- **Manual**: `GET /api/trigger` does the same work but is useful for testing. It also requires the same secret.

Both routes run the same pipeline:

1. Determine the next provider via round‑robin (`ideas.length % ROTATION.length`).
2. Call the selected LLM with the exact system prompt.
3. Parse title & date, store the idea in Supabase.
4. Send a styled HTML email via Resend.
5. Mark `sent_email` as `true`.

## Project Structure (high‑level)

```
/app
  /api
    /cron
      generate-idea/route.ts   # cron handler
    /trigger
      route.ts                 # manual trigger
  /archive/page.tsx            # archive grid + model filter
  /ideas/[id]/page.tsx         # individual idea page
  /layout.tsx                  # global layout with header/footer
  /globals.css                 # Tailwind base
  /page.tsx                    # latest idea homepage
/components
  IdeaRenderer.tsx             # markdown → styled HTML
/lib
  supabase.ts                  # Supabase client
  email.ts                     # Resend email sender
  claude.ts                    # orchestration pipeline
  modelRotation.ts             # deterministic rotation config
  /providers
    index.ts                   # generateIdea façade
    anthropic.ts
    gemini.ts
    openrouter.ts
```

## License

MIT © 2026 – Spark

---

**Enjoy building micro‑SaaS ideas every day!**