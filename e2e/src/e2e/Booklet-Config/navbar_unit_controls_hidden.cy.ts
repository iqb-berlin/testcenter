import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: navbar_unit_controls_hidden', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FALSE (default)', () => {
    loginTestTaker('Bklt_Config-32', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-navigation-label"]')
      .should('be.visible');
  });

  it('TRUE', () => {
    loginTestTaker('Bklt_Config-33', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('not.exist');
    cy.get('[data-cy="unit-navigation-label"]')
      .should('be.visible');
  });
});
