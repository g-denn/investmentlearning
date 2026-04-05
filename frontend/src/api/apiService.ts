import { supabase } from '../lib/supabase';
import { Idea, IdeaDetail, Company, User, ListParams, Performance } from '../types/api';

const PERF_COL: Record<string, string> = {
  one_week_perf: 'oneWeekClosePerf',
  two_week_perf: 'twoWeekClosePerf',
  one_month_perf: 'oneMonthPerf',
  three_month_perf: 'threeMonthPerf',
  six_month_perf: 'sixMonthPerf',
  one_year_perf: 'oneYearPerf',
  two_year_perf: 'twoYearPerf',
  three_year_perf: 'threeYearPerf',
  five_year_perf: 'fiveYearPerf',
};

type RuntimeConfig = typeof globalThis & {
  __VIC_API_BASE_URL__?: string;
};

/**
 * Ensure a VIC link is absolute and points to a specific idea page.
 * If the stored link is just the homepage or a relative path, fix it.
 */
function fixLink(link: string | null | undefined): string {
  if (!link) return '';
  if (link.startsWith('/')) return `https://valueinvestorsclub.com${link}`;
  if (link.startsWith('http')) {
    try {
      const { pathname } = new URL(link);
      if (pathname.length > 1) return link; // has a real path, not just "/"
    } catch { /* fall through */ }
  }
  return link;
}

function cast<T>(row: unknown): T {
  return row as T;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  return Number(value);
}

function mapPerformance(row: Record<string, unknown>): Performance {
  return {
    nextDayOpen: toNullableNumber(row.nextDayOpen),
    nextDayClose: toNullableNumber(row.nextDayClose),
    oneWeekClosePerf: toNullableNumber(row.oneWeekClosePerf),
    twoWeekClosePerf: toNullableNumber(row.twoWeekClosePerf),
    oneMonthPerf: toNullableNumber(row.oneMonthPerf),
    threeMonthPerf: toNullableNumber(row.threeMonthPerf),
    sixMonthPerf: toNullableNumber(row.sixMonthPerf),
    oneYearPerf: toNullableNumber(row.oneYearPerf),
    twoYearPerf: toNullableNumber(row.twoYearPerf),
    threeYearPerf: toNullableNumber(row.threeYearPerf),
    fiveYearPerf: toNullableNumber(row.fiveYearPerf),
    timeline_labels: row.timeline_labels as string[] | undefined,
    timeline_values: row.timeline_values as number[] | undefined,
    performance_periods: row.performance_periods as Record<string, number> | undefined,
  };
}

async function getCachedIdeaPerformance(id: string): Promise<Performance | null> {
  const { data, error } = await supabase
    .from('performance')
    .select('*')
    .eq('idea_id', id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPerformance(cast<Record<string, unknown>>(data));
}

async function getRandomIdeaIdWithPerformance(): Promise<string> {
  const { data, error } = await supabase
    .from('performance')
    .select('idea_id, oneYearPerf')
    .not('oneYearPerf', 'is', null)
    .limit(500);
  if (error) throw new Error(error.message);

  const candidateIds = (data ?? []).map((row: unknown) => cast<Record<string, unknown>>(row).idea_id as string);
  if (candidateIds.length === 0) {
    throw new Error('No ideas with performance found');
  }

  return candidateIds[Math.floor(Math.random() * candidateIds.length)];
}

export const ideasApi = {
  getRandomIdea: async (): Promise<IdeaDetail> => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const ideaId = await getRandomIdeaIdWithPerformance();

      const { data: idea, error: ideaErr } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();
      if (ideaErr || !idea) {
        continue;
      }

      const i = cast<Record<string, unknown>>(idea);
      const [companyRes, descRes, catalystRes, userRes] = await Promise.all([
        supabase.from('companies').select('*').eq('ticker', i.company_id).maybeSingle(),
        supabase.from('descriptions').select('*').eq('idea_id', i.id).maybeSingle(),
        supabase.from('catalyst').select('*').eq('idea_id', i.id).maybeSingle(),
        supabase.from('users').select('*').eq('user_link', i.user_id).maybeSingle(),
      ]);

      const descriptionText = cast<Record<string, unknown>>(descRes.data)?.description as string | undefined;
      if (!descriptionText?.trim()) {
        continue;
      }

      return {
        id: i.id as string,
        link: fixLink(i.link as string),
        company_id: i.company_id as string,
        user_id: i.user_id as string,
        date: i.date as string,
        is_short: i.is_short as boolean,
        is_contest_winner: i.is_contest_winner as boolean,
        company: companyRes.data ? {
          ticker: cast<Record<string, unknown>>(companyRes.data).ticker as string,
          company_name: cast<Record<string, unknown>>(companyRes.data).company_name as string,
        } : undefined,
        user: userRes.data ? {
          username: cast<Record<string, unknown>>(userRes.data).username as string,
          user_link: cast<Record<string, unknown>>(userRes.data).user_link as string,
        } : undefined,
        description: {
          description: descriptionText,
        },
        catalysts: catalystRes.data ? {
          catalysts: cast<Record<string, unknown>>(catalystRes.data).catalysts as string,
        } : undefined,
      };
    }

    throw new Error('Unable to find a playable idea with both performance and a write-up');
  },

  getIdeas: async (params: ListParams = {}): Promise<Idea[]> => {
    const {
      skip = 0, limit = 20,
      search, company_id, user_id,
      is_short, is_contest_winner,
      has_performance, min_performance, max_performance,
      performance_period = 'one_year_perf',
      sort_by = 'date', sort_order = 'desc',
    } = params;

    const perfCol = PERF_COL[performance_period] ?? 'oneYearPerf';
    const needsPerf =
      has_performance === true ||
      min_performance !== undefined ||
      max_performance !== undefined ||
      sort_by === 'performance';

    // Resolve company tickers from search query
    let searchTickers: string[] | null = null;
    if (search) {
      const { data: companies } = await supabase
        .from('companies')
        .select('ticker')
        .or(`ticker.ilike.%${search}%,company_name.ilike.%${search}%`);
      const matchedTickers = (companies ?? []).map((c: unknown) => cast<Record<string, unknown>>(c).ticker as string);
      if (matchedTickers.length === 0) return [];
      searchTickers = matchedTickers;
    }

    // Resolve performance idea IDs when needed.
    // Cap at 500 to keep the .in() URL param within server limits (~4KB safe).
    let perfIdeaIds: string[] | null = null;
    let perfOrderMap: Map<string, number> | null = null;

    if (needsPerf) {
      let perfQ = supabase.from('performance').select(`idea_id,${perfCol}`).limit(500);
      if (min_performance !== undefined) perfQ = perfQ.gte(perfCol, min_performance);
      if (max_performance !== undefined) perfQ = perfQ.lte(perfCol, max_performance);
      if (sort_by === 'performance') {
        perfQ = perfQ.order(perfCol, { ascending: sort_order === 'asc', nullsFirst: false });
      }
      const { data: perfRows, error: perfErr } = await perfQ;
      if (perfErr) throw new Error(perfErr.message);
      const matchedIdeaIds = (perfRows ?? []).map((r: unknown) => cast<Record<string, unknown>>(r).idea_id as string);
      if (matchedIdeaIds.length === 0) return [];
      perfIdeaIds = matchedIdeaIds;
      if (sort_by === 'performance') {
        perfOrderMap = new Map(matchedIdeaIds.map((ideaId, idx) => [ideaId, idx]));
      }
    }

    let q = supabase.from('ideas').select('*');

    if (company_id) q = q.eq('company_id', company_id);
    if (user_id) q = q.eq('user_id', user_id);
    if (searchTickers !== null && searchTickers.length > 0) q = q.in('company_id', searchTickers);
    if (is_short !== undefined) q = q.eq('is_short', is_short);
    if (is_contest_winner !== undefined) q = q.eq('is_contest_winner', is_contest_winner);
    if (perfIdeaIds !== null) q = q.in('id', perfIdeaIds);

    if (sort_by !== 'performance') {
      q = q.order('date', { ascending: sort_order === 'asc' });
    }
    q = q.range(skip, skip + limit - 1);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    let results = (data ?? []) as Idea[];

    // Re-sort client-side to match performance ordering
    if (perfOrderMap) {
      results = results.sort(
        (a, b) => (perfOrderMap!.get(a.id) ?? 999999) - (perfOrderMap!.get(b.id) ?? 999999),
      );
    }

    return results;
  },

  getIdeaById: async (id: string): Promise<IdeaDetail> => {
    const { data: idea, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !idea) throw new Error(error?.message ?? 'Not found');

    const i = cast<Record<string, unknown>>(idea);
    const [companyRes, descRes, catalystRes, userRes] = await Promise.all([
      supabase.from('companies').select('*').eq('ticker', i.company_id).maybeSingle(),
      supabase.from('descriptions').select('*').eq('idea_id', i.id).maybeSingle(),
      supabase.from('catalyst').select('*').eq('idea_id', i.id).maybeSingle(),
      supabase.from('users').select('*').eq('user_link', i.user_id).maybeSingle(),
    ]);

    return {
      id: i.id as string,
      link: fixLink(i.link as string),
      company_id: i.company_id as string,
      user_id: i.user_id as string,
      date: i.date as string,
      is_short: i.is_short as boolean,
      is_contest_winner: i.is_contest_winner as boolean,
      company: companyRes.data ? {
        ticker: cast<Record<string, unknown>>(companyRes.data).ticker as string,
        company_name: cast<Record<string, unknown>>(companyRes.data).company_name as string,
      } : undefined,
      user: userRes.data ? {
        username: cast<Record<string, unknown>>(userRes.data).username as string,
        user_link: cast<Record<string, unknown>>(userRes.data).user_link as string,
      } : undefined,
      description: descRes.data ? {
        description: cast<Record<string, unknown>>(descRes.data).description as string,
      } : undefined,
      catalysts: catalystRes.data ? {
        catalysts: cast<Record<string, unknown>>(catalystRes.data).catalysts as string,
      } : undefined,
    };
  },

  getIdeaPerformance: async (id: string): Promise<Performance | null> => {
    return getCachedIdeaPerformance(id);
  },

  getIdeaDescription: async (id: string): Promise<string> => {
    const { data, error } = await supabase
      .from('descriptions')
      .select('description')
      .eq('idea_id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (cast<Record<string, unknown>>(data)?.description as string) ?? '';
  },

  getIdeaCatalysts: async (id: string): Promise<string> => {
    const { data, error } = await supabase
      .from('catalyst')
      .select('catalysts')
      .eq('idea_id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (cast<Record<string, unknown>>(data)?.catalysts as string) ?? '';
  },
};

export const companiesApi = {
  getCompanies: async (params: ListParams = {}): Promise<Company[]> => {
    let q = supabase.from('companies').select('*');
    if (params.search) {
      q = q.or(`ticker.ilike.%${params.search}%,company_name.ilike.%${params.search}%`);
    }
    q = q.limit(params.limit ?? 100);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as Company[];
  },
};

export const usersApi = {
  getUsers: async (params: ListParams = {}): Promise<User[]> => {
    let q = supabase.from('users').select('*');
    if (params.search) {
      // user_id stored as user_link — try exact match first, then username search
      q = q.or(`user_link.eq.${params.search},username.ilike.%${params.search}%`);
    }
    q = q.limit(params.limit ?? 100);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as User[];
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string }> => ({ status: 'ok' }),
};
