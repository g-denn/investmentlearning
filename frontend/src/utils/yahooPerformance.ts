export type IdeaPerformanceSnapshot = {
  companyId: string;
  date: string;
};

export type PerformanceResponsePayload = {
  nextDayOpen: number | null;
  nextDayClose: number | null;
  oneWeekClosePerf: number | null;
  twoWeekClosePerf: number | null;
  oneMonthPerf: number | null;
  threeMonthPerf: number | null;
  sixMonthPerf: number | null;
  oneYearPerf: number | null;
  twoYearPerf: number | null;
  threeYearPerf: number | null;
  fiveYearPerf: number | null;
  timeline_labels?: string[];
  timeline_values?: number[];
  performance_periods?: Record<string, number>;
};

type HistoryPoint = {
  timestamp: number;
  open: number | null;
  close: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LOOKAHEAD_BUFFER_DAYS = 14;

const PERFORMANCE_TARGETS = [
  { field: 'oneWeekClosePerf', label: '1W', add: (date: Date) => addDays(date, 7) },
  { field: 'twoWeekClosePerf', label: '2W', add: (date: Date) => addDays(date, 14) },
  { field: 'oneMonthPerf', label: '1M', add: (date: Date) => addMonths(date, 1) },
  { field: 'threeMonthPerf', label: '3M', add: (date: Date) => addMonths(date, 3) },
  { field: 'sixMonthPerf', label: '6M', add: (date: Date) => addMonths(date, 6) },
  { field: 'oneYearPerf', label: '1Y', add: (date: Date) => addYears(date, 1) },
  { field: 'twoYearPerf', label: '2Y', add: (date: Date) => addYears(date, 2) },
  { field: 'threeYearPerf', label: '3Y', add: (date: Date) => addYears(date, 3) },
  { field: 'fiveYearPerf', label: '5Y', add: (date: Date) => addYears(date, 5) },
] as const;

function atUtcMidnight(value: Date | string): Date {
  const source = typeof value === 'string' ? new Date(value) : value;
  return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + (days * DAY_MS));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

function addYears(date: Date, years: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
}

export function normalizeTickerCandidates(ticker: string): string[] {
  const cleaned = ticker.trim().toUpperCase();
  const normalized = cleaned.replace(/\./g, '-').replace(/\//g, '-').replace(/\s+/g, '');
  return [cleaned, normalized].filter((candidate, index, values) => Boolean(candidate) && values.indexOf(candidate) === index);
}

export function latestNeededDate(ideaDate: string): Date {
  return addDays(addYears(atUtcMidnight(ideaDate), 5), MAX_LOOKAHEAD_BUFFER_DAYS);
}

export function buildYahooChartUrl(ticker: string, startDate: Date, endDate: Date): string {
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor((endDate.getTime() + DAY_MS) / 1000);
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
  url.searchParams.set('period1', String(period1));
  url.searchParams.set('period2', String(period2));
  url.searchParams.set('interval', '1d');
  url.searchParams.set('includePrePost', 'false');
  url.searchParams.set('events', 'div,splits');
  return url.toString();
}

export function extractHistoryPoints(payload: unknown): HistoryPoint[] {
  const chart = payload as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            close?: Array<number | null>;
          }>;
        };
      }>;
    };
  };

  const result = chart.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const opens = quote?.open ?? [];
  const closes = quote?.close ?? [];

  return timestamps
    .map((timestamp, index) => ({
      timestamp,
      open: typeof opens[index] === 'number' ? opens[index] : null,
      close: typeof closes[index] === 'number' ? closes[index] : null,
    }))
    .filter((point) => point.close != null)
    .sort((left, right) => left.timestamp - right.timestamp);
}

function firstPointOnOrAfter(history: HistoryPoint[], targetDate: Date): HistoryPoint | null {
  const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
  for (const point of history) {
    if (point.timestamp >= targetTimestamp) {
      return point;
    }
  }
  return null;
}

export function computePerformanceFromHistory(history: HistoryPoint[], ideaDate: string): PerformanceResponsePayload | null {
  if (history.length === 0) return null;

  const baselineDate = addDays(atUtcMidnight(ideaDate), 1);
  const baseline = firstPointOnOrAfter(history, baselineDate);
  if (!baseline || baseline.close == null || baseline.close <= 0) return null;

  const payload: PerformanceResponsePayload = {
    nextDayOpen: baseline.open,
    nextDayClose: baseline.close,
    oneWeekClosePerf: null,
    twoWeekClosePerf: null,
    oneMonthPerf: null,
    threeMonthPerf: null,
    sixMonthPerf: null,
    oneYearPerf: null,
    twoYearPerf: null,
    threeYearPerf: null,
    fiveYearPerf: null,
  };

  const timelineLabels: string[] = [];
  const timelineValues: number[] = [];
  const performancePeriods: Record<string, number> = {};
  const ideaAt = atUtcMidnight(ideaDate);

  for (const target of PERFORMANCE_TARGETS) {
    const point = firstPointOnOrAfter(history, target.add(ideaAt));
    const ratio = point?.close != null ? point.close / baseline.close : null;
    payload[target.field] = ratio;
    if (ratio != null) {
      timelineLabels.push(target.label);
      timelineValues.push(ratio);
      performancePeriods[target.label] = ratio;
    }
  }

  if (timelineLabels.length > 0) {
    payload.timeline_labels = timelineLabels;
    payload.timeline_values = timelineValues;
    payload.performance_periods = performancePeriods;
  }

  return payload;
}
