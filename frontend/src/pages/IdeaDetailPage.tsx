import React from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import PerformanceChart from '../components/PerformanceChart';
import { useIdeaDetail, useIdeaPerformance } from '../hooks/useIdeas';
import { pageMaxWidth, theme } from '../theme';

type EmbedState = 'loading' | 'ready' | 'error';

const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: idea, isLoading, isError, error } = useIdeaDetail(id || '');
  const {
    data: performance,
    isLoading: isPerformanceLoading,
  } = useIdeaPerformance(id || '', { enabled: !!id });
  const [embedState, setEmbedState] = React.useState<EmbedState>('loading');

  React.useEffect(() => {
    setEmbedState('loading');
  }, [idea?.link]);

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
                <span
                  style={{
                    padding: '0.36rem 0.7rem',
                    borderRadius: theme.radii.pill,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    background: is_short ? '#fff1ef' : '#eefaf7',
                    color: is_short ? theme.colors.danger : theme.colors.success,
                    border: `1px solid ${is_short ? 'rgba(176, 86, 86, 0.22)' : 'rgba(30, 122, 97, 0.2)'}`,
                  }}
                >
                  {is_short ? 'Short thesis' : 'Long thesis'}
                </span>
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

            <div style={{ color: theme.colors.textSoft, lineHeight: 1.6, textAlign: 'right' }}>
              <div>Published {formattedDate}</div>
              <div>by {user?.username || user_id}</div>
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
                  Original VIC write-up
                </div>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.text, textDecoration: 'none', fontWeight: 700 }}>
                    Open original page
                  </a>
                )}
              </div>

              {link ? (
                <div style={{ position: 'relative', minHeight: 900 }}>
                  {embedState !== 'ready' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'rgba(251, 248, 242, 0.88)',
                        color: theme.colors.textSoft,
                        zIndex: 1,
                      }}
                    >
                      {embedState === 'error'
                        ? 'The embedded page could not be displayed here.'
                        : 'Loading the original VIC layout...'}
                    </div>
                  )}
                  <iframe
                    title={`Original write-up for ${company?.ticker || company_id}`}
                    src={link}
                    style={{ width: '100%', minHeight: 900, border: 0, background: '#fff' }}
                    onLoad={() => setEmbedState('ready')}
                    onError={() => setEmbedState('error')}
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div style={{ padding: '1.25rem', color: theme.colors.textSoft }}>
                  No original VIC link is available for this idea.
                </div>
              )}
            </section>

            {isPerformanceLoading ? (
              <section
                style={{
                  padding: '1.25rem',
                  borderRadius: 28,
                  background: 'rgba(255, 255, 255, 0.76)',
                  border: `1px solid ${theme.colors.line}`,
                  boxShadow: `0 18px 36px ${theme.colors.shadow}`,
                }}
              >
                <h2 style={{ margin: '0 0 0.75rem', fontFamily: theme.fonts.display, fontSize: '1.45rem', letterSpacing: '-0.05em' }}>
                  Performance
                </h2>
                <p style={{ margin: 0, color: theme.colors.textSoft }}>Loading live market performance...</p>
              </section>
            ) : performance ? (
              <PerformanceChart performance={performance} isShort={is_short} />
            ) : (
              <section
                style={{
                  padding: '1.25rem',
                  borderRadius: 28,
                  background: 'rgba(255, 255, 255, 0.76)',
                  border: `1px solid ${theme.colors.line}`,
                  boxShadow: `0 18px 36px ${theme.colors.shadow}`,
                }}
              >
                <h2 style={{ margin: '0 0 0.75rem', fontFamily: theme.fonts.display, fontSize: '1.45rem', letterSpacing: '-0.05em' }}>
                  Performance
                </h2>
                <p style={{ margin: 0, color: theme.colors.textSoft }}>No performance data available.</p>
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
              {hasExtractedWriteup ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {description?.description && (
                    <div>
                      <h2 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: '1.15rem', letterSpacing: '-0.04em' }}>
                        Thesis
                      </h2>
                      <p style={{ margin: '0.55rem 0 0', color: theme.colors.textSoft, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                        {description.description}
                      </p>
                    </div>
                  )}
                  {catalysts?.catalysts && (
                    <div>
                      <h2 style={{ margin: 0, fontFamily: theme.fonts.display, fontSize: '1.15rem', letterSpacing: '-0.04em' }}>
                        Catalysts
                      </h2>
                      <p style={{ margin: '0.55rem 0 0', color: theme.colors.textSoft, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                        {catalysts.catalysts}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, color: theme.colors.textSoft }}>
                  No extracted thesis text is available for this idea.
                </p>
              )}
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
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailPage;
