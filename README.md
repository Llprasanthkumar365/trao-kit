Trao Interview Prep Kit — Minimal Implementation

Overview
This is a minimal, self-contained implementation of the Trao assessment pipeline focusing on:
- Requirement extraction from a pasted JD
- Simple crawling of the target company URL
- Question generation via an LLM abstraction (mock if no API key)
- Coverage loop and schedule allocation
- Batch CLI: `ts-node src/cli.ts --input cases.json --output kits.json`

Quick start

1. Install deps:

```bash
cd trao-kit
npm install
```

2. Run a single generate (dev):

```bash
npm run dev
# then POST to http://localhost:5002/api/generate with JSON { id, jd, company_url, days }
```

3. Run the batch CLI:

```bash
npx ts-node src/cli.ts --input cases.json --output kits.json
```

Environment
Copy `.env.example` and add `OPENAI_API_KEY` if you want real LLM calls. Otherwise the mock LLM is used.

OpenAI / real LLM

If you set `OPENAI_API_KEY` in your environment (copy `.env.example` to `.env`), the CLI and server will use OpenAI. The client implements retries and robust JSON extraction; if the provider fails the code falls back to a deterministic mock generator so the pipeline remains runnable.

Notes / limitations
- Crawler: shallow (homepage + first-level links). Respects simple fetch timeouts; does not fully implement robots.txt or aggressive rate-limiting yet.
- Auth, Mongo persistence, and frontend UI are TODO (next steps).

Deployment

CI: push to GitHub will run tests via `.github/workflows/ci.yml`.

Simple deploy options:
- Heroku/Render: the included `Procfile` starts the API. Set `OPENAI_API_KEY` in the host's env and deploy.
- Docker: build the included `Dockerfile` and run the container.

Backend (Render) — quick steps

1) Push this repository to GitHub.
2) On Render, create a new Web Service and connect your GitHub repo. Use the `Docker` environment or the `Node` option. If using Docker, Render will use the included `Dockerfile`. If using Node, set build command `npm ci && npm run build` and start command `node dist/index.js`.
3) Add environment variables on Render: `OPENAI_API_KEY` (optional), `OPENAI_MODEL` and `FRONTEND_URL`.

Frontend (Vercel) — quick steps

1) In this repo `frontend/` is a Next.js app. Push it to GitHub (same repo or separate).
2) In Vercel, import the `frontend` project. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL (e.g. `https://trao-kit-backend.onrender.com`).
3) Deploy — Vercel will build and host the frontend.

Notes
- The frontend here is a minimal demo to exercise the backend API; the full builder UI, edit/regenerate features and practice mode are TODO.

