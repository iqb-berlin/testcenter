import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: browserBehaviour', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('standard (default)', () => {
    loginTestTaker('Bklt_Config-3', '123');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe2');
    cy.go('back');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
  });

  it('preventNav', () => {
    loginTestTaker('Bklt_Config-4', '123');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe2');
    cy.go('back');
    cy.get('[data-cy="unit-screenheader"]')
      .contains('Aufgabe2');
  });
});
