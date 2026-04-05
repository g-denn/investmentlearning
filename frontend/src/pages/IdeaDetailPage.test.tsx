import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useIdeaDetail, useIdeaPerformance } from '../hooks/useIdeas';
import IdeaDetailPage from './IdeaDetailPage';

jest.mock('../hooks/useIdeas', () => ({
  useIdeaDetail: jest.fn(),
  useIdeaPerformance: jest.fn(),
}));

jest.mock('../components/PerformanceChart', () => ({
  __esModule: true,
  default: () => <div>Performance Chart</div>,
}));

const mockUseIdeaDetail = useIdeaDetail as jest.MockedFunction<typeof useIdeaDetail>;
const mockUseIdeaPerformance = useIdeaPerformance as jest.MockedFunction<typeof useIdeaPerformance>;

const baseIdea = {
  id: 'idea-1',
  link: 'https://www.valueinvestorsclub.com/idea/Buckle/1401800606',
  company_id: 'BKE',
  user_id: '/users/test',
  date: '2024-01-15T00:00:00Z',
  is_short: false,
  is_contest_winner: true,
  company: {
    ticker: 'BKE',
    company_name: 'Buckle',
  },
  user: {
    username: 'testuser',
    user_link: '/users/test',
  },
  description: {
    description: 'A structured VIC thesis.',
  },
  catalysts: {
    catalysts: 'Catalyst one.',
  },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ideas/idea-1']}>
      <Routes>
        <Route path="/ideas/:id" element={<IdeaDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('IdeaDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIdeaPerformance.mockReturnValue({
      data: {
        nextDayOpen: 1,
        nextDayClose: 2,
        oneWeekClosePerf: 3,
        twoWeekClosePerf: 4,
        oneMonthPerf: 5,
        threeMonthPerf: 6,
        sixMonthPerf: 7,
        oneYearPerf: 8,
        twoYearPerf: 9,
        threeYearPerf: 10,
        fiveYearPerf: 11,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useIdeaPerformance>);
  });

  it('renders the VIC embed and extracted summary content', () => {
    mockUseIdeaDetail.mockReturnValue({
      data: baseIdea,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useIdeaDetail>);

    renderPage();

    expect(screen.getByText('Original VIC write-up')).toBeInTheDocument();
    expect(screen.getByTitle(/Original write-up for/i)).toHaveAttribute('src', baseIdea.link);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('A structured VIC thesis.')).toBeInTheDocument();
    expect(screen.getByText('Catalyst one.')).toBeInTheDocument();
  });

  it('removes the loading overlay once the iframe finishes loading', () => {
    mockUseIdeaDetail.mockReturnValue({
      data: baseIdea,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useIdeaDetail>);

    renderPage();

    expect(screen.getByText('Loading the original VIC layout...')).toBeInTheDocument();

    fireEvent.load(screen.getByTitle(/Original write-up for/i));

    expect(screen.queryByText('Loading the original VIC layout...')).not.toBeInTheDocument();
  });

  it('shows the live performance loading state while market data is being fetched', () => {
    mockUseIdeaDetail.mockReturnValue({
      data: baseIdea,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useIdeaDetail>);
    mockUseIdeaPerformance.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useIdeaPerformance>);

    renderPage();

    expect(screen.getByText('Loading live market performance...')).toBeInTheDocument();
  });
});
