import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: navbar_forward_button', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('HIDDEN (default)', () => {
    loginTestTaker('Bklt_Config-23', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="separate-unit-forward-button"]')
      .should('not.exist');
  });

  it('DYNAMIC', () => {
    loginTestTaker('Bklt_Config-24', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.enabled');
    cy.get('[data-cy="separate-unit-forward-button"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('not.be.disabled');
    cy.get('[data-cy="separate-unit-forward-button"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
  });

  it('UNITS', () => {
    loginTestTaker('Bklt_Config-25', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="separate-unit-forward-button"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
  });

  it('PAGES', () => {
    loginTestTaker('Bklt_Config-26', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.enabled');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="separate-unit-forward-button"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });
});
