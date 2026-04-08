import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import IdeaCard from '../components/IdeaCard';
import { useIdeas } from '../hooks/useIdeas';
import { Idea, ListParams } from '../types/api';
import { pageMaxWidth, theme } from '../theme';

const TYPEWRITER_WORDS = ['Apple', 'Berkshire Hathaway', 'Microsoft', 'Nintendo', 'Tesla', 'Meta'];

type QuickFilter = 'all' | 'contest_winners' | 'best_performers' | 'long' | 'short';

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'all', label: 'All ideas' },
  { id: 'contest_winners', label: 'Contest winners' },
  { id: 'best_performers', label: 'Best 1Y performers' },
  { id: 'long', label: 'Long only' },
  { id: 'short', label: 'Short only' },
];

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: theme.colors.textMuted,
  marginBottom: 8,
};

const controlStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem 0.95rem',
  borderRadius: 16,
  border: `1px solid ${theme.colors.line}`,
  background: theme.colors.surfaceStrong,
  color: theme.colors.text,
  fontSize: '0.95rem',
  outline: 'none',
};

const MOBILE_STYLES = `
  @media (max-width: 760px) {
    .ideas-hero {
      padding: 1.25rem !important;
      border-radius: 26px !important;
    }

    .ideas-hero-top,
    .ideas-filter-bar {
      gap: 0.85rem !important;
    }

    .ideas-quick-filters {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.55rem !important;
    }

    .ideas-quick-filters > * {
      width: 100%;
    }

    .ideas-search-row,
    .ideas-advanced-grid,
    .ideas-card-grid {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
`;

const IdeasPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialFilters = (): ListParams => {
    const sp = new URLSearchParams(location.search);
    const f: ListParams = { skip: 0, limit: 20 };
    if (sp.has('company_id')) f.company_id = sp.get('company_id')!;
    if (sp.has('user_id')) f.user_id = sp.get('user_id')!;
    if (sp.has('is_short')) f.is_short = sp.get('is_short') === 'true';
    if (sp.has('is_contest_winner')) f.is_contest_winner = sp.get('is_contest_winner') === 'true';
    if (sp.has('has_performance')) f.has_performance = sp.get('has_performance') === 'true';
    if (sp.has('min_performance')) {
      const v = parseFloat(sp.get('min_performance')!);
      if (!Number.isNaN(v)) f.min_performance = v;
    }
    if (sp.has('max_performance')) {
      const v = parseFloat(sp.get('max_performance')!);
      if (!Number.isNaN(v)) f.max_performance = v;
    }
    if (sp.has('performance_period')) f.performance_period = sp.get('performance_period')!;
    if (sp.has('sort_by')) f.sort_by = sp.get('sort_by')!;
    if (sp.has('sort_order')) f.sort_order = sp.get('sort_order')!;
    if (sp.has('search')) f.search = sp.get('search')!;
    return f;
  };

  const [filters, setFilters] = useState<ListParams>(getInitialFilters());
  const [searchQuery, setSearchQuery] = useState(getInitialFilters().search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('all');
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const seenIds = useRef(new Set<string>());
  const isNewFilter = useRef(true);

  const [typedWord, setTypedWord] = useState('');
  const [twWordIndex, setTwWordIndex] = useState(0);
  const [twCharIndex, setTwCharIndex] = useState(0);
  const [twDeleting, setTwDeleting] = useState(false);

  useEffect(() => {
    const word = TYPEWRITER_WORDS[twWordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!twDeleting) {
      if (twCharIndex < word.length) {
        timeout = setTimeout(() => {
          setTypedWord(word.slice(0, twCharIndex + 1));
          setTwCharIndex((current) => current + 1);
        }, 90);
      } else {
        timeout = setTimeout(() => setTwDeleting(true), 1500);
      }
    } else if (twCharIndex > 0) {
      timeout = setTimeout(() => {
        setTypedWord(word.slice(0, twCharIndex - 1));
        setTwCharIndex((current) => current - 1);
      }, 45);
    } else {
      setTwDeleting(false);
      setTwWordIndex((current) => (current + 1) % TYPEWRITER_WORDS.length);
      return;
    }

    return () => clearTimeout(timeout);
  }, [twCharIndex, twDeleting, twWordIndex]);

  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== 'skip' && k !== 'limit') {
        sp.set(k, String(v));
      }
    });

    const next = sp.toString();
    if (next) navigate(`?${next}`, { replace: true });
    else if (location.search) navigate('', { replace: true });
  }, [filters, navigate, location.search]);

  const { data: ideas, isLoading, isError, error } = useIdeas(filters);

  useEffect(() => {
    if (!ideas) return;

    if (filters.skip === 0 || isNewFilter.current) {
      seenIds.current = new Set(ideas.map((idea) => idea.id));
      setAllIdeas(ideas);
      isNewFilter.current = false;
      return;
    }

    const newOnes = ideas.filter((idea) => !seenIds.current.has(idea.id));
    newOnes.forEach((idea) => seenIds.current.add(idea.id));
    if (newOnes.length > 0) setAllIdeas((current) => [...current, ...newOnes]);
  }, [ideas, filters.skip]);

  const applyFilter = (field: keyof ListParams, value: unknown) => {
    isNewFilter.current = true;
    setFilters((prev) => ({ ...prev, skip: 0, [field]: value }));
  };

  const handleSearch = () => {
    isNewFilter.current = true;
    setFilters((prev) => ({
      ...prev,
      skip: 0,
      search: searchQuery.trim() || undefined,
    }));
  };

  const applyQuickFilter = (qf: QuickFilter) => {
    isNewFilter.current = true;
    setActiveQuickFilter(qf);
    const base: ListParams = { skip: 0, limit: 20 };
    if (filters.user_id) base.user_id = filters.user_id;
    if (filters.company_id) base.company_id = filters.company_id;

    if (qf === 'contest_winners') {
      setFilters({ ...base, is_contest_winner: true, sort_by: 'date', sort_order: 'desc' });
    } else if (qf === 'best_performers') {
      setFilters({
        ...base,
        has_performance: true,
        sort_by: 'performance',
        sort_order: 'desc',
        performance_period: 'one_year_perf',
      });
    } else if (qf === 'long') {
      setFilters({ ...base, is_short: false, sort_by: 'date', sort_order: 'desc' });
    } else if (qf === 'short') {
      setFilters({ ...base, is_short: true, sort_by: 'date', sort_order: 'desc' });
    } else {
      setFilters({ ...base, sort_by: 'date', sort_order: 'desc' });
    }
  };

  const clearFilter = (field: keyof ListParams) => {
    isNewFilter.current = true;
    setFilters((prev) => {
      const next = { ...prev, skip: 0 };
      delete next[field];
      return next;
    });
  };

  const loadMore = () => {
    setFilters((prev) => ({ ...prev, skip: (prev.skip || 0) + (prev.limit || 20) }));
  };

  return (
    <div style={{ padding: '1.25rem 1.25rem 4rem' }}>
      <style>{MOBILE_STYLES}</style>
      <div style={{ maxWidth: pageMaxWidth, margin: '0 auto' }}>
        <section
          className="ideas-hero"
          style={{
            padding: '2rem',
            borderRadius: 34,
            background: 'rgba(251, 248, 242, 0.8)',
            border: `1px solid ${theme.colors.line}`,
            boxShadow: `0 24px 50px ${theme.colors.shadow}`,
          }}
        >
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="ideas-hero-top" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
              <div>
                <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem', marginBottom: '0.7rem' }}>
                  Research archive
                </div>
                <h1 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: 'clamp(2.3rem, 6vw, 4.8rem)', lineHeight: 0.94, letterSpacing: '-0.07em' }}>
                  Investment ideas,
                  <br />
                  without the clutter.
                </h1>
              </div>
              <p style={{ maxWidth: 360, margin: 0, color: theme.colors.textSoft, lineHeight: 1.65 }}>
                Search by company, author, contest status, and performance windows to move through the archive more deliberately.
              </p>
            </div>

            <div className="ideas-quick-filters" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {QUICK_FILTERS.map((qf) => {
                const active = activeQuickFilter === qf.id;
                return (
                  <button
                    key={qf.id}
                    onClick={() => applyQuickFilter(qf.id)}
                    style={{
                      padding: '0.7rem 1rem',
                      borderRadius: theme.radii.pill,
                      border: `1px solid ${active ? theme.colors.text : theme.colors.line}`,
                      background: active ? theme.colors.text : 'rgba(255, 255, 255, 0.68)',
                      color: active ? theme.colors.surfaceStrong : theme.colors.textSoft,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {qf.label}
                  </button>
                );
              })}
            </div>

            <div className="ideas-search-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '0.8rem' }}>
              <input
                type="text"
                placeholder={searchQuery ? '' : `Search for ${typedWord || 'Apple'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="company-search"
                style={{
                  ...controlStyle,
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: '0.95rem 1.3rem',
                  borderRadius: 18,
                  border: 'none',
                  background: theme.colors.text,
                  color: theme.colors.surfaceStrong,
                  fontWeight: 700,
                }}
              >
                Search
              </button>
            </div>

            <div className="ideas-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAdvanced((current) => !current)}
                style={{
                  padding: '0.75rem 0.95rem',
                  borderRadius: 16,
                  border: `1px solid ${theme.colors.line}`,
                  background: 'rgba(255, 255, 255, 0.68)',
                  color: theme.colors.text,
                  fontWeight: 600,
                }}
              >
                {showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}
              </button>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                {filters.has_performance && (
                  <button
                    onClick={() => clearFilter('has_performance')}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: theme.radii.pill,
                      border: `1px solid ${theme.colors.line}`,
                      background: theme.colors.surfaceTint,
                      color: theme.colors.textSoft,
                    }}
                  >
                    Has pricing x
                  </button>
                )}
                {filters.is_contest_winner && (
                  <button
                    onClick={() => clearFilter('is_contest_winner')}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: theme.radii.pill,
                      border: `1px solid ${theme.colors.line}`,
                      background: theme.colors.surfaceTint,
                      color: theme.colors.textSoft,
                    }}
                  >
                    Contest winner x
                  </button>
                )}
              </div>
            </div>

            {showAdvanced && (
              <div
                className="ideas-advanced-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  padding: '1.15rem',
                  borderRadius: 24,
                  background: 'rgba(255, 255, 255, 0.66)',
                  border: `1px solid ${theme.colors.line}`,
                }}
              >
                <div>
                  <label style={fieldLabelStyle}>Position type</label>
                  <select
                    value={filters.is_short !== undefined ? (filters.is_short ? 'short' : 'long') : 'all'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') clearFilter('is_short');
                      else applyFilter('is_short', value === 'short');
                    }}
                    style={controlStyle}
                    data-testid="short-ideas-toggle"
                  >
                    <option value="all">All</option>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Contest winner</label>
                  <select
                    value={filters.is_contest_winner !== undefined ? (filters.is_contest_winner ? 'yes' : 'no') : 'all'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') clearFilter('is_contest_winner');
                      else applyFilter('is_contest_winner', value === 'yes');
                    }}
                    style={controlStyle}
                    data-testid="user-search"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Has performance</label>
                  <select
                    value={filters.has_performance !== undefined ? String(filters.has_performance) : 'all'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') clearFilter('has_performance');
                      else applyFilter('has_performance', value === 'true');
                    }}
                    style={controlStyle}
                  >
                    <option value="all">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Performance period</label>
                  <select
                    value={filters.performance_period || 'one_year_perf'}
                    onChange={(e) => applyFilter('performance_period', e.target.value)}
                    style={controlStyle}
                  >
                    <option value="one_week_perf">1 Week</option>
                    <option value="two_week_perf">2 Weeks</option>
                    <option value="one_month_perf">1 Month</option>
                    <option value="three_month_perf">3 Months</option>
                    <option value="six_month_perf">6 Months</option>
                    <option value="one_year_perf">1 Year</option>
                    <option value="two_year_perf">2 Years</option>
                    <option value="three_year_perf">3 Years</option>
                    <option value="five_year_perf">5 Years</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Min performance %</label>
                  <input
                    type="number"
                    value={filters.min_performance ?? ''}
                    onChange={(e) => applyFilter('min_performance', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    style={controlStyle}
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Max performance %</label>
                  <input
                    type="number"
                    value={filters.max_performance ?? ''}
                    onChange={(e) => applyFilter('max_performance', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    style={controlStyle}
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Sort by</label>
                  <select
                    value={filters.sort_by || 'date'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'performance' && !filters.performance_period) {
                        applyFilter('performance_period', 'one_year_perf');
                      }
                      applyFilter('sort_by', value);
                    }}
                    style={controlStyle}
                  >
                    <option value="date">Date</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Sort order</label>
                  <select
                    value={filters.sort_order || 'desc'}
                    onChange={(e) => applyFilter('sort_order', e.target.value)}
                    style={controlStyle}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: '1.25rem' }}>
          {isLoading && allIdeas.length === 0 ? (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 280,
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.66)',
                border: `1px solid ${theme.colors.line}`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  border: `3px solid ${theme.colors.text}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          ) : isError ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 24,
                background: '#fff4f2',
                border: `1px solid rgba(176, 86, 86, 0.26)`,
                color: theme.colors.danger,
              }}
            >
              Error loading ideas: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : allIdeas.length > 0 ? (
            <>
              <div
                className="ideas-card-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem',
                }}
              >
                {allIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={loadMore}
                  disabled={isLoading || (ideas !== undefined && ideas.length === 0)}
                  data-testid="load-more-button"
                  style={{
                    padding: '0.95rem 1.35rem',
                    borderRadius: 18,
                    border: `1px solid ${theme.colors.line}`,
                    background: ideas !== undefined && ideas.length === 0 ? theme.colors.surfaceTint : theme.colors.text,
                    color: ideas !== undefined && ideas.length === 0 ? theme.colors.textMuted : theme.colors.surfaceStrong,
                    fontWeight: 700,
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading || (ideas !== undefined && ideas.length === 0) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? 'Loading...' : ideas !== undefined && ideas.length === 0 ? 'No more ideas' : 'Load more'}
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '4rem 1.5rem',
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.68)',
                border: `1px solid ${theme.colors.line}`,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1.1rem', color: theme.colors.textSoft, marginBottom: '1rem' }}>
                No ideas match those filters yet.
              </p>
              <button
                onClick={() => applyQuickFilter('all')}
                style={{
                  padding: '0.9rem 1.15rem',
                  borderRadius: 18,
                  border: `1px solid ${theme.colors.line}`,
                  background: theme.colors.surfaceStrong,
                  color: theme.colors.text,
                  fontWeight: 700,
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
};

export default IdeasPage;
