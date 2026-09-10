import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('check parameter: navbar_unit_controls_hidden', { testIsolation: true }, () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FALSE (default)', () => {
    loginTestTaker('Bklt_Config-38', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-label"]')
      .contains('Teilaufgabe 2/2');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
  });

  it('TRUE', () => {
    loginTestTaker('Bklt_Config-39', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('not.exist');
    cy.get('[data-cy="page-navigation-backward"]')
      .should('not.exist');
  });
});
