import {
  twoStepLogin,
  probeBackendApi,
  resetBackendData,
  visitLoginPage, checkUserName
} from '../utils';

describe('Check Login Possibilities', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
  });

  it('login with wrong password is not possible', () => {
    twoStepLogin('SM-2', '123');
    cy.get('[data-cy="login-problem:400"]')
      .contains('Anmeldedaten sind nicht gültig');
  });

  it('login with name and right password, the booklet start immediately', () => {
    twoStepLogin('SM-2', '101');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    checkUserName('SM-2');
    cy.get('[data-cy="booklet-CY-BKLT_SM-1"]')
  });

  it('login only with a name', () => {
    twoStepLogin('SM-1', '');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="logo"]')
      .click();
    checkUserName('SM-1');
    cy.get('[data-cy="booklet-CY-BKLT_SM-1"]')
  });

  it('login as link', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/SM-3`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    checkUserName('SM-3');
  });

  it('login as link and jump into test', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/SM-4`);
    cy.wait(1000);
    cy.get('[data-cy="booklet-CY-BKLT_SM-1"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('login with wrong code is not possible', () => {
    twoStepLogin('SM-5', '102');
    cy.get('[formcontrolname="code"]')
      .type('123');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="login-code-problem:400"]')
      .contains('Der Code ist leider nicht gültig.');
  });

  it('login with right code and password', () => {
    twoStepLogin('SM-5', '102');
    cy.get('[formcontrolname="code"]')
      .type('as_code01');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    checkUserName('SM-5');
    cy.get('[data-cy="booklet-CY-BKLT_SM-1"]')
  });

  it('login with code on login page', () => {
    twoStepLogin('SM-6', '');
    cy.get('[formcontrolname="code"]')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    checkUserName('SM-6');
    cy.get('[data-cy="booklet-CY-BKLT_SM-1"]')
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
    checkUserName('as_code02');
    cy.get('[data-cy="booklet-CY-BKLT_SM-1"]')
  });
});
