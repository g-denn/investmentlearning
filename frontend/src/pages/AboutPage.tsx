import React from 'react';
import { pageMaxWidth, theme } from '../theme';

const sections = [
  {
    title: 'What this product is',
    copy: 'VIC Analytics is an independent interface for exploring investment ideas originally shared on ValueInvestorsClub.com. It is designed to make archival thesis research, pricing outcomes, and pattern spotting easier to navigate.',
  },
  {
    title: 'What ValueInvestorsClub is',
    copy: 'ValueInvestorsClub is a long-running investing community founded by Joel Greenblatt and John Petry where members publish detailed long and short theses. The archive is rich, but the native reading experience is not built like a modern research product.',
  },
  {
    title: 'What you can do here',
    copy: 'Browse by company or contributor, compare long and short ideas, inspect contest winners, and review price performance across multiple windows. Thesis Detective adds a lightweight practice mode on top of that archive.',
  },
  {
    title: 'Important disclaimer',
    copy: 'This site is for research and education only. It is not investment advice, does not guarantee the completeness of historical data, and is not affiliated with or endorsed by ValueInvestorsClub.com.',
  },
];

const AboutPage: React.FC = () => {
  return (
    <div style={{ padding: '1.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: pageMaxWidth, margin: '0 auto' }}>
        <section
          style={{
            padding: '2rem',
            borderRadius: 34,
            background: 'rgba(251, 248, 242, 0.8)',
            border: `1px solid ${theme.colors.line}`,
            boxShadow: `0 24px 50px ${theme.colors.shadow}`,
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div style={{ color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.72rem', marginBottom: '0.8rem' }}>
              About
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: theme.fonts.display,
                fontSize: 'clamp(2.3rem, 6vw, 4.6rem)',
                lineHeight: 0.94,
                letterSpacing: '-0.07em',
              }}
            >
              A clearer front end
              <br />
              for a valuable archive.
            </h1>
            <p style={{ margin: '1.25rem 0 0', color: theme.colors.textSoft, lineHeight: 1.7, fontSize: '1.02rem' }}>
              The goal is simple: make historical investment thinking easier to browse, compare, and learn from.
            </p>
          </div>
        </section>

        <section
          style={{
            marginTop: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {sections.map((section) => (
            <article
              key={section.title}
              style={{
                padding: '1.4rem',
                borderRadius: 28,
                background: 'rgba(255, 255, 255, 0.76)',
                border: `1px solid ${theme.colors.line}`,
                boxShadow: `0 18px 36px ${theme.colors.shadow}`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: theme.fonts.display,
                  fontSize: '1.4rem',
                  lineHeight: 1.02,
                  letterSpacing: '-0.05em',
                }}
              >
                {section.title}
              </h2>
              <p style={{ margin: '0.8rem 0 0', color: theme.colors.textSoft, lineHeight: 1.68 }}>
                {section.copy}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
