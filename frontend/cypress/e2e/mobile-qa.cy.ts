describe('Mobile layout QA', () => {
  const expectNoHorizontalOverflow = () => {
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth, 'document width').to.be.lte(390);
      expect(doc.body.scrollWidth, 'body width').to.be.lte(390);
    });
  };

  beforeEach(() => {
    cy.viewport(390, 844);
  });

  it('renders the homepage cleanly on mobile', () => {
    cy.visit('/');
    cy.contains(/Understand/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/conviction/i).should('be.visible');
    cy.contains('Overview').should('be.visible');
    cy.contains('Ideas').should('be.visible');
    expectNoHorizontalOverflow();
    cy.screenshot('mobile-homepage', { capture: 'viewport' });
  });

  it('renders the ideas archive cleanly on mobile', () => {
    cy.visit('/ideas');
    cy.get('[data-testid="company-search"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="idea-card"]').should('have.length.at.least', 1);
    expectNoHorizontalOverflow();
    cy.screenshot('mobile-ideas', { capture: 'viewport' });
  });

  it('renders an idea detail page without horizontal crowding on mobile', () => {
    cy.visit('/ideas');
    cy.get('[data-testid="idea-card"]', { timeout: 10000 }).first().click();
    cy.contains('Summary', { timeout: 10000 }).should('be.visible');
    expectNoHorizontalOverflow();
    cy.screenshot('mobile-idea-detail', { capture: 'viewport' });
  });

  it('renders the thesis detective flow on mobile', () => {
    cy.visit('/game');
    cy.contains('Thesis Detective', { timeout: 15000 }).should('be.visible');
    cy.contains('Your call', { timeout: 15000 }).should('be.visible');
    expectNoHorizontalOverflow();
    cy.screenshot('mobile-game', { capture: 'viewport' });
  });
});
