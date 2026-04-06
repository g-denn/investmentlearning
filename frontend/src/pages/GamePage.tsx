import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ideasApi } from '../api/apiService';
import { IdeaDetail, Performance } from '../types/api';
import { pageMaxWidth, theme } from '../theme';

const TIMER_SECONDS = 120;

type Phase = 'loading' | 'decision' | 'error';
type PredictionHorizon = '6m' | '1y' | '5y';
type HorizonAccessor = 'sixMonthPerf' | 'oneYearPerf' | 'fiveYearPerf';

const HORIZON_CONFIG: { id: PredictionHorizon; label: string; accessor: HorizonAccessor }[] = [
  { id: '6m', label: '6 months', accessor: 'sixMonthPerf' },
  { id: '1y', label: '1 year', accessor: 'oneYearPerf' },
  { id: '5y', label: '5 years', accessor: 'fiveYearPerf' },
];

const gamePalette = {
  pageBg: '#f4efe6',
  halo: 'rgba(184, 138, 68, 0.12)',
  haloSoft: 'rgba(109, 130, 101, 0.12)',
  surface: 'rgba(252, 248, 241, 0.92)',
  surfaceStrong: '#fffdf8',
  surfaceMuted: '#f1e9dc',
  text: '#1f2430',
  textSoft: '#5e5a52',
  textMuted: '#8d7d68',
  line: '#d8ccb9',
  lineStrong: '#bda584',
  gold: '#b88a44',
  goldSoft: '#f6ead8',
  sage: '#6d8265',
  sageSoft: '#edf2e8',
  danger: '#9d5a52',
  dangerSoft: '#f7e7e2',
  rail: '#1d1a17',
  railSoft: 'rgba(255,255,255,0.07)',
  railLine: 'rgba(255,255,255,0.14)',
  progress: 'linear-gradient(90deg, #6d8265 0%, #b88a44 100%)',
  shadow: 'rgba(47, 34, 18, 0.10)',
  shadowStrong: 'rgba(22, 16, 10, 0.24)',
};

const cardStyle: React.CSSProperties = {
  borderRadius: 28,
  border: `1px solid ${gamePalette.line}`,
  background: gamePalette.surface,
  boxShadow: `0 24px 50px ${gamePalette.shadow}`,
};

const splitParagraphs = (value: string | undefined): string[] =>
  (value ?? '')
    .replace(/^Description\s*/i, '')
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s+\n/g, '\n').trim())
    .filter(Boolean);

const looksLikeQuote = (paragraph: string): boolean =>
  paragraph.length <= 180 && (paragraph.includes('"') || paragraph.startsWith('--') || paragraph.startsWith('-'));

const toReturnPct = (ratio: number | null | undefined): number | null =>
  ratio == null ? null : (ratio - 1) * 100;

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [prediction, setPrediction] = useState(20);
  const [selectedHorizon, setSelectedHorizon] = useState<PredictionHorizon | null>(null);
  const [performancePreview, setPerformancePreview] = useState<Performance | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialLoadStartedRef = useRef(false);
  const ideaRequestRef = useRef(0);

  const loadIdea = useCallback(async () => {
    const requestId = ++ideaRequestRef.current;
    setPhase('loading');
    setSecondsLeft(TIMER_SECONDS);
    setErrorMsg('');
    setPrediction(20);
    setSelectedHorizon(null);
    setPerformancePreview(null);

    try {
      const data = await ideasApi.getRandomIdea();
      if (requestId !== ideaRequestRef.current) return;
      setIdea(data);
      const preview = await ideasApi.getIdeaPerformance(data.id);
      if (requestId !== ideaRequestRef.current) return;
      setPerformancePreview(preview);
      const firstAvailableHorizon =
        HORIZON_CONFIG.find((item) => preview?.[item.accessor] != null)?.id ?? null;
      setSelectedHorizon(firstAvailableHorizon);
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
    if (!idea || !selectedHorizon || phase !== 'decision') return;
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(
      `/game/reveal/${encodeURIComponent(idea.id)}?horizon=${selectedHorizon}&expected=${prediction}`,
      {
        state: { idea, horizon: selectedHorizon, expectedReturn: prediction },
      },
    );
  };

  const historicalDate = idea?.date
    ? new Date(idea.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const descriptionParagraphs = splitParagraphs(idea?.description?.description);
  const catalystParagraphs = splitParagraphs(idea?.catalysts?.catalysts);
  const availableHorizons = HORIZON_CONFIG.map((item) => ({
    ...item,
    value: toReturnPct(performancePreview?.[item.accessor] ?? null),
    available: performancePreview?.[item.accessor] != null,
  }));
  const selectedHorizonLabel = availableHorizons.find((item) => item.id === selectedHorizon)?.label ?? 'selected window';
  const projectedMood =
    prediction >= 40 ? 'Big upside call.' : prediction >= 10 ? 'Constructive view.' : prediction > -10 ? 'Pretty flat outcome.' : 'You expect downside.';
  const projectedCopy =
    prediction >= 40
      ? 'You are calling for a strong move over your chosen window.'
      : prediction >= 10
        ? 'You expect the stock to work, but not explode.'
        : prediction > -10
          ? 'You think the stock will mostly drift.'
          : 'You think the stock will disappoint over this window.';
  const sliderFill = `${((prediction + 100) / 300) * 100}%`;
  const predictionTone =
    prediction > 0 ? gamePalette.sage : prediction < 0 ? gamePalette.danger : gamePalette.gold;
  const horizonSummary = availableHorizons
    .filter((item) => item.available)
    .map((item) => item.label)
    .join(', ');

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '1.25rem 1.25rem 4rem',
        background: `radial-gradient(circle at top left, ${gamePalette.halo}, transparent 30%), radial-gradient(circle at right top, ${gamePalette.haloSoft}, transparent 24%), ${gamePalette.pageBg}`,
        color: gamePalette.text,
      }}
    >
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
            <div style={{ color: gamePalette.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem' }}>
              Practice mode
            </div>
            <div style={{ fontFamily: theme.fonts.display, fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.05em', color: gamePalette.text }}>
              Thesis Detective
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            <RouterLink to="/" style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: `1px solid ${gamePalette.line}`, background: gamePalette.surfaceStrong, color: gamePalette.text, textDecoration: 'none', fontWeight: 600 }}>
              Home
            </RouterLink>
            <RouterLink to="/ideas" style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: `1px solid ${gamePalette.line}`, background: gamePalette.surfaceStrong, color: gamePalette.text, textDecoration: 'none', fontWeight: 600 }}>
              Browse ideas
            </RouterLink>
            {phase === 'decision' && (
              <button type="button" onClick={loadIdea} style={{ padding: '0.7rem 0.95rem', borderRadius: 16, border: '1px solid transparent', background: gamePalette.rail, color: gamePalette.surfaceStrong, fontWeight: 700 }}>
                Skip thesis
              </button>
            )}
          </div>
        </header>

        {phase === 'loading' && (
          <section style={{ ...cardStyle, minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 1rem', border: `3px solid ${gamePalette.text}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: gamePalette.textSoft }}>Loading a historical thesis...</div>
            </div>
            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
          </section>
        )}

        {phase === 'error' && (
          <section style={{ padding: '1.5rem', borderRadius: 28, background: gamePalette.dangerSoft, border: `1px solid ${gamePalette.line}`, color: gamePalette.danger }}>
            <p style={{ margin: '0 0 1rem' }}>{errorMsg}</p>
            <button type="button" onClick={loadIdea} style={{ padding: '0.85rem 1.1rem', borderRadius: 16, border: 'none', background: gamePalette.rail, color: gamePalette.surfaceStrong, fontWeight: 700 }}>
              Try again
            </button>
          </section>
        )}

        {phase === 'decision' && idea && (
          <section
            style={{
              ...cardStyle,
              padding: '2rem',
              background:
                `radial-gradient(circle at top left, ${gamePalette.haloSoft}, transparent 24%), radial-gradient(circle at top right, ${gamePalette.halo}, transparent 18%), ${gamePalette.surface}`,
            }}
          >
            <style>{`
              .game-decision-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.5fr) minmax(300px, 360px);
                gap: 1rem;
                align-items: start;
              }

              .game-meta-strip {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                align-items: center;
              }

              .game-thesis-body {
                display: grid;
                gap: 1rem;
              }

              @media (max-width: 980px) {
                .game-decision-grid {
                  grid-template-columns: minmax(0, 1fr);
                }
              }
            `}</style>

            <div
              style={{
                padding: '1.4rem',
                borderRadius: 30,
                background: 'rgba(255, 253, 248, 0.92)',
                border: `1px solid ${gamePalette.line}`,
                boxShadow: `0 20px 40px ${gamePalette.shadow}`,
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', flexWrap: 'wrap' }}>
                <div style={{ maxWidth: 820 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                    {idea.is_contest_winner && (
                      <span style={{ padding: '0.38rem 0.72rem', borderRadius: theme.radii.pill, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: gamePalette.goldSoft, color: gamePalette.gold, border: '1px solid rgba(184, 138, 68, 0.18)' }}>
                        Contest winner
                      </span>
                    )}
                  </div>

                  <h1 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: 'clamp(2.2rem, 6vw, 4.6rem)', lineHeight: 0.92, letterSpacing: '-0.075em', maxWidth: '14ch', color: gamePalette.text }}>
                    {idea.company?.company_name || idea.company_id}
                    {idea.company?.ticker ? ` (${idea.company.ticker})` : ''}
                  </h1>
                </div>

                <div
                  style={{
                    minWidth: 260,
                    flex: '0 0 320px',
                    padding: '1rem 1.05rem',
                    borderRadius: 24,
                    background: gamePalette.surfaceStrong,
                    border: `1px solid ${gamePalette.line}`,
                  }}
                >
                  <div style={{ color: gamePalette.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.45rem' }}>
                    Decision timer
                  </div>
                  <div style={{ fontFamily: theme.fonts.display, fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.06em', color: gamePalette.text }}>{timerDisplay}</div>
                  <div style={{ marginTop: '0.75rem', height: 8, borderRadius: 999, background: gamePalette.surfaceMuted, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(secondsLeft / TIMER_SECONDS) * 100}%`, background: gamePalette.progress, transition: 'width 1s linear' }} />
                  </div>
                </div>
              </div>

              <div className="game-meta-strip" style={{ marginTop: '1.25rem' }}>
                <div style={{ padding: '0.9rem 1rem', borderRadius: 20, background: gamePalette.surfaceMuted, border: `1px solid ${gamePalette.line}`, minWidth: 180 }}>
                  <div style={{ color: gamePalette.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Published</div>
                  <div style={{ marginTop: '0.25rem', fontWeight: 700, color: gamePalette.text }}>{historicalDate}</div>
                </div>
                <div style={{ padding: '0.9rem 1rem', borderRadius: 20, background: gamePalette.surfaceMuted, border: `1px solid ${gamePalette.line}`, minWidth: 180 }}>
                  <div style={{ color: gamePalette.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Author</div>
                  <div style={{ marginTop: '0.25rem', fontWeight: 700, color: gamePalette.text }}>{idea.user?.username || idea.user_id}</div>
                </div>
                {horizonSummary && (
                  <div style={{ padding: '0.9rem 1rem', borderRadius: 20, background: gamePalette.surfaceMuted, border: `1px solid ${gamePalette.line}`, minWidth: 220 }}>
                    <div style={{ color: gamePalette.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Available windows</div>
                    <div style={{ marginTop: '0.25rem', fontWeight: 700, color: gamePalette.text }}>{horizonSummary}</div>
                  </div>
                )}
                {idea.link && (
                  <a
                    href={idea.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.95rem 1rem',
                      borderRadius: 20,
                      background: gamePalette.surfaceStrong,
                      border: `1px solid ${gamePalette.line}`,
                      color: gamePalette.text,
                      textDecoration: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Open original write-up
                  </a>
                )}
              </div>
            </div>

            <div className="game-decision-grid">
              <article
                style={{
                  padding: '1.4rem',
                  borderRadius: 30,
                  background: 'rgba(255, 253, 248, 0.9)',
                  border: `1px solid ${gamePalette.line}`,
                  boxShadow: `0 18px 36px ${gamePalette.shadow}`,
                }}
              >
                <div style={{ color: gamePalette.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.9rem' }}>
                  Historical thesis
                </div>

                <div className="game-thesis-body">
                  {descriptionParagraphs.length > 0 ? (
                    descriptionParagraphs.map((paragraph, index) =>
                      looksLikeQuote(paragraph) ? (
                        <div
                          key={`${paragraph}-${index}`}
                          style={{
                            padding: '1.1rem 1.2rem',
                            borderRadius: 24,
                            background: index === 0 ? 'linear-gradient(135deg, rgba(109,130,101,0.14), rgba(184,138,68,0.14))' : gamePalette.surfaceMuted,
                            border: `1px solid ${gamePalette.line}`,
                            color: gamePalette.text,
                            fontFamily: theme.fonts.display,
                            fontSize: paragraph.length < 90 ? '1.35rem' : '1.1rem',
                            lineHeight: 1.45,
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {paragraph}
                        </div>
                      ) : (
                        <p
                          key={`${paragraph}-${index}`}
                          style={{
                            margin: 0,
                            color: gamePalette.textSoft,
                            lineHeight: 1.9,
                            fontSize: '1.02rem',
                            maxWidth: '76ch',
                          }}
                        >
                          {paragraph}
                        </p>
                      ),
                    )
                  ) : (
                    <p style={{ margin: 0, color: gamePalette.textSoft }}>No description available.</p>
                  )}
                </div>

                {catalystParagraphs.length > 0 && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1.15rem 1.2rem',
                      borderRadius: 24,
                      background: gamePalette.surfaceStrong,
                      border: `1px solid ${gamePalette.line}`,
                    }}
                  >
                    <div style={{ color: gamePalette.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.72rem', marginBottom: '0.75rem' }}>
                      Catalysts
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {catalystParagraphs.map((paragraph, index) => (
                        <p key={`${paragraph}-${index}`} style={{ margin: 0, color: gamePalette.textSoft, lineHeight: 1.75 }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              <aside style={{ display: 'grid', gap: '1rem' }}>
                <div
                  style={{
                    padding: '1.2rem',
                    borderRadius: 30,
                    background: gamePalette.rail,
                    color: gamePalette.surfaceStrong,
                    boxShadow: `0 20px 38px ${gamePalette.shadowStrong}`,
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.75rem' }}>
                    Your call
                  </div>
                  <div style={{ fontFamily: theme.fonts.display, fontSize: '1.55rem', lineHeight: 1.02, letterSpacing: '-0.05em', marginBottom: '0.45rem' }}>
                    Forecast the return, then test yourself.
                  </div>
                  <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                    Pick a time window and set the return you expect. We will compare your forecast with what actually happened.
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.72rem', marginBottom: '0.65rem' }}>
                      Time window
                    </div>
                    <div style={{ display: 'grid', gap: '0.65rem' }}>
                      {availableHorizons.map((item) => {
                        const active = selectedHorizon === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={!item.available}
                            onClick={() => item.available && setSelectedHorizon(item.id)}
                            style={{
                              textAlign: 'left',
                              padding: '0.9rem 1rem',
                              borderRadius: 20,
                              border: `1px solid ${active ? 'rgba(184, 138, 68, 0.92)' : gamePalette.railLine}`,
                              background: active ? 'linear-gradient(135deg, rgba(184,138,68,0.2), rgba(109,130,101,0.24))' : gamePalette.railSoft,
                              color: item.available ? gamePalette.surfaceStrong : 'rgba(255,255,255,0.38)',
                              cursor: item.available ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: item.available ? 0.82 : 0.55 }}>
                              {item.available ? 'Actual result available for scoring.' : 'Not enough market history yet.'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.9rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.72rem', marginBottom: '0.65rem' }}>
                      Expected return
                    </div>
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 22,
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${gamePalette.railLine}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' }}>
                        <div style={{ fontFamily: theme.fonts.display, fontSize: '2rem', letterSpacing: '-0.06em', color: gamePalette.surfaceStrong }}>
                          {prediction > 0 ? '+' : ''}{prediction}%
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.84rem' }}>
                          over {selectedHorizonLabel}
                        </div>
                      </div>
                      <div style={{ marginTop: '0.55rem', color: 'rgba(255,255,255,0.76)', lineHeight: 1.55 }}>
                        <div style={{ fontWeight: 700, color: gamePalette.surfaceStrong, marginBottom: '0.2rem' }}>{projectedMood}</div>
                        <div>{projectedCopy}</div>
                      </div>
                      <div style={{ position: 'relative', marginTop: '1rem' }}>
                        <div style={{ position: 'absolute', inset: '50% 0 auto 0', height: 6, transform: 'translateY(-50%)', borderRadius: 999, background: 'rgba(255,255,255,0.12)' }} />
                        <div style={{ position: 'absolute', inset: '50% auto auto 0', height: 6, width: sliderFill, transform: 'translateY(-50%)', borderRadius: 999, background: predictionTone }} />
                        <input
                          aria-label="Expected return slider"
                          type="range"
                          min={-100}
                          max={200}
                          step={5}
                          value={prediction}
                          onChange={(event) => setPrediction(Number(event.target.value))}
                          style={{
                            position: 'relative',
                            width: '100%',
                            margin: 0,
                            background: 'transparent',
                            accentColor: predictionTone,
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem' }}>
                        <span>-100%</span>
                        <span>0%</span>
                        <span>+200%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedHorizon}
                    onClick={lockIn}
                    style={{
                      width: '100%',
                      marginTop: '1rem',
                      padding: '1rem 1.15rem',
                      borderRadius: 18,
                      border: 'none',
                      background: selectedHorizon ? gamePalette.gold : 'rgba(255,255,255,0.18)',
                      color: selectedHorizon ? gamePalette.rail : 'rgba(255,255,255,0.55)',
                      fontWeight: 800,
                      cursor: selectedHorizon ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Score my forecast
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
