import {
  insertCredentials, resetBackendData, useTestDB, visitLoginPage
} from '../utils';

describe('Check Login Possibilities', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);

  it('should not be possible to log in with a name and without an existing password', () => {
    insertCredentials('with_pw', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.contains(/^Anmeldedaten sind nicht gültig..*/)
      .should('exist');
  });

  it('should be not possible to login with name and wrong password', () => {
    insertCredentials('with_pw', '123');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.contains(/^Anmeldedaten sind nicht gültig..*/)
      .should('exist');
  });

  it('should be possible to login with name and right password and start test immediately', () => {
    insertCredentials('with_pw', '101');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('with_pw')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login only with a name', () => {
    insertCredentials('without_pw', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('without_pw')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login as link', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_link`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.contains('as_link')
      .should('exist');
  });

  it('should be possible to login as link and jump into test', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_link_immediate`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
  });

  it('should be not possible to login with wrong code', () => {
    cy.visit(`${Cypress.config().baseUrl}`);
    insertCredentials('as_code1', '102');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .type('123');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.contains(/^Der Code ist leider nicht gültig.*/)
      .should('exist');
  });

  it('should be possible to login with right code and password', () => {
    insertCredentials('as_code1', '102');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .type('as_code01');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('as_code01')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login with code without password', () => {
    insertCredentials('as_code2', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('as_code02')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login with code without password', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_code2`);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('as_code02')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to start a group monitor', () => {
    insertCredentials('group-monitor', '301');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="GM-SM_HotModes"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/gm/SM_HotModes`);
    cy.contains('hret1')
      .should('exist');
    cy.contains('hret2')
      .should('exist');
  });

  it('should be possible to login as link and jump into test (sys-check)', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/syscheck`);
    cy.wait(1000);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
  });

  it('should be possible to login for sys-check with name and right password and start test immediately (sys-check)', () => {
    insertCredentials('syscheck', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
  });
});
