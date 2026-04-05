import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ideasApi } from '../api/apiService';
import { IdeaDetail, Performance } from '../types/api';
import { pageMaxWidth, theme } from '../theme';

type Choice = 'buy' | 'pass';
type RevealLocationState = { choice?: Choice; idea?: IdeaDetail };

const cardStyle: React.CSSProperties = {
  borderRadius: 28,
  border: `1px solid ${theme.colors.line}`,
  background: 'rgba(251, 248, 242, 0.84)',
  boxShadow: `0 24px 50px ${theme.colors.shadow}`,
};

const ratioToPct = (v: number): number => (v - 1) * 100;

const fmt = (v: number | null | undefined): string => {
  if (v == null) return '-';
  const pct = ratioToPct(v);
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

const perfPositive = (v: number | null | undefined, isShort: boolean): boolean =>
  v != null && (isShort ? v < 1 : v > 1);

const GameRevealPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const state = (location.state as RevealLocationState | null) ?? null;
  const choiceFromQuery = new URLSearchParams(location.search).get('choice');
  const choice: Choice | null =
    state?.choice ?? (choiceFromQuery === 'buy' || choiceFromQuery === 'pass' ? choiceFromQuery : null);
  const [idea, setIdea] = useState<IdeaDetail | null>(state?.idea && state.idea.id === id ? state.idea : null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadReveal = async () => {
      if (!id || !choice) {
        setErrorMsg('This result page is missing the thesis choice. Start a fresh round from the game page.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg('');

      try {
        const currentIdea =
          state?.idea && state.idea.id === id ? state.idea : await ideasApi.getIdeaById(id);
        if (cancelled) return;
        setIdea(currentIdea);

        const perf = await ideasApi.getIdeaPerformance(id);
        if (cancelled) return;
        setPerformance(perf);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : 'Failed to load the thesis result');
        setLoading(false);
      }
    };

    loadReveal();
    return () => {
      cancelled = true;
    };
  }, [choice, id, state]);

  const referencePerf =
    performance?.oneYearPerf ?? performance?.threeYearPerf ?? performance?.fiveYearPerf ?? null;
  const thesisWorked =
    idea && referencePerf != null ? (idea.is_short ? referencePerf < 1 : referencePerf > 1) : null;
  const userWasRight =
    thesisWorked != null && choice
      ? (choice === 'buy' && thesisWorked) || (choice === 'pass' && !thesisWorked)
      : null;
  const perfRows = (performance
    ? [
        { label: '1 Month', value: performance.oneMonthPerf },
        { label: '3 Months', value: performance.threeMonthPerf },
        { label: '6 Months', value: performance.sixMonthPerf },
        { label: '1 Year', value: performance.oneYearPerf },
        { label: '3 Years', value: performance.threeYearPerf },
        { label: '5 Years', value: performance.fiveYearPerf },
      ]
    : []
  ).filter((row) => row.value != null);
  const historicalDate = idea?.date
    ? new Date(idea.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div style={{ minHeight: '100vh', padding: '1.25rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: pageMaxWidth, margin: '0 auto' }}>
        <header
          style={{
            ...cardStyle,
            marginBottom: '1rem',
            padding: '0.9rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem' }}>
              Historical performance reveal
            </div>
            <div style={{ fontFamily: theme.fonts.display, fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.05em' }}>
              Thesis result
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            <RouterLink to="/game" style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: `1px solid ${theme.colors.line}`, background: theme.colors.surfaceStrong, textDecoration: 'none', fontWeight: 600 }}>
              Back to game
            </RouterLink>
            <RouterLink to="/ideas" style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: `1px solid ${theme.colors.line}`, background: theme.colors.surfaceStrong, textDecoration: 'none', fontWeight: 600 }}>
              Browse ideas
            </RouterLink>
          </div>
        </header>

        {loading && (
          <section style={{ ...cardStyle, minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 1rem', border: `3px solid ${theme.colors.text}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: theme.colors.textSoft }}>Loading historical market performance...</div>
            </div>
            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
          </section>
        )}

        {!loading && errorMsg && (
          <section style={{ padding: '1.5rem', borderRadius: 28, background: '#fff4f2', border: '1px solid rgba(176, 86, 86, 0.24)', color: theme.colors.danger }}>
            <p style={{ margin: '0 0 1rem' }}>{errorMsg}</p>
            <button type="button" onClick={() => navigate('/game')} style={{ padding: '0.85rem 1.1rem', borderRadius: 16, border: 'none', background: theme.colors.text, color: theme.colors.surfaceStrong, fontWeight: 700 }}>
              Start a new thesis
            </button>
          </section>
        )}

        {!loading && !errorMsg && idea && choice && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <section style={{ ...cardStyle, padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                    <span style={{ padding: '0.38rem 0.72rem', borderRadius: theme.radii.pill, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: idea.is_short ? '#fff1ef' : '#eefaf7', color: idea.is_short ? theme.colors.danger : theme.colors.success }}>
                      {idea.is_short ? 'Short' : 'Long'}
                    </span>
                    <span style={{ padding: '0.38rem 0.72rem', borderRadius: theme.radii.pill, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: theme.colors.surfaceTint, color: theme.colors.text }}>
                      You chose {choice}
                    </span>
                  </div>
                  <h1 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: 'clamp(2.1rem, 6vw, 4.2rem)', lineHeight: 0.95, letterSpacing: '-0.07em' }}>
                    {idea.company?.company_name || idea.company_id}
                    {idea.company?.ticker ? ` (${idea.company.ticker})` : ''}
                  </h1>
                </div>

                <div style={{ padding: '1rem', minWidth: 220, borderRadius: 24, background: theme.colors.surfaceStrong, border: `1px solid ${theme.colors.line}` }}>
                  <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.7rem' }}>
                    Context
                  </div>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    <div>
                      <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Published</div>
                      <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{historicalDate}</div>
                    </div>
                    <div>
                      <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Author</div>
                      <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{idea.user?.username || idea.user_id}</div>
                    </div>
                    {idea.link && (
                      <a href={idea.link} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.text, textDecoration: 'none', fontWeight: 700 }}>
                        Open original write-up
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {userWasRight != null && thesisWorked != null && (
              <section style={{ ...cardStyle, padding: '1.5rem', background: userWasRight ? '#eefaf7' : '#fff1ef' }}>
                <div style={{ fontFamily: theme.fonts.display, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.05em', color: userWasRight ? theme.colors.success : theme.colors.danger, marginBottom: '0.35rem' }}>
                  {userWasRight ? 'Good call.' : 'Wrong call.'}
                </div>
                <p style={{ margin: 0, color: theme.colors.textSoft, lineHeight: 1.65 }}>
                  You chose to {choice}. The thesis {thesisWorked ? 'played out' : 'did not play out'} over the observed period.
                </p>
              </section>
            )}

            <section style={{ ...cardStyle, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: '1rem', alignItems: 'start' }}>
                <div>
                  <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.65rem' }}>
                    Outcome
                  </div>
                  <div style={{ display: 'grid', gap: '0.7rem' }}>
                    {perfRows.length > 0 ? perfRows.map(({ label, value }) => {
                      const good = perfPositive(value, idea.is_short);
                      const color = good ? theme.colors.success : theme.colors.danger;
                      const width = Math.min(Math.abs((value ?? 0) - 1) * 120, 100);

                      return (
                        <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) 80px', gap: '0.8rem', alignItems: 'center', padding: '0.9rem 1rem', borderRadius: 20, background: theme.colors.surfaceStrong, border: `1px solid ${theme.colors.line}` }}>
                          <div style={{ color: theme.colors.textSoft }}>{label}</div>
                          <div style={{ height: 8, background: theme.colors.surfaceTint, borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 999 }} />
                          </div>
                          <div style={{ color, fontWeight: 700, textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                            {fmt(value)}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ padding: '1rem', borderRadius: 20, background: theme.colors.surfaceStrong, border: `1px solid ${theme.colors.line}`, color: theme.colors.textSoft }}>
                        Performance data is not available for this idea.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '1rem', borderRadius: 24, background: theme.colors.surfaceStrong, border: `1px solid ${theme.colors.line}`, display: 'grid', gap: '1rem' }}>
                  <div>
                    <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.7rem' }}>
                      Recap
                    </div>
                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                      <div>
                        <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Your decision</div>
                        <div style={{ marginTop: '0.2rem', fontWeight: 700, textTransform: 'capitalize' }}>{choice}</div>
                      </div>
                      <div>
                        <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Thesis type</div>
                        <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{idea.is_short ? 'Short' : 'Long'}</div>
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={() => navigate('/game')} style={{ padding: '0.95rem 1.2rem', borderRadius: 18, border: 'none', background: theme.colors.text, color: theme.colors.surfaceStrong, fontWeight: 800 }}>
                    Next thesis
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRevealPage;
