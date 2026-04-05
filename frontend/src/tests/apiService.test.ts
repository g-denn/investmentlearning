import { ideasApi } from '../api/apiService';

const fromMock = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
  },
}));

describe('ideasApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global as Partial<typeof globalThis>).fetch;
  });

  test('getIdeaPerformance returns cached Supabase data', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        nextDayOpen: 2,
        nextDayClose: 2.2,
        oneYearPerf: 1.25,
      },
      error: null,
    });
    const limit = jest.fn(() => ({ maybeSingle }));
    const eq = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValue({ select });

    const result = await ideasApi.getIdeaPerformance('idea-1');

    expect(fromMock).toHaveBeenCalledWith('performance');
    expect(result).toEqual({
      nextDayOpen: 2,
      nextDayClose: 2.2,
      oneWeekClosePerf: null,
      twoWeekClosePerf: null,
      oneMonthPerf: null,
      threeMonthPerf: null,
      sixMonthPerf: null,
      oneYearPerf: 1.25,
      twoYearPerf: null,
      threeYearPerf: null,
      fiveYearPerf: null,
      timeline_labels: undefined,
      timeline_values: undefined,
      performance_periods: undefined,
    });
  });

  test('getIdeaPerformance returns null when cached data is missing', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const limit = jest.fn(() => ({ maybeSingle }));
    const eq = jest.fn(() => ({ limit }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValue({ select });

    const result = await ideasApi.getIdeaPerformance('idea-2');

    expect(result).toBeNull();
  });

  test('getRandomIdea samples from performance rows so the game has web-ready results', async () => {
    const maybeSingleCompany = jest.fn().mockResolvedValue({
      data: { ticker: 'AAPL', company_name: 'Apple Inc.' },
      error: null,
    });
    const maybeSingleDescription = jest.fn().mockResolvedValue({
      data: { description: 'A strong thesis.' },
      error: null,
    });
    const maybeSingleCatalyst = jest.fn().mockResolvedValue({
      data: { catalysts: 'Catalyst' },
      error: null,
    });
    const maybeSingleUser = jest.fn().mockResolvedValue({
      data: { username: 'author', user_link: '/users/author' },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'performance') {
        return {
          select: jest.fn(() => ({
            not: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: [{ idea_id: 'idea-7', oneYearPerf: 1.8 }],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'descriptions') {
        return {
          select: jest.fn(() => ({
              range: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: { idea_id: 'idea-7' }, error: null }),
              })),
              eq: jest.fn(() => ({ maybeSingle: maybeSingleDescription })),
          })),
        };
      }

      if (table === 'ideas') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'idea-7',
                  link: '/idea/7',
                  company_id: 'AAPL',
                  user_id: '/users/author',
                  date: '2024-01-01T00:00:00Z',
                  is_short: false,
                  is_contest_winner: true,
                },
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'companies') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ maybeSingle: maybeSingleCompany })),
          })),
        };
      }

      if (table === 'catalyst') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ maybeSingle: maybeSingleCatalyst })),
          })),
        };
      }

      if (table === 'users') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ maybeSingle: maybeSingleUser })),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const result = await ideasApi.getRandomIdea();

    expect(fromMock).toHaveBeenCalledWith('performance');
    expect(result.id).toBe('idea-7');
    expect(result.description?.description).toBe('A strong thesis.');
    expect(result.company?.ticker).toBe('AAPL');
  });
});
