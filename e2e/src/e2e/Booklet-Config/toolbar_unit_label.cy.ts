import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('check parameter: toolbar_unit_label', { testIsolation: true }, () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('LABEL (default)', () => {
    loginTestTaker('Bklt_Config-40', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('HIDDEN', () => {
    loginTestTaker('Bklt_Config-41', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-title"]')
      .should('not.exist');
  });

  it('LABEL_SHORT', () => {
    loginTestTaker('Bklt_Config-52', '123');
    cy.get('[data-cy="unit-title"]')
      .should('have.text', 'A1');
  });

  it('LABEL_SHORT falls back to the label if the unit has no labelshort', () => {
    loginTestTaker('Bklt_Config-53', '123');
    cy.get('[data-cy="unit-title"]')
      .should('have.text', 'Aufgabe1');
  });
});
