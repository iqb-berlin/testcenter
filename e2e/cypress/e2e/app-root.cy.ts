// TODO better selectors

import {
  insertCredentials, resetBackendData, useTestDB, visitLoginPage
} from './utils';

describe('App-Root\'s login page', () => {
  beforeEach(cy.clearLocalStorage);
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);

  it('Visits the homepage', () => {
    cy.contains('IQB-Testcenter')
      .should('exist');
    cy.contains('Anmeldename')
      .should('exist');
  });

  it('Signs in a user with login code', () => {
    insertCredentials('test', 'user123');
    cy.get('[data-cy="login-user"]')
      .click()
      .wait(5);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formControlName="code"]')
      .type('yyy')
      .get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-1"]')
      .should('exist');
  });

  it('Signs in a user with wrong login code', () => {
    insertCredentials('test', 'user123');
    cy.get('[data-cy="login-user"]')
      .click()
      .wait(5);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formControlName="code"]')
      .type('ttt')
      .get('[data-cy="continue"]')
      .click();
    cy.contains('Der Code ist leider nicht gültig. Bitte noch einmal versuchen')
      .should('exist');
  });

  it('Signs in a user', () => {
    insertCredentials('test-demo', 'user123');
    cy.get('[data-cy="login-user"]')
      .click()
      .wait(5);
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-1"]')
      .should('exist');
  });

  it('Signs in an admin', () => {
    insertCredentials('super', 'user123');
    cy.contains('Weiter als Admin')
      .click();
    cy.get('[data-cy="workspace-1"]')
      .should('exist');
  });

  it('Signs in a user without password', () => {
    insertCredentials('test-no-pw');
    cy.contains('Weiter')
      .click();
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-1"]')
      .should('exist');
  });

  it('Try to sign in with wrong credentials', () => {
    insertCredentials('test', 'wrongpassword');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.contains('Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!')
      .should('exist');
  });

  it('Try to sign in with expired credentials', () => {
    insertCredentials('test-expired');
    cy.contains('Weiter')
      .click();
    cy.contains('Anmeldedaten sind abgelaufen')
      .should('exist');
  });

  it('Try to sign in with not activated login credentials', () => {
    insertCredentials('test-future');
    cy.contains('Weiter')
      .click();
    cy.contains('Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.')
      .should('exist');
  });

  it('Should get to legal disclosure and return to login page', () => {
    cy.visit(Cypress.config().baseUrl);
    cy.contains('Impressum/Datenschutz')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/legal-notice`);
    cy.contains('zurück zur Startseite')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
  });

  it('Should get to System Check and return to login page', () => {
    cy.visit(Cypress.config().baseUrl);
    cy.contains('System-Check')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('zurück zur Startseite')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
  });
});
