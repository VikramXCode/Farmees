
# FarmEase

Smart, farmer-friendly web app with English + Malayalam support. Features Home, Reminders, and Connect sections with land-specific AI assistance, crop recommendations, disease diagnosis, market analysis, and weather forecast.

## Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Router
- State: React Context (Auth, Farm, Language)
- Icons: Lucide React
- Backend: Node.js, Express, MongoDB (Mongoose)
- PWA: Manifest + Service Worker
- Optional AI: Ollama (local LLM)

## Monorepo Layout
```
project/
  backend/            # Express API + MongoDB models/routes
  public/             # PWA files (manifest, service worker)
  src/                # Frontend React app
  index.html
  tailwind.config.js
```

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB running locally (or Atlas connection string)
- Optional: Ollama (for local AI) – `https://ollama.com`

# MONGODB_URI can be local or Atlas
# PORT can be changed if needed

# Windows PowerShell

# macOS/Linux
printf "PORT=3001\nMONGODB_URI=mongodb://127.0.0.1:27017/farmease\nPLANT_ID_API_KEYS=PLANTID_KEY_1,PLANTID_KEY_2\nKINDWISE_API_KEYS=KINDWISE_KEY_1,KINDWISE_KEY_2\n" > .env

# (Optional) seed sample data
npm run init:db
# start API
npm run start   # or: npm run dev
```

API base: `http://localhost:3001/api`

- Lands: `GET/PUT/POST /api/lands/...`
- AI Interactions: `POST/GET /api/ai-interactions/...`
 - AI (Groq): `POST /api/ai/generate` { input, systemPrompt?, context?, model? }

## Frontend Setup
```
npm install
# Windows PowerShell
Set-Content -Path .env -Value "VITE_API_URL=http://localhost:3001/api"

# macOS/Linux
printf "VITE_API_URL=http://localhost:3001/api\n" > .env

# Optional: enable Ollama
# Optional: enable Groq (via backend)
# Windows PowerShell
Add-Content .env "`r`nVITE_USE_GROQ=true"

# Backend .env
# Windows PowerShell
Set-Content -Path backend/.env -Value "GROQ_API_KEY=sk-...`r`nGROQ_MODEL=llama-3.1-8b-instant"

# Windows PowerShell
Add-Content .env "`r`nVITE_USE_OLLAMA=true"
Add-Content .env "`r`nVITE_OLLAMA_URL=http://localhost:11434"
Add-Content .env "`r`nVITE_OLLAMA_MODEL=llama3"

# macOS/Linux
printf "VITE_USE_OLLAMA=true\nVITE_OLLAMA_URL=http://localhost:11434\nVITE_OLLAMA_MODEL=llama3\n" >> .env

# start dev server
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

## Ollama Integration
- Toggle via `VITE_USE_OLLAMA=true`.
- Default model is `llama3`; change with `VITE_OLLAMA_MODEL`.
- Service URL defaults to `http://localhost:11434`; change with `VITE_OLLAMA_URL`.
- Used in:
  - AI Assistant (chat) – land-aware prompts
  - Disease Diagnosis – text description analysis

Quick start with Ollama:
```
# Install Ollama (see https://ollama.com)
# Pull a model
ollama pull llama3

# Ensure Ollama service is running (default http://localhost:11434)
```

## Land-specific Data + AI Assistant
- Each land is stored as a document in the `lands` collection.
- Chat messages are stored in `aiinteractions`, keyed by `landId`.
- Recommendations are stored in `landrecommendations`.
- The AI Assistant loads land data and generates context-aware responses. If the API is unreachable, it falls back to mock data.
- When `VITE_USE_OLLAMA=true`, the assistant and diagnosis text analysis use the local LLM via Ollama.

## PWA
- Manifest: `public/manifest.json`
- Service Worker: `public/sw.js` (only registered in production)

## Scripts
Backend:
- `npm run start` – start server
- `npm run dev` – start with nodemon
- `npm run init:db` – seed sample data

Frontend:
- `npm run dev` – Vite dev server
- `npm run build` – production build
- `npm run preview` – preview build

## Environment Variables
Backend `.env`:
- `PORT` (default 3001)
- `MONGODB_URI` (e.g., `mongodb://127.0.0.1:27017/farmease`)
 - `GROQ_API_KEY` (enable Groq AI backend)
 - `GROQ_MODEL` (optional, default `llama-3.1-8b-instant`)

- Plant.id keys (rotation supported; first available is used, rotates on 401/403/429/quota errors):
  - `PLANT_ID_API_KEYS` comma-separated: `key1,key2,key3`
  - `PLANT_ID_API_KEY_1..N` indexed: `PLANT_ID_API_KEY_1=...`
  - `PLANT_ID_API_KEY` single fallback
- Kindwise keys (same pattern):
  - `KINDWISE_API_KEYS` comma-separated
  - `KINDWISE_API_KEY_1..N` indexed
  - `KINDWISE_API_KEY` single fallback

Frontend `.env`:
- `VITE_API_URL` (e.g., `http://localhost:3001/api`)
 - `VITE_USE_GROQ` (true/false)
- `VITE_USE_OLLAMA` (true/false)
- `VITE_OLLAMA_URL` (e.g., `http://localhost:11434`)
- `VITE_OLLAMA_MODEL` (e.g., `llama3`)

## Troubleshooting
- If the frontend can’t reach the API, confirm backend is running and `VITE_API_URL` matches, and you are not opening `/api` on the Vite port.
- If blank page: hard refresh, unregister any service worker, restart Vite.
- Windows PowerShell escaping differs; prefer the provided `Set-Content` commands for `.env` creation.
