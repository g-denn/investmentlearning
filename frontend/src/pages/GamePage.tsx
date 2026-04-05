import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ideasApi } from '../api/apiService';
import { IdeaDetail } from '../types/api';
import { pageMaxWidth, theme } from '../theme';

const TIMER_SECONDS = 120;

type Choice = 'buy' | 'pass' | null;
type Phase = 'loading' | 'decision' | 'error';

const cardStyle: React.CSSProperties = {
  borderRadius: 28,
  border: `1px solid ${theme.colors.line}`,
  background: 'rgba(251, 248, 242, 0.84)',
  boxShadow: `0 24px 50px ${theme.colors.shadow}`,
};

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [choice, setChoice] = useState<Choice>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialLoadStartedRef = useRef(false);
  const ideaRequestRef = useRef(0);

  const loadIdea = useCallback(async () => {
    const requestId = ++ideaRequestRef.current;
    setPhase('loading');
    setChoice(null);
    setSecondsLeft(TIMER_SECONDS);
    setErrorMsg('');

    try {
      const data = await ideasApi.getRandomIdea();
      if (requestId !== ideaRequestRef.current) return;
      setIdea(data);
      setPhase('decision');
    } catch (e) {
      if (requestId !== ideaRequestRef.current) return;
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load idea');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    loadIdea();
  }, [loadIdea]);

  useEffect(() => {
    if (phase !== 'decision') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const lockIn = () => {
    if (!idea || !choice || phase !== 'decision') return;
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(`/game/reveal/${encodeURIComponent(idea.id)}?choice=${choice}`, {
      state: { idea, choice },
    });
  };

  const historicalDate = idea?.date
    ? new Date(idea.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

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
              Practice mode
            </div>
            <div style={{ fontFamily: theme.fonts.display, fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.05em' }}>
              Thesis Detective
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            <RouterLink to="/" style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: `1px solid ${theme.colors.line}`, background: theme.colors.surfaceStrong, textDecoration: 'none', fontWeight: 600 }}>
              Home
            </RouterLink>
            <RouterLink to="/ideas" style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: `1px solid ${theme.colors.line}`, background: theme.colors.surfaceStrong, textDecoration: 'none', fontWeight: 600 }}>
              Browse ideas
            </RouterLink>
            {phase === 'decision' && (
              <button type="button" onClick={loadIdea} style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: 'none', background: theme.colors.text, color: theme.colors.surfaceStrong, fontWeight: 700 }}>
                Skip thesis
              </button>
            )}
          </div>
        </header>

        {phase === 'loading' && (
          <section style={{ ...cardStyle, minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 1rem', border: `3px solid ${theme.colors.text}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: theme.colors.textSoft }}>Loading a historical thesis...</div>
            </div>
            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
          </section>
        )}

        {phase === 'error' && (
          <section style={{ padding: '1.5rem', borderRadius: 28, background: '#fff4f2', border: '1px solid rgba(176, 86, 86, 0.24)', color: theme.colors.danger }}>
            <p style={{ margin: '0 0 1rem' }}>{errorMsg}</p>
            <button type="button" onClick={loadIdea} style={{ padding: '0.85rem 1.1rem', borderRadius: 16, border: 'none', background: theme.colors.text, color: theme.colors.surfaceStrong, fontWeight: 700 }}>
              Try again
            </button>
          </section>
        )}

        {phase === 'decision' && idea && (
          <section style={{ ...cardStyle, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  <span style={{ padding: '0.38rem 0.72rem', borderRadius: theme.radii.pill, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: idea.is_short ? '#fff1ef' : '#eefaf7', color: idea.is_short ? theme.colors.danger : theme.colors.success }}>
                    {idea.is_short ? 'Short' : 'Long'}
                  </span>
                  {idea.is_contest_winner && (
                    <span style={{ padding: '0.38rem 0.72rem', borderRadius: theme.radii.pill, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f0f7ff', color: theme.colors.accentBlue }}>
                      Contest winner
                    </span>
                  )}
                </div>
                <h1 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: 'clamp(2.1rem, 6vw, 4.2rem)', lineHeight: 0.95, letterSpacing: '-0.07em' }}>
                  {idea.company?.company_name || idea.company_id}
                  {idea.company?.ticker ? ` (${idea.company.ticker})` : ''}
                </h1>
              </div>

              <div style={{ minWidth: 200 }}>
                <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.72rem', marginBottom: '0.4rem' }}>
                  Decision timer
                </div>
                <div style={{ fontFamily: theme.fonts.display, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.05em' }}>{timerDisplay}</div>
                <div style={{ marginTop: '0.65rem', height: 6, borderRadius: 999, background: theme.colors.surfaceTint, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(secondsLeft / TIMER_SECONDS) * 100}%`, background: theme.gradient, transition: 'width 1s linear' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(260px, 0.75fr)', gap: '1rem' }}>
              <article style={{ padding: '1.3rem', borderRadius: 28, background: 'rgba(255, 255, 255, 0.72)', border: `1px solid ${theme.colors.line}` }}>
                <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.65rem' }}>
                  Historical thesis
                </div>
                <p style={{ margin: 0, lineHeight: 1.8, color: theme.colors.textSoft, whiteSpace: 'pre-wrap' }}>
                  {idea.description?.description?.replace(/^Description\s*/i, '') || 'No description available.'}
                </p>
                {idea.catalysts?.catalysts && (
                  <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 22, background: theme.colors.surfaceTint, color: theme.colors.textSoft }}>
                    <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.72rem', marginBottom: '0.55rem' }}>
                      Catalysts
                    </div>
                    {idea.catalysts.catalysts}
                  </div>
                )}
              </article>

              <aside style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1.2rem', borderRadius: 28, background: 'rgba(255, 255, 255, 0.72)', border: `1px solid ${theme.colors.line}` }}>
                  <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.55rem' }}>
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

                <div style={{ padding: '1.2rem', borderRadius: 28, background: 'rgba(255, 255, 255, 0.72)', border: `1px solid ${theme.colors.line}` }}>
                  <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.7rem' }}>
                    Your call
                  </div>
                  <div style={{ display: 'grid', gap: '0.7rem' }}>
                    {(['buy', 'pass'] as Exclude<Choice, null>[]).map((option) => {
                      const active = choice === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setChoice(option)}
                          style={{ textAlign: 'left', padding: '1rem', borderRadius: 22, border: `1px solid ${active ? theme.colors.text : theme.colors.line}`, background: active ? theme.colors.text : theme.colors.surfaceStrong, color: active ? theme.colors.surfaceStrong : theme.colors.text }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: '0.35rem', textTransform: 'capitalize' }}>{option}</div>
                          <div style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: active ? 0.82 : 1 }}>
                            {option === 'buy' ? 'Commit to the thesis and accept the original case.' : 'Pass on the setup and wait for a better one.'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={!choice}
                    onClick={lockIn}
                    style={{ width: '100%', marginTop: '0.9rem', padding: '0.95rem 1.15rem', borderRadius: 18, border: 'none', background: theme.gradient, color: theme.colors.surfaceStrong, fontWeight: 800, opacity: choice ? 1 : 0.45, cursor: choice ? 'pointer' : 'not-allowed' }}
                  >
                    See the outcome
                  </button>
                </div>
              </aside>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GamePage;
