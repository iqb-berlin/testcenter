import {
  insertCredentials, resetBackendData, visitLoginPage
} from '../utils';

describe('Check Login Possibilities', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  beforeEach(() => {
    visitLoginPage();
  });

  it('should not be possible to log in with a name and without an existing password', () => {
    insertCredentials('with_pw', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('should be not possible to login with name and wrong password', () => {
    insertCredentials('with_pw', '123');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('should be possible to login with name and right password and start test immediately', () => {
    insertCredentials('with_pw', '101');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('with_pw');
    cy.get('[data-cy="booklet-RUNDEMO"]');
  });

  it('should be possible to login only with a name', () => {
    insertCredentials('without_pw', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('without_pw');
    cy.get('[data-cy="booklet-RUNDEMO"]');
  });

  it('should be possible to login as link', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_link`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="status-card"]')
      .contains('as_link');
  });

  it('should be possible to login as link and jump into test', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_link_immediate`);
    cy.wait(1000);
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('should be not possible to login with wrong code', () => {
    insertCredentials('as_code1', '102');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[formcontrolname="code"]')
      .type('123');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="login-code-problem:400"]')
      .contains('Der Code ist leider nicht gültig.');
  });

  it('should be possible to login with right code and password', () => {
    insertCredentials('as_code1', '102');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[formcontrolname="code"]')
      .type('as_code01');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('as_code01');
    cy.get('[data-cy="booklet-RUNDEMO"]');
  });

  it('should be possible to login with code without password', () => {
    insertCredentials('as_code2', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[formcontrolname="code"]')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('as_code02');
    cy.get('[data-cy="booklet-RUNDEMO"]');
  });

  it('should be possible to login with code without password', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_code2`);
    cy.get('[formcontrolname="code"]')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('as_code02');
    cy.get('[data-cy="booklet-RUNDEMO"]');
  });
});
