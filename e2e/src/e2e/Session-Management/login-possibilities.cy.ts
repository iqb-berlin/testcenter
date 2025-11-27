import {
  insertCredentials,
  probeBackendApi,
  visitLoginPage
} from '../utils';

describe('Check Login Possibilities', () => {
  before(() => {
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
  });

  it('login without existing password is not possible', () => {
    insertCredentials('SM-2', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('login with wrong password is not possible', () => {
    insertCredentials('SM-2', '123');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('login with name and right password, the booklet start immediately', () => {
    insertCredentials('SM-2', '101');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('SM-2');
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login only with a name', () => {
    insertCredentials('SM-1', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('SM-1');
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login as link', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/SM-3`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="status-card"]')
      .contains('SM-3');
  });

  it('login as link and jump into test', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/SM-4`);
    cy.wait(1000);
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('login with wrong code is not possible', () => {
    insertCredentials('SM-5', '102');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[formcontrolname="code"]')
      .type('123');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="login-code-problem:400"]')
      .contains('Der Code ist leider nicht gültig.');
  });

  it('login with right code and password', () => {
    insertCredentials('SM-5', '102');
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
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login with code on login page', () => {
    insertCredentials('SM-6', '');
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
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login with code via link', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/SM-6`);
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
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });
});
