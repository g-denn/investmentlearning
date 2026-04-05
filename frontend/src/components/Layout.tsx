import React from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { pageMaxWidth, theme } from '../theme';

const NAV_ITEMS = [
  { label: 'Overview', href: '/' },
  { label: 'Ideas', href: '/ideas' },
  { label: 'Thesis Detective', href: '/game' },
  { label: 'About', href: '/about' },
];

const GLOBAL_STYLES = `
  .shell-link {
    color: ${theme.colors.textSoft};
    font-size: 0.95rem;
    text-decoration: none;
    transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
  }

  .shell-link:hover {
    color: ${theme.colors.text};
  }

  .shell-nav-link {
    padding: 0.6rem 0.95rem;
    border-radius: 999px;
    border: 1px solid transparent;
  }

  .shell-nav-link.is-active {
    color: ${theme.colors.text};
    background: rgba(255, 255, 255, 0.68);
    border-color: ${theme.colors.line};
    box-shadow: 0 10px 20px rgba(33, 24, 12, 0.06);
  }
`;

const Layout: React.FC = () => {
  const location = useLocation();

  const active = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <div
      style={{
        minHeight: '100vh',
        color: theme.colors.text,
        position: 'relative',
      }}
    >
      <style>{GLOBAL_STYLES}</style>

      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-12rem',
            left: '-10rem',
            width: '34rem',
            height: '34rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107, 207, 190, 0.22), transparent 68%)',
            filter: 'blur(24px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-10rem',
            top: '5rem',
            width: '32rem',
            height: '32rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(127, 157, 245, 0.18), transparent 68%)',
            filter: 'blur(26px)',
          }}
        />
      </div>

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '1rem 1.25rem',
        }}
      >
        <div
          style={{
            maxWidth: pageMaxWidth,
            margin: '0 auto',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: 'space-between',
            background: 'rgba(251, 248, 242, 0.76)',
            border: `1px solid ${theme.colors.line}`,
            borderRadius: theme.radii.lg,
            backdropFilter: 'blur(18px)',
            boxShadow: `0 18px 40px ${theme.colors.shadow}`,
          }}
        >
          <RouterLink
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.7rem',
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: theme.gradient,
                display: 'grid',
                placeItems: 'center',
                color: theme.colors.surfaceStrong,
                fontFamily: theme.fonts.display,
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: `0 14px 28px ${theme.colors.shadow}`,
              }}
            >
              V
            </div>
            <div>
              <div
                style={{
                  fontFamily: theme.fonts.display,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.04em',
                }}
              >
                VIC Analytics
              </div>
              <div
                style={{
                  color: theme.colors.textMuted,
                  fontSize: '0.76rem',
                }}
              >
                Historical thesis research
              </div>
            </div>
          </RouterLink>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <RouterLink
                key={item.href}
                to={item.href}
                className={`shell-link shell-nav-link${active(item.href) ? ' is-active' : ''}`}
              >
                {item.label}
              </RouterLink>
            ))}
          </div>

          <RouterLink
            to="/ideas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.8rem 1.15rem',
              borderRadius: theme.radii.pill,
              background: theme.colors.text,
              color: theme.colors.surfaceStrong,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              whiteSpace: 'nowrap',
            }}
          >
            Explore ideas
          </RouterLink>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer
        style={{
          padding: '2rem 1.25rem 3rem',
        }}
      >
        <div
          style={{
            maxWidth: pageMaxWidth,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: '1.25rem',
            borderTop: `1px solid ${theme.colors.line}`,
            color: theme.colors.textSoft,
            fontSize: '0.9rem',
          }}
        >
          <p>
            {new Date().getFullYear()} VIC Analytics. Independent research tooling for ValueInvestorsClub archives.
          </p>
          <p>Not affiliated with ValueInvestorsClub.com.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
