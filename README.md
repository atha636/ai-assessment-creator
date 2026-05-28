# VedaAI – AI Assessment Creator

AI-powered question paper generator for teachers. Built with Next.js, Node.js, MongoDB, Redis, BullMQ, and Socket.io.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│   Next.js 14 (App Router) + TypeScript + Zustand        │
│   Pages: / (home)  /assignments  /create  /output       │
└──────────────┬──────────────────────────────────────────┘
               │  HTTP (axios)        WebSocket (socket.io)
               ▼
┌─────────────────────────────────────────────────────────┐
│                        Backend                          │
│   Express + TypeScript  →  POST /api/assignments        │
│                         →  GET  /api/assignments        │
│                         →  GET  /api/assignments/:id    │
│                         →  DEL  /api/assignments/:id    │
│                         →  POST /api/assignments/:id/regenerate │
└──────┬──────────────┬───────────────────────────────────┘
       │              │
       ▼              ▼
  MongoDB          BullMQ Queue (Redis)
  (store)            │
                      ▼
               Worker Process
               (ai.service.ts → Groq LLaMA)
                      │
                      ▼
               Save result to MongoDB
               Emit via Socket.io →  Frontend updates live
```

### Key Design Decisions

- **BullMQ + Redis** — AI generation is slow (5–30s). Offloading to a background worker keeps the API response instant. The frontend polls + listens on WebSocket for completion.
- **Polling fallback** — If the WebSocket event is missed (page load race condition), the frontend polls `/api/assignments/:id` every 3 seconds until status = `completed`.
- **Zustand** — Lightweight state management for the form. Persists `lastForm` to `localStorage` so Regenerate can reuse the same config.
- **Groq / LLaMA** — Fast inference (~5s for a full paper). Prompt forces strict JSON output; parser strips markdown fences defensively.

---

## Project Structure

```
ai-assessment-creator/
├── backend/
│   └── src/
│       ├── config/         db.ts, redis.ts
│       ├── controllers/    assignment.controller.ts
│       ├── jobs/           queue.ts, worker.ts
│       ├── middleware/      upload.ts
│       ├── models/         Assignment.ts
│       ├── routes/         assignment.routes.ts
│       ├── services/       ai.service.ts, parser.service.ts
│       ├── sockets/        socket.ts
│       └── index.ts
└── frontend/
    └── app/
        ├── page.tsx              (home dashboard)
        ├── assignments/page.tsx  (assignment list)
        ├── create/page.tsx       (create form)
        ├── output/page.tsx       (generated paper)
        ├── layout.tsx            (server — metadata)
        ├── ClientLayout.tsx      (client — sidebar/nav)
        └── globals.css
    └── components/
        ├── AssignmentForm.tsx
        └── OutputPaper.tsx       (with polling + WS)
    └── store/
        └── assignmentStore.ts    (Zustand)
    └── lib/
        └── socket.ts
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Groq API key (free at console.groq.com)

### 1. Clone & install

```bash
git clone <your-repo>

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment variables

**backend/.env**
```env
MONGO_URI=mongodb://localhost:27017/vedaai
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # leave blank if no auth
GROQ_API_KEY=gsk_...
PORT=5000
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

---

## Features

| Feature | Status |
|---|---|
| Assignment creation form | ✅ |
| File upload (PDF / image) | ✅ |
| AI question generation (Groq) | ✅ |
| Background job queue (BullMQ) | ✅ |
| Real-time WebSocket updates | ✅ |
| Polling fallback (never stuck) | ✅ |
| Structured output (sections A/B…) | ✅ |
| Difficulty badges | ✅ |
| Answer key toggle | ✅ |
| Download as PDF | ✅ |
| Regenerate paper | ✅ |
| Delete assignments | ✅ |
| Mobile responsive | ✅ |
| Zustand state management | ✅ |

---

## Approach

1. Teacher fills the form → Zustand stores it → POST to `/api/assignments`
2. API creates a MongoDB document (`status: pending`) and immediately adds a BullMQ job
3. API returns the assignment ID; frontend navigates to `/output` and starts polling
4. Worker picks up the job, calls Groq LLaMA with a structured prompt, parses JSON
5. Worker saves result to MongoDB (`status: completed`) and emits `generation-complete` via Socket.io
6. Frontend receives the event (or detects completion via poll) and renders the paper
