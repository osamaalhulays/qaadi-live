# API Endpoints

This document enumerates the backend endpoints used by Qaadi.

## External service endpoints

- `GET /secretary/cards` – list available secretary cards.
- `GET /secretary/cards/{id}` – fetch a specific secretary card.
- `GET /archivist/retrieve/{id}` – retrieve an archived item.
- `POST /judge/evaluate/live` – live judge evaluation.

## Internal API routes

These routes are handled by the Next.js backend and consumed by the frontend.

- `POST /api/secretary` – submit secretary data and return the assigned identity.
- `GET /api/selftest?slug={slug}` – retrieve self‑test results for a slug.
- `POST /api/selftest` – run a self‑test on sample text.
- `POST /api/inquiry` – generate an inquiry plan.
- `POST /api/generate` – generate role output (e.g., secretary, consultant).
- `POST /api/export` – compose or orchestrate an export ZIP.
- `GET /api/criteria` – list criteria.
- `POST /api/criteria` – add a custom criterion.
- `PUT /api/criteria` – enable/disable a criterion.
- `GET /api/download/zip?slug={slug}&v={version}` – download registry and canonical data as a ZIP file.
- `GET /api/templates` – retrieve role templates.
- `GET /api/health` – health check.

## Static JSON resources

- `GET /snapshots/manifest.json` – list available snapshot files.
- `GET /paper/judge.json` – latest judge report for the current paper.
