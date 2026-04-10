# NIDAN.ai

## Overview

NIDAN.ai is an AI-powered medical report analysis web application. It allows users to upload medical images/scans for AI analysis, chat with a health AI assistant (powered by Google Gemini), find doctor recommendations, and view their full report history.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/nidan-ai) — served at `/`
- **API framework**: Express 5 (artifacts/api-server) — served at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Clerk (via @clerk/react + @clerk/express)
- **AI**: Google Gemini via Replit AI Integrations (gemini-2.5-flash for chat + image analysis)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

- Clerk authentication (sign in/sign up with Google or email)
- AI health query chat with streaming responses (Gemini 2.5 Flash)
- Medical image upload + AI analysis (X-ray, MRI, CT, ultrasound)
- OCR for scanned medical documents
- Report history dashboard (chat + image reports)
- Doctor recommendation directory (12 doctors seeded)
- Dashboard stat cards (consultations, images, exports)
- Recent activity feed
- Dark/light mode toggle

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/nidan-ai run dev` — run frontend locally

## Database Schema

- `conversations` + `messages` — Gemini AI chat conversations (from integrations template)
- `reports` — Medical image/OCR analysis reports
- `doctors` — Doctor directory (12 doctors seeded)

## API Routes

All routes under `/api/`:
- `GET /healthz` — health check
- `GET/POST /gemini/conversations` — chat conversations
- `GET/DELETE /gemini/conversations/:id` — single conversation
- `GET/POST /gemini/conversations/:id/messages` — messages (SSE streaming)
- `GET /reports` — list reports
- `POST /reports/analyze` — upload + analyze image
- `GET/DELETE /reports/:id` — single report
- `GET /doctors` — doctor list with search/filter
- `GET /stats` — dashboard statistics
- `GET /stats/recent-activity` — activity feed

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
