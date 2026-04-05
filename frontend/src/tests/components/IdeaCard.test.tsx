import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import IdeaCard from '../../components/IdeaCard';
import { usersApi, companiesApi, ideasApi } from '../../api/apiService';
import { Idea } from '../../types/api';

// Mock the API services
jest.mock('../../api/apiService', () => ({
  usersApi: {
    getUsers: jest.fn(),
  },
  companiesApi: {
    getCompanies: jest.fn(),
  },
  ideasApi: {
    getIdeaPerformance: jest.fn(),
  },
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const mockCompaniesApi = companiesApi as jest.Mocked<typeof companiesApi>;
const mockIdeasApi = ideasApi as jest.Mocked<typeof ideasApi>;

// Sample idea data
const sampleIdea: Idea = {
  id: 'test-idea-1',
  link: 'https://example.com/idea/1',
  company_id: 'Company ABC',
  user_id: 'user123',
  date: '2023-01-01T00:00:00Z',
  is_short: false,
  is_contest_winner: true,
};

// Wrapper component with required providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('IdeaCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockUsersApi.getUsers.mockResolvedValue([]);
    mockCompaniesApi.getCompanies.mockResolvedValue([]);
    mockIdeasApi.getIdeaPerformance.mockResolvedValue({
      nextDayOpen: 0.5,
      nextDayClose: 0.7,
      oneWeekClosePerf: 1.5,
      twoWeekClosePerf: 2.3,
      oneMonthPerf: 3.2,
      threeMonthPerf: 5.7,
      sixMonthPerf: 8.4,
      oneYearPerf: 12.5,
      twoYearPerf: 24.8,
      threeYearPerf: 35.1,
      fiveYearPerf: 45.9,
      timeline_labels: undefined,
      timeline_values: undefined
    });
  });

  test('renders the idea with loading states initially', async () => {
    // Setup API mocks to delay resolution
    mockUsersApi.getUsers.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([{ username: 'TestUser', user_link: '/users/123' }]), 100);
    }));
    mockCompaniesApi.getCompanies.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([{ ticker: 'ABC', company_name: 'Company ABC' }]), 100);
    }));

    render(<IdeaCard idea={sampleIdea} />, { wrapper: createWrapper() });

    const card = screen.getByTestId('idea-card');
    expect(card).toHaveTextContent(sampleIdea.user_id);
    expect(card).toHaveTextContent(sampleIdea.company_id);
    
    // Badge information should be available immediately (not loading-dependent)
    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  test('renders user data correctly when loaded', async () => {
    // Mock successful API responses
    mockUsersApi.getUsers.mockResolvedValue([
      { username: 'TestUser', user_link: '/users/123' }
    ]);
    mockCompaniesApi.getCompanies.mockResolvedValue([
      { ticker: 'ABC', company_name: 'Company ABC' }
    ]);

    render(<IdeaCard idea={sampleIdea} />, { wrapper: createWrapper() });

    const card = screen.getByTestId('idea-card');
    await waitFor(() => expect(card).toHaveTextContent('TestUser'));
    expect(card).toHaveTextContent('TestUser');
    expect(card).toHaveTextContent('ABC');
  });

  test('handles API errors gracefully by showing the fallback IDs', async () => {
    // Mock API errors
    mockUsersApi.getUsers.mockRejectedValue(new Error('Failed to fetch user'));
    mockCompaniesApi.getCompanies.mockRejectedValue(new Error('Failed to fetch company'));

    render(<IdeaCard idea={sampleIdea} />, { wrapper: createWrapper() });

    // Should still display the IDs even if the API calls fail
    const card = screen.getByTestId('idea-card');
    expect(card).toHaveTextContent(sampleIdea.user_id);
    expect(card).toHaveTextContent(sampleIdea.company_id);
  });

  test('handles empty API responses gracefully', async () => {
    // Mock empty API responses
    mockUsersApi.getUsers.mockResolvedValue([]);
    mockCompaniesApi.getCompanies.mockResolvedValue([]);

    render(<IdeaCard idea={sampleIdea} />, { wrapper: createWrapper() });

    // Should still display the IDs when no matching data is found
    const card = screen.getByTestId('idea-card');
    expect(card).toHaveTextContent(sampleIdea.user_id);
    expect(card).toHaveTextContent(sampleIdea.company_id);
  });
});
