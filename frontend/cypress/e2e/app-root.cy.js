// TODO better selectors

import {
  insertCredentials, resetBackendData, visitLoginPage
} from './utils.cy';

describe('App-Root\'s login page', () => {
  beforeEach(cy.clearLocalStorage);
  beforeEach(resetBackendData);
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
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/code-input`);
    cy.get('.mat-form-field-infix')
      .type('yyy')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
  });

  it('Signs in a user with wrong login code', () => {
    insertCredentials('test', 'user123');
    cy.get('[data-cy="login-user"]')
      .click()
      .wait(5);
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/code-input`);
    cy.get('.mat-form-field-infix')
      .type('ttt')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
    cy.contains('Der Code ist leider nicht gültig. Bitte noch einmal versuchen')
      .should('exist');
  });

  it('Signs in a user', () => {
    insertCredentials('test-demo', 'user123');
    cy.get('[data-cy="login-user"]')
      .click()
      .wait(5);
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/test-starter`);
  });

  it('Signs in an admin', () => {
    insertCredentials('super', 'user123');
    cy.contains('Weiter als Admin')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/admin-starter`);
  });

  it('Signs in a user without password', () => {
    insertCredentials('test-no-pw');
    cy.contains('Weiter')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/test-starter`);
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
    cy.visit(Cypress.env('TC_URL'));
    cy.contains('Impressum/Datenschutz')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/legal-notice`);
    cy.contains('zurück zur Startseite')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/login/`);
  });

  it('Should get to System Check and return to login page', () => {
    cy.visit(Cypress.env('TC_URL'));
    cy.contains('System-Check')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/check-starter`);
    cy.contains('zurück zur Startseite')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/login/`);
  });
});
