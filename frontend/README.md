Trao Kit Frontend (minimal)

This minimal Next.js frontend provides a textarea to paste the job description and call the backend `/api/generate` endpoint. It is intentionally tiny — the full editing UI is still TODO.

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to your deployed backend URL (or leave as default http://localhost:5002).
