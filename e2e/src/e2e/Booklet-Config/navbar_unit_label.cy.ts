import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('check parameter: navbar_unit_label', { testIsolation: true }, () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('INDEX (default)', () => {
    loginTestTaker('Bklt_Config-29', '123');
    cy.get('[data-cy="unit-navigation-label"]')
      .contains('Aufgabe 1/2');
  });

  it('LABEL', () => {
    loginTestTaker('Bklt_Config-30', '123');
    cy.get('[data-cy="unit-navigation-label"]')
      .contains('Aufgabe1');
  });

  it('LABEL_SHORT', () => {
    loginTestTaker('Bklt_Config-54', '123');
    cy.get('[data-cy="unit-navigation-label"]')
      .invoke('text')
      .invoke('trim')
      .should('equal', 'A1');
  });

  it('HIDDEN', () => {
    loginTestTaker('Bklt_Config-31', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('not.exist');
  });
});
