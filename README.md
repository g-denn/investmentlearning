# Investment Learning

> The thinking investor's edge — browse, analyze, and learn from decades of value investing ideas.

**Live app:** [thesisinvesting.vercel.app](https://thesisinvesting.vercel.app)

---

## What is this?

Investment Learning is a research tool built on top of scraped [Value Investors Club](https://valueinvestorsclub.com) data. It lets you:

- **Browse historical ideas** — search thousands of investment theses from top value investors
- **Read extracted theses & catalysts** — structured breakdowns of each idea
- **Inspect post-publication performance** — see how each call played out
- **Learn from the best** — study patterns across winning and losing ideas

---

## Features

| Feature | Description |
|---|---|
| Idea Browser | Search & filter VIC ideas by ticker, sector, date, return |
| Thesis Extractor | AI-extracted bull case, bear case, and key catalysts |
| Performance Tracker | Post-publication price performance vs. S&P 500 |
| Pattern Analysis | Common traits of high-conviction, high-return ideas |

---

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Python scraper, Supabase (PostgreSQL)
- **AI:** Claude API for thesis extraction and summarization
- **Deployment:** Vercel

---

## Getting Started

```bash
git clone https://github.com/g-denn/investmentlearning
cd investmentlearning
npm install
npm run dev
```

Set up your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_claude_api_key
```

---

## Roadmap

- [ ] User watchlists & saved searches
- [ ] Email alerts for new ideas in covered sectors
- [ ] Mobile-optimized view
- [ ] Exportable PDF reports per idea

---

## License

MIT
