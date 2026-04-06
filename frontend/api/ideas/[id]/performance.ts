import {
  buildYahooChartUrl,
  computePerformanceFromHistory,
  extractHistoryPoints,
  latestNeededDate,
  normalizeTickerCandidates,
} from '../../../src/utils/yahooPerformance';

type RequestLike = {
  query?: {
    id?: string | string[];
  };
};

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
};

type IdeaRow = {
  id: string;
  company_id: string;
  date: string;
};

const YAHOO_TIMEOUT_MS = 8000;
const DEFAULT_SUPABASE_URL = 'https://pevzlyeqsdjfcvrxyftd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldnpseWVxc2RqZmN2cnh5ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTg1NzUsImV4cCI6MjA5MDU5NDU3NX0.3zLGKERZqty6tSRfOxIJOxksvOngJy8-bHrGdGel1Hk';

function getIdeaId(req: RequestLike): string | null {
  const raw = req.query?.id;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

async function fetchIdeaSnapshot(ideaId: string): Promise<IdeaRow | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  const url = new URL('/rest/v1/ideas', supabaseUrl);
  url.searchParams.set('id', `eq.${ideaId}`);
  url.searchParams.set('select', 'id,company_id,date');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load idea snapshot (${response.status})`);
  }

  const rows = (await response.json()) as IdeaRow[];
  return rows[0] ?? null;
}

async function fetchYahooPerformance(snapshot: IdeaRow) {
  const earliestNeeded = new Date(Date.parse(snapshot.date) - (7 * 24 * 60 * 60 * 1000));
  const latestNeeded = latestNeededDate(snapshot.date);

  for (const candidate of normalizeTickerCandidates(snapshot.company_id)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), YAHOO_TIMEOUT_MS);

    try {
      const response = await fetch(buildYahooChartUrl(candidate, earliestNeeded, latestNeeded), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      const history = extractHistoryPoints(payload);
      const performance = computePerformanceFromHistory(history, snapshot.date);
      if (performance) {
        return performance;
      }
    } catch {
      // Try the next candidate. Missing exchange suffixes and occasional Yahoo timeouts are common.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const ideaId = getIdeaId(req);
  if (!ideaId) {
    res.status(400).json({ detail: 'Idea id is required' });
    return;
  }

  try {
    const snapshot = await fetchIdeaSnapshot(ideaId);
    if (!snapshot) {
      res.status(404).json({ detail: 'Idea not found' });
      return;
    }

    const performance = await fetchYahooPerformance(snapshot);
    if (!performance) {
      res.status(404).json({ detail: 'Performance data not found' });
      return;
    }

    res.status(200).json(performance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected performance refresh failure';
    res.status(500).json({ detail: message });
  }
}
