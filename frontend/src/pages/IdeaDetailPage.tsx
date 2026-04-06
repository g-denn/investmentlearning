import React from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import PerformanceChart from '../components/PerformanceChart';
import { useIdeaDetail, useIdeaPerformance } from '../hooks/useIdeas';
import { pageMaxWidth, theme } from '../theme';

const splitParagraphs = (value: string | undefined): string[] =>
  (value ?? '')
    .replace(/^Description\s*/i, '')
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s+\n/g, '\n').trim())
    .filter(Boolean);

const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: idea, isLoading, isError, error } = useIdeaDetail(id || '');
  const {
    data: performance,
    isLoading: isPerformanceLoading,
  } = useIdeaPerformance(id || '', { enabled: !!id });
  const performanceRef = React.useRef<HTMLElement | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
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
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <div style={{ padding: '2rem 1.25rem' }}>
        <div style={{ maxWidth: pageMaxWidth, margin: '0 auto' }}>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 24,
              background: '#fff4f2',
              border: '1px solid rgba(176, 86, 86, 0.24)',
              color: theme.colors.danger,
              marginBottom: '1rem',
            }}
          >
            {isError ? (error instanceof Error ? error.message : 'Error loading idea') : 'Idea not found'}
          </div>
          <RouterLink to="/ideas" style={{ color: theme.colors.text, fontWeight: 700, textDecoration: 'none' }}>
            Back to ideas
          </RouterLink>
        </div>
      </div>
    );
  }

  const {
    company_id,
    user_id,
    date,
    is_short,
    is_contest_winner,
    company,
    user,
    description,
    catalysts,
    link,
  } = idea;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasExtractedWriteup = Boolean(description?.description || catalysts?.catalysts);
  const descriptionParagraphs = splitParagraphs(description?.description);
  const catalystParagraphs = splitParagraphs(catalysts?.catalysts);
  const hasPerformance = Boolean(performance);

  return (
    <div style={{ padding: '1.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: pageMaxWidth, margin: '0 auto' }}>
        <RouterLink
          to="/ideas"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 0.95rem',
            marginBottom: '1rem',
            borderRadius: 16,
            border: `1px solid ${theme.colors.line}`,
            background: 'rgba(255, 255, 255, 0.66)',
            color: theme.colors.text,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to ideas
        </RouterLink>

        <section
          style={{
            padding: '2rem',
            borderRadius: 34,
            background: 'rgba(251, 248, 242, 0.8)',
            border: `1px solid ${theme.colors.line}`,
            boxShadow: `0 24px 50px ${theme.colors.shadow}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                {is_contest_winner && (
                  <span
                    style={{
                      padding: '0.36rem 0.7rem',
                      borderRadius: theme.radii.pill,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      background: '#f0f7ff',
                      color: theme.colors.accentBlue,
                      border: '1px solid rgba(127, 157, 245, 0.22)',
                    }}
                  >
                    Contest winner
                  </span>
                )}
              </div>

              <h1
                style={{
                  margin: 0,
                  fontFamily: theme.fonts.display,
                  fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
                  lineHeight: 0.94,
                  letterSpacing: '-0.07em',
                }}
              >
                {company?.company_name || company_id}
                {company?.ticker ? ` (${company.ticker})` : ''}
              </h1>
            </div>

            <div style={{ color: theme.colors.textSoft, lineHeight: 1.6, textAlign: 'right', display: 'grid', gap: '0.75rem', justifyItems: 'end' }}>
              <div>Published {formattedDate}</div>
              <div>by {user?.username || user_id}</div>
              {hasPerformance && (
                <button
                  type="button"
                  onClick={() => performanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: 18,
                    border: 'none',
                    background: theme.colors.text,
                    color: theme.colors.surfaceStrong,
                    fontWeight: 700,
                  }}
                >
                  View performance
                </button>
              )}
            </div>
          </div>
        </section>

        <div
          style={{
            marginTop: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <section
              style={{
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.76)',
                border: `1px solid ${theme.colors.line}`,
                boxShadow: `0 18px 36px ${theme.colors.shadow}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '1rem 1.2rem', borderBottom: `1px solid ${theme.colors.line}` }}>
                <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.35rem' }}>
                  Thesis
                </div>
                <div style={{ color: theme.colors.textSoft, lineHeight: 1.6 }}>
                  Read the extracted write-up first, then jump to the performance section below.
                </div>
              </div>

              {hasExtractedWriteup ? (
                <div style={{ padding: '1.25rem', display: 'grid', gap: '1.25rem' }}>
                  {descriptionParagraphs.length > 0 && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {descriptionParagraphs.map((paragraph, index) => (
                        <p key={`${paragraph}-${index}`} style={{ margin: 0, color: theme.colors.textSoft, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {catalystParagraphs.length > 0 && (
                    <div
                      style={{
                        padding: '1rem 1.05rem',
                        borderRadius: 22,
                        background: theme.colors.surfaceTint,
                        border: `1px solid ${theme.colors.line}`,
                      }}
                    >
                      <h2 style={{ margin: '0 0 0.7rem', fontFamily: theme.fonts.display, fontSize: '1.1rem', letterSpacing: '-0.04em' }}>
                        Catalysts
                      </h2>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {catalystParagraphs.map((paragraph, index) => (
                          <p key={`${paragraph}-${index}`} style={{ margin: 0, color: theme.colors.textSoft, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        width: 'fit-content',
                        padding: '0.85rem 1rem',
                        borderRadius: 18,
                        border: `1px solid ${theme.colors.line}`,
                        background: theme.colors.surfaceStrong,
                        color: theme.colors.text,
                        textDecoration: 'none',
                        fontWeight: 700,
                      }}
                    >
                      Open original VIC page
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: '1.25rem', color: theme.colors.textSoft }}>
                  No extracted thesis text is available for this idea.
                </div>
              )}
            </section>

            {(isPerformanceLoading || hasPerformance) && (
              <section
                ref={performanceRef}
                style={{
                  padding: '1.25rem',
                  borderRadius: 28,
                  background: 'rgba(255, 255, 255, 0.76)',
                  border: `1px solid ${theme.colors.line}`,
                  boxShadow: `0 18px 36px ${theme.colors.shadow}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: '1.45rem', letterSpacing: '-0.05em' }}>
                      Performance
                    </h2>
                    <p style={{ margin: '0.45rem 0 0', color: theme.colors.textSoft }}>
                      The chart below shows how the stock actually moved after publication.
                    </p>
                  </div>
                  {hasPerformance && (
                    <button
                      type="button"
                      onClick={() => performanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: 16,
                        border: `1px solid ${theme.colors.line}`,
                        background: theme.colors.surfaceStrong,
                        color: theme.colors.text,
                        fontWeight: 700,
                      }}
                    >
                      Performance section
                    </button>
                  )}
                </div>

                {isPerformanceLoading ? (
                  <p style={{ margin: 0, color: theme.colors.textSoft }}>Loading live market performance...</p>
                ) : performance ? (
                  <PerformanceChart performance={performance} isShort={is_short} />
                ) : null}
              </section>
            )}
          </div>

          <aside style={{ display: 'grid', gap: '1rem' }}>
            <section
              style={{
                padding: '1.25rem',
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.76)',
                border: `1px solid ${theme.colors.line}`,
                boxShadow: `0 18px 36px ${theme.colors.shadow}`,
              }}
            >
              <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.65rem' }}>
                Summary
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: '1.15rem', letterSpacing: '-0.04em' }}>
                    What you can do here
                  </h2>
                  <p style={{ margin: '0.55rem 0 0', color: theme.colors.textSoft, lineHeight: 1.75 }}>
                    Read the extracted thesis on the left, then use the performance section to compare the write-up against what actually happened in the market.
                  </p>
                </div>
                {!isPerformanceLoading && !hasPerformance && (
                  <div
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 18,
                      background: theme.colors.surfaceTint,
                      color: theme.colors.textSoft,
                      lineHeight: 1.6,
                    }}
                  >
                    Performance data is not available for this idea yet.
                  </div>
                )}
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      width: 'fit-content',
                      padding: '0.8rem 0.95rem',
                      borderRadius: 16,
                      border: `1px solid ${theme.colors.line}`,
                      background: theme.colors.surfaceStrong,
                      color: theme.colors.text,
                      textDecoration: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Open source page in a new tab
                  </a>
                )}
              </div>
            </section>

            <section
              style={{
                padding: '1.25rem',
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.76)',
                border: `1px solid ${theme.colors.line}`,
                boxShadow: `0 18px 36px ${theme.colors.shadow}`,
              }}
            >
              <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.72rem', marginBottom: '0.65rem' }}>
                Metadata
              </div>
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                <div>
                  <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Ticker</div>
                  <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{company?.ticker || company_id}</div>
                </div>
                <div>
                  <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Author</div>
                  <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{user?.username || user_id}</div>
                </div>
                <div>
                  <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Published</div>
                  <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{formattedDate}</div>
                </div>
                <div>
                  <div style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>Contest winner</div>
                  <div style={{ marginTop: '0.2rem', fontWeight: 700 }}>{is_contest_winner ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailPage;
