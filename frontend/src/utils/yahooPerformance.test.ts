import {
  buildYahooChartUrl,
  computePerformanceFromHistory,
  extractHistoryPoints,
  normalizeTickerCandidates,
} from './yahooPerformance';

describe('yahooPerformance utilities', () => {
  it('normalizes Yahoo-style share class ticker variants', () => {
    expect(normalizeTickerCandidates('BRK.B')).toEqual(['BRK.B', 'BRK-B']);
    expect(normalizeTickerCandidates('RDS/A')).toEqual(['RDS/A', 'RDS-A']);
  });

  it('builds the Yahoo chart endpoint with the requested date range', () => {
    const url = buildYahooChartUrl('AAPL', new Date('2024-01-01T00:00:00Z'), new Date('2024-02-01T00:00:00Z'));

    expect(url).toContain('query1.finance.yahoo.com/v8/finance/chart/AAPL');
    expect(url).toContain('interval=1d');
    expect(url).toContain('events=div%2Csplits');
  });

  it('computes milestone performance ratios from chart history', () => {
    const history = extractHistoryPoints({
      chart: {
        result: [
          {
            timestamp: [
              1704153600,
              1704240000,
              1704758400,
              1705363200,
              1707091200,
              1712016000,
              1719878400,
              1735776000,
              1767312000,
              1799107200,
              1862006400,
            ],
            indicators: {
              quote: [
                {
                  open: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                  close: [10.5, 11, 12.1, 13.2, 14.3, 15.4, 16.5, 17.6, 18.7, 19.8, 20.9],
                },
              ],
            },
          },
        ],
      },
    });

    const performance = computePerformanceFromHistory(history, '2024-01-01T13:00:00Z');

    expect(performance?.nextDayOpen).toBe(10);
    expect(performance?.nextDayClose).toBe(10.5);
    expect(performance?.oneWeekClosePerf).toBeCloseTo(12.1 / 10.5);
    expect(performance?.fiveYearPerf).toBeCloseTo(20.9 / 10.5);
    expect(performance?.timeline_labels).toEqual(['1W', '2W', '1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y']);
  });
});
