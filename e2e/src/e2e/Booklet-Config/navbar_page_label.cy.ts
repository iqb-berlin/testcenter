import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: navbar_page_label', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('INDEX (default)', () => {
    loginTestTaker('Bklt_Config-34', '123');
    cy.get('[data-cy="page-navigation-label"]')
      .contains('Teilaufgabe 1/2');
  });

  it('LABEL', () => {
    loginTestTaker('Bklt_Config-35', '123');
    cy.get('[data-cy="page-navigation-label"]')
      .contains('Aufgabe1: Fieldset1: response complete forward');
  });

  it('LIST', () => {
    loginTestTaker('Bklt_Config-36', '123');
    cy.get('[data-cy="page-navigation-list-0"]');
    cy.get('[data-cy="page-navigation-list-1"]');
  });

  it('HIDDEN', () => {
    loginTestTaker('Bklt_Config-37', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('not.exist');
    cy.get('[data-cy="page-navigation-label"]')
      .should('not.exist');
  });
});
