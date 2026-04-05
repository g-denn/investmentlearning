import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GamePage from './GamePage';
import GameRevealPage from './GameRevealPage';
import { ideasApi } from '../api/apiService';

jest.mock('../api/apiService', () => ({
  ideasApi: {
    getRandomIdea: jest.fn(),
    getIdeaPerformance: jest.fn(),
    getIdeaById: jest.fn(),
  },
}));

const mockIdeasApi = ideasApi as jest.Mocked<typeof ideasApi>;

const sampleIdea = {
  id: 'idea-1',
  link: 'https://example.com/idea-1',
  company_id: 'AAPL',
  user_id: '/users/tester',
  date: '2024-01-01T00:00:00Z',
  is_short: false,
  is_contest_winner: false,
  company: {
    ticker: 'AAPL',
    company_name: 'Apple Inc.',
  },
  user: {
    username: 'tester',
    user_link: '/users/tester',
  },
  description: {
    description: 'A durable compounder.',
  },
  catalysts: {
    catalysts: 'Margin expansion.',
  },
};

describe('Game flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIdeasApi.getRandomIdea.mockResolvedValue(sampleIdea);
    mockIdeasApi.getIdeaById.mockResolvedValue(sampleIdea);
    mockIdeasApi.getIdeaPerformance.mockResolvedValue(null);
  });

  it('only starts one initial thesis load in StrictMode', async () => {
    render(
      <React.StrictMode>
        <MemoryRouter>
          <GamePage />
        </MemoryRouter>
      </React.StrictMode>,
    );

    await waitFor(() => expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument());
    expect(mockIdeasApi.getRandomIdea).toHaveBeenCalledTimes(1);
  });

  it('navigates to a separate reveal page after locking in a choice', async () => {
    const user = userEvent.setup();

    mockIdeasApi.getIdeaPerformance.mockResolvedValue({
      nextDayOpen: 1,
      nextDayClose: 1.1,
      oneWeekClosePerf: null,
      twoWeekClosePerf: null,
      oneMonthPerf: 1.2,
      threeMonthPerf: 1.3,
      sixMonthPerf: 1.4,
      oneYearPerf: 1.5,
      twoYearPerf: null,
      threeYearPerf: 1.8,
      fiveYearPerf: 2,
    });

    render(
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/game/reveal/:id" element={<GameRevealPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /buy/i }));
    await user.click(screen.getByRole('button', { name: 'See the outcome' }));

    await waitFor(() => expect(screen.getByText('Thesis result')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Good call.')).toBeInTheDocument());
    expect(mockIdeasApi.getIdeaById).not.toHaveBeenCalled();
  });

  it('can load the reveal page directly from the route', async () => {
    mockIdeasApi.getIdeaPerformance.mockResolvedValue({
      nextDayOpen: 1,
      nextDayClose: 0.9,
      oneWeekClosePerf: null,
      twoWeekClosePerf: null,
      oneMonthPerf: 0.8,
      threeMonthPerf: 0.75,
      sixMonthPerf: 0.7,
      oneYearPerf: 0.6,
      twoYearPerf: null,
      threeYearPerf: 0.55,
      fiveYearPerf: 0.5,
    });

    render(
      <MemoryRouter initialEntries={['/game/reveal/idea-1?choice=pass']}>
        <Routes>
          <Route path="/game/reveal/:id" element={<GameRevealPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading historical market performance...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Good call.')).toBeInTheDocument());
    expect(mockIdeasApi.getIdeaById).toHaveBeenCalledWith('idea-1');
  });
});
