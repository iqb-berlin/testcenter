import {
  disableSimplePlayersInternalDebounce,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check parameter: navbar_backward_button', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('HIDDEN (default)', () => {
    loginTestTaker('Bklt_Config-19', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="separate-unit-backward-button"]')
      .should('not.exist');
  });

  it('DYNAMIC', () => {
    loginTestTaker('Bklt_Config-20', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('be.disabled');
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.get('[data-cy="separate-unit-backward-button"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('not.be.disabled');
    cy.get('[data-cy="separate-unit-backward-button"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('not.be.disabled');
  });

  it('UNITS', () => {
    loginTestTaker('Bklt_Config-21', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="separate-unit-backward-button"]')
      .should('be.visible');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="separate-unit-backward-button"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('PAGES', () => {
    loginTestTaker('Bklt_Config-22', '123');
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.visible');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('be.disabled');
    cy.get('[data-cy="separate-unit-backward-button"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .should('not.be.disabled');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
  });
});
