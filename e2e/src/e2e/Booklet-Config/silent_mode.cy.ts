import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('check parameter: silent_mode', { testIsolation: true }, () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('FALSE (default)', () => {
    loginTestTaker('Bklt_Config-50', '123');
    cy.get('.snackbar-time-started')
      .should('be.visible');
    cy.get('[data-cy="unit-title"]')
      .contains('Ende');
    cy.get('.snackbar-time-ended');
    cy.visit(`${Cypress.config().baseUrl}/#/t/3/u/4`);
    cy.get('[data-cy="toast-text-0"]');
  });

  it('TRUE', () => {
    loginTestTaker('Bklt_Config-51', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('.snackbar-time-started')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Ende');
    cy.get('.snackbar-time-ended')
      .should('not.exist');
    cy.visit(`${Cypress.config().baseUrl}/#/t/3/u/4`);
    cy.get('[data-cy="toast-text-0"]')
      .should('not.exist');
  });
});
