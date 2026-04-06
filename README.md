# Investment Learning

Investment Learning is a research app built on top of scraped Value Investors Club data. It lets you browse historical ideas, read extracted theses and catalysts, inspect post-publication stock performance, and play a thesis-detective game that asks you to judge an idea before revealing what the market actually did.

This repo now has two identities:

- a historical VIC scraping and analysis project
- a shipped web product for exploring that dataset

## What shipped recently

Based on the most recent work on `main`, the product now includes:

- a cleaner ideas browsing experience
- a thesis detail page with extracted write-up and catalyst sections
- a thesis detective game flow at `/game`
- a reveal screen that compares your guess with the market outcome
- live performance refresh using Yahoo Finance history
- a frontend-hosted `/api/ideas/:id/performance` route for Vercel deployments

## Product surfaces

### Web app

The frontend is a React + Vite app with these main routes:

- `/`
  - homepage
- `/ideas`
  - browse and filter ideas
- `/ideas/:id`
  - thesis detail view with extracted write-up and performance section
- `/game`
  - thesis detective gameplay flow
- `/game/reveal/:id`
  - reveal screen after a guess
- `/about`
  - project/about page

### API

The FastAPI app exposes read-only routes for:

- health
- ideas
- companies
- users

It also supports performance refresh logic backed by Yahoo Finance in the Python service layer.

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- React Query
- Recharts
- Supabase JS client
- Vercel deployment

### Backend

- FastAPI
- Python
- SQLAlchemy
- Postgres / Supabase Postgres
- Yahoo Finance history fetch for live performance refresh

### Data pipeline

- Selenium and Scrapy based VIC scraping
- Postgres data model for ideas, descriptions, catalysts, companies, users, and performance
- notebook-based historical analysis in `pricing.ipynb`

## Repo layout

```text
api/                 FastAPI app and performance refresh logic
frontend/            React/Vite web app and Vercel serverless routes
ValueInvestorsClub/  Scrapy project and SQLAlchemy models
pics/                analysis charts and images
pricing.ipynb        historical research notebook
scraper.py           link discovery scraper
ProcessLinks.py      dedupe and link processing
```

## Local development

### 1. Python environment

Create and activate a virtual environment, then install backend dependencies:

```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

For development and testing:

```bash
uv pip install -r requirements-dev.txt
```

### 2. Database

Start Postgres locally:

```bash
docker-compose up -d
```

Initialize the database if needed:

```bash
./startScript.sh
```

### 3. Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the app locally:

```bash
npm run dev
```

By default the frontend expects:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If `VITE_API_BASE_URL` is not set, local Vite dev uses the `/api` proxy configured in `frontend/vite.config.ts`.

### 4. API

Run the FastAPI server:

```bash
python -m api.main
```

Default local URL:

- API: `http://localhost:8000`

### 5. Tests

Frontend tests:

```bash
cd frontend
npm test
```

Full project test runner:

```bash
./run_tests.sh
```

## Environment variables

### Frontend

Typical frontend env vars:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=...
```

Notes:

- local dev can omit `VITE_API_BASE_URL` because Vite proxies `/api`
- deployed frontend needs the Supabase values available to the app and serverless route

### Backend

Typical backend env vars:

```bash
DATABASE_URL=...
CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Live performance refresh

There are two performance paths in this repo:

### Cached performance

The app can read existing rows from the `performance` table.

### Live Yahoo Finance refresh

Recent work added a live refresh path that:

- loads the idea snapshot
- resolves likely Yahoo ticker variants
- requests Yahoo chart history
- computes milestone returns from the first trading day after publication
- returns a frontend-ready payload with timeline labels and values

On the frontend deployment path, this is served by:

- `frontend/api/ideas/[id]/performance.ts`

On the Python side, related logic lives in:

- `api/services/performance_backfill.py`

## Backfilling performance data

You can also populate or refresh stored performance rows directly:

```bash
python -m api.backfill_performance --limit 100
python -m api.backfill_performance --ticker AAPL --force
python -m api.backfill_performance --idea-id <uuid> --dry-run
```

Notes:

- it updates the existing `performance` table
- it fills missing rows by default
- `--force` refreshes existing values
- ticker quality still depends on what is stored in `ideas.company_id`

## Scraping workflow

This repo still includes the original scraping pipeline.

### Link collection

Use Selenium to collect idea links:

```bash
python scraper.py
```

### Link dedupe

Process and deduplicate the saved link files:

```bash
python ProcessLinks.py
```

### Full import

Run the Scrapy spider:

```bash
scrapy crawl IdeaSpider
```

## Research and analysis

The original analysis work is still here. The main notebook is:

- `pricing.ipynb`

The charts in `pics/` show:

- long vs short performance
- contest-winner behavior
- delisting rates over time
- return distributions across time horizons

## Database notes

Core tables include:

- `ideas`
- `descriptions`
- `catalyst`
- `companies`
- `users`
- `performance`

The large text fields for descriptions and catalysts are broken out from the core ideas table to keep list queries lighter.

## Deployment notes

The frontend is configured for Vercel.

Important details:

- Vercel must preserve filesystem routes before falling back to the SPA shell
- the frontend-hosted performance route depends on Supabase config being available
- local Vite proxy behavior is not the same as deployed behavior, so `/api` issues can hide until deploy time

## Why this project exists

Value Investors Club is full of strong historical write-ups. This project turns that archive into something interactive:

- browse ideas quickly
- read the thesis in a cleaner format
- compare narrative vs. market outcome
- practice judgment through the game flow

That is the whole game. Turn a dense archive into a usable product.
