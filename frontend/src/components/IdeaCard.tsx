import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from 'react-query';
import { companiesApi, usersApi } from '../api/apiService';
import { Company, Idea, Performance, User } from '../types/api';
import { theme } from '../theme';

interface IdeaCardProps {
  idea: Idea;
  performance?: Performance;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, performance: initialPerformance }) => {
  const { id, company_id, user_id, date, is_short, is_contest_winner } = idea;
  const performance = initialPerformance;

  const { data: companies, isLoading: isCompanyLoading } = useQuery<Company[]>(
    ['company-search', company_id],
    () => companiesApi.getCompanies({ search: company_id }),
    { enabled: !!company_id, staleTime: 60000, cacheTime: 300000 },
  );
  const company = companies?.[0] ?? null;

  const { data: users, isLoading: isUserLoading } = useQuery<User[]>(
    ['user-search', user_id],
    () => usersApi.getUsers({ search: user_id }),
    { enabled: !!user_id, staleTime: 60000, cacheTime: 300000 },
  );
  const user = users?.[0] ?? null;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formatPerf = (value: number | null | undefined) => {
    if (value == null) return null;
    const pct = (value - 1) * 100;
    const adjusted = is_short ? -pct : pct;
    const positive = adjusted > 0;

    return (
      <span
        style={{
          color: positive ? theme.colors.success : theme.colors.danger,
          fontWeight: 700,
          fontSize: '0.8rem',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          letterSpacing: '-0.02em',
        }}
      >
        {positive ? '+' : ''}
        {adjusted.toFixed(1)}%
      </span>
    );
  };

  const perfItems = performance
    ? [
        { label: '1W', value: performance.oneWeekClosePerf },
        { label: '1M', value: performance.oneMonthPerf },
        { label: '6M', value: performance.sixMonthPerf },
        { label: '1Y', value: performance.oneYearPerf },
      ]
    : [];

  return (
    <RouterLink to={`/ideas/${id}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
      <div
        data-testid="idea-card"
        style={{
          height: '100%',
          padding: '1.25rem',
          borderRadius: 28,
          background: 'rgba(255, 255, 255, 0.78)',
          border: `1px solid ${theme.colors.line}`,
          boxShadow: `0 18px 36px ${theme.colors.shadow}`,
          color: theme.colors.text,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = 'translateY(-3px)';
          el.style.boxShadow = `0 24px 44px ${theme.colors.shadowStrong}`;
          el.style.borderColor = theme.colors.lineStrong;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = `0 18px 36px ${theme.colors.shadow}`;
          el.style.borderColor = theme.colors.line;
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.75rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontSize: '0.68rem',
                marginBottom: '0.55rem',
              }}
            >
              {formattedDate}
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: theme.fonts.display,
                fontSize: '1.28rem',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isCompanyLoading ? company_id : company?.company_name || company_id}
            </h3>
            <div style={{ marginTop: '0.35rem', color: theme.colors.textSoft, fontSize: '0.92rem' }}>
              {company?.ticker ? company.ticker : company_id}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'end' }}>
            <span
              style={{
                padding: '0.36rem 0.65rem',
                borderRadius: theme.radii.pill,
                fontSize: '0.66rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                background: is_short ? '#fff1ef' : '#eefaf7',
                color: is_short ? theme.colors.danger : theme.colors.success,
                border: `1px solid ${is_short ? 'rgba(176, 86, 86, 0.22)' : 'rgba(30, 122, 97, 0.2)'}`,
              }}
            >
              {is_short ? 'Short' : 'Long'}
            </span>
            {is_contest_winner && (
              <span
                style={{
                  padding: '0.36rem 0.65rem',
                  borderRadius: theme.radii.pill,
                  fontSize: '0.66rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                  background: '#f0f7ff',
                  color: theme.colors.accentBlue,
                  border: '1px solid rgba(127, 157, 245, 0.22)',
                }}
              >
                Winner
              </span>
            )}
          </div>
        </div>

        <div style={{ color: theme.colors.textSoft, fontSize: '0.92rem', lineHeight: 1.55 }}>
          by {isUserLoading ? user_id : user?.username || user_id}
        </div>

        {perfItems.length > 0 && (
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '0.95rem',
              borderTop: `1px solid ${theme.colors.line}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '0.45rem',
            }}
          >
            {perfItems.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '0.7rem 0.55rem',
                  borderRadius: 16,
                  background: theme.colors.surfaceTint,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: theme.colors.textMuted,
                    marginBottom: 4,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </div>
                <div>{formatPerf(value) ?? <span style={{ color: theme.colors.textMuted }}>-</span>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RouterLink>
  );
};

export default IdeaCard;
