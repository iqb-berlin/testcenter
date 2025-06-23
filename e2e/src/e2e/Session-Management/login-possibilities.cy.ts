import {
  insertCredentials,
  probeBackendApi,
  visitLoginPage
} from '../utils';

describe('Check Login Possibilities', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
  });

  it('login without existing password is not possible', () => {
    insertCredentials('with_pw', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('login with wrong password is not possible', () => {
    insertCredentials('with_pw', '123');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('login with name and right password, the booklet start immediately', () => {
    insertCredentials('with_pw', '101');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('with_pw');
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login only with a name', () => {
    insertCredentials('without_pw', '');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="status-card"]')
      .contains('without_pw');
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login as link', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_link`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="status-card"]')
      .contains('as_link');
  });

  it('login as link and jump into test', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_link_immediate`);
    cy.wait(1000);
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('login with wrong code is not possible', () => {
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

  it('login with right code and password', () => {
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
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login with code on login page', () => {
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
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });

  it('login with code via link', () => {
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
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
  });
});
