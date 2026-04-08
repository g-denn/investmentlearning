import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageMaxWidth, theme } from '../theme';

const HERO_POINTS = [
  'Search long and short ideas with real thesis context.',
  'Compare outcomes across 1W, 1M, 6M, 1Y, and beyond.',
  'Practice conviction before seeing how the market resolved it.',
];

const FEATURE_BLOCKS = [
  {
    eyebrow: 'Library',
    title: 'Browse the archive like a research desk, not a spreadsheet dump.',
    copy: 'Move through historical VIC write-ups with cleaner filtering, faster scanning, and a stronger sense of what each idea actually argued.',
    href: '/ideas',
    cta: 'Browse ideas',
  },
  {
    eyebrow: 'Outcomes',
    title: 'See whether the thesis worked, not just whether the stock moved.',
    copy: 'Performance views make long and short positions readable, so you can evaluate process and outcome together instead of reading static snapshots.',
    href: '/ideas?has_performance=true',
    cta: 'View priced ideas',
  },
  {
    eyebrow: 'Practice',
    title: 'Use Thesis Detective to train judgment with historical context.',
    copy: 'Read the original setup, commit to buy or pass, then reveal what happened. It turns the archive into a learning loop instead of passive reading.',
    href: '/game',
    cta: 'Play Thesis Detective',
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const MOBILE_STYLES = `
  @media (max-width: 760px) {
    .home-hero {
      padding: 2rem 1.2rem !important;
      border-radius: 28px !important;
    }

    .home-hero-title {
      font-size: clamp(2.9rem, 14vw, 4.2rem) !important;
      line-height: 0.95 !important;
    }

    .home-hero-copy {
      font-size: 1rem !important;
    }

    .home-hero-points {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
`;

const HomePage: React.FC = () => {
  return (
    <div style={{ padding: '2rem 1.25rem 5rem' }}>
      <style>{MOBILE_STYLES}</style>
      <section style={{ maxWidth: pageMaxWidth, margin: '0 auto' }}>
        <motion.div
          {...fadeUp(0.05)}
          className="home-hero"
          style={{
            padding: '3.5rem clamp(1.5rem, 4vw, 3.5rem)',
            borderRadius: 40,
            background:
              'radial-gradient(circle at 20% 0%, rgba(107, 207, 190, 0.18), transparent 28%), radial-gradient(circle at 90% 10%, rgba(127, 157, 245, 0.18), transparent 24%), rgba(251, 248, 242, 0.9)',
            border: `1px solid ${theme.colors.line}`,
            boxShadow: `0 30px 80px ${theme.colors.shadow}`,
          }}
        >
          <div
            style={{
              maxWidth: 860,
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.55rem 0.9rem',
                borderRadius: theme.radii.pill,
                border: `1px solid ${theme.colors.line}`,
                background: 'rgba(255, 255, 255, 0.7)',
                color: theme.colors.textSoft,
                fontSize: '0.82rem',
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: theme.colors.accent,
                }}
              />
              Independent research interface for VIC archives
            </div>

            <motion.h1
              {...fadeUp(0.15)}
              className="home-hero-title"
              style={{
                margin: 0,
                fontFamily: theme.fonts.display,
                fontSize: 'clamp(3.8rem, 10vw, 7.25rem)',
                lineHeight: 0.92,
                letterSpacing: '-0.07em',
                color: theme.colors.text,
              }}
            >
              Understand{' '}
              <span
                style={{
                  background: theme.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                conviction
              </span>
              <br />
              through outcomes.
            </motion.h1>

            <motion.p
              {...fadeUp(0.25)}
              className="home-hero-copy"
              style={{
                maxWidth: 760,
                margin: '1.5rem auto 0',
                fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
                lineHeight: 1.65,
                color: theme.colors.textSoft,
              }}
            >
              Explore historical investment theses, trace what happened after publication,
              and turn a dense archive into something that feels calm, legible, and useful.
            </motion.p>

            <motion.div
              {...fadeUp(0.35)}
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '0.9rem',
                flexWrap: 'wrap',
              }}
            >
              <RouterLink
                to="/ideas"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem 1.45rem',
                  borderRadius: 20,
                  background: theme.colors.text,
                  color: theme.colors.surfaceStrong,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Browse all ideas
              </RouterLink>
              <RouterLink
                to="/game"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem 1.45rem',
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.72)',
                  color: theme.colors.text,
                  textDecoration: 'none',
                  fontWeight: 600,
                  border: `1px solid ${theme.colors.line}`,
                }}
              >
                Try Thesis Detective
              </RouterLink>
            </motion.div>

            <motion.div
              {...fadeUp(0.45)}
              className="home-hero-points"
              style={{
                marginTop: '2.3rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.8rem',
                textAlign: 'left',
              }}
            >
              {HERO_POINTS.map((point) => (
                <div
                  key={point}
                  style={{
                    padding: '1rem 1.05rem',
                    borderRadius: 18,
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${theme.colors.line}`,
                    color: theme.colors.textSoft,
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                  }}
                >
                  {point}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section style={{ maxWidth: pageMaxWidth, margin: '3rem auto 0' }}>
        <motion.div
          {...fadeUp(0.05)}
          style={{
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'end',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                fontSize: '0.72rem',
                marginBottom: '0.6rem',
              }}
            >
              Product overview
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: theme.fonts.display,
                fontSize: 'clamp(2rem, 5vw, 3.6rem)',
                lineHeight: 0.97,
                letterSpacing: '-0.06em',
              }}
            >
              A cleaner front end for
              <br />
              archival investing research.
            </h2>
          </div>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {FEATURE_BLOCKS.map((block, index) => (
            <motion.div
              key={block.title}
              {...fadeUp(index * 0.08)}
              style={{
                padding: '1.5rem',
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.76)',
                border: `1px solid ${theme.colors.line}`,
                boxShadow: `0 18px 35px ${theme.colors.shadow}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              <div
                style={{
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontSize: '0.72rem',
                }}
              >
                {block.eyebrow}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: theme.fonts.display,
                  fontSize: '1.45rem',
                  lineHeight: 1.05,
                  letterSpacing: '-0.05em',
                }}
              >
                {block.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: theme.colors.textSoft,
                  lineHeight: 1.65,
                  fontSize: '0.98rem',
                  flex: 1,
                }}
              >
                {block.copy}
              </p>
              <RouterLink
                to={block.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  width: 'fit-content',
                  padding: '0.8rem 1rem',
                  borderRadius: 16,
                  background: theme.colors.surfaceTint,
                  border: `1px solid ${theme.colors.line}`,
                  color: theme.colors.text,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {block.cta}
              </RouterLink>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
