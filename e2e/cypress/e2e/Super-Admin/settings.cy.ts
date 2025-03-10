import {
  clickSuperadminSettings, resetBackendData,
  loginSuperAdmin, visitLoginPage
} from '../utils';

describe('Settings (setting-tab)', () => {
  before(resetBackendData);

  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(clickSuperadminSettings);

  it('all setting options are visible', () => {
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/superadmin/settings`);
    cy.contains('Testheft');
    cy.contains('Gruppenmonitor');
    cy.contains('Login');
    cy.contains('System-Check');
    cy.contains('Warnung auf der Startseite');
    cy.contains('Logo');
  });

  it('set a message for maintenance works', () => {
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click();
    cy.get('[formcontrolname="globalWarningText"]')
      .type('Maintenance works');
    cy.get('[formcontrolname="globalWarningExpiredDay"]')
      .type('12.12.2050');
    cy.get('[formcontrolname="appTitle"]')
      .clear()
      .type('NewName');
    cy.get('[data-cy="Settings:Submit-ApplicationConfiguration"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="logout"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
    cy.contains('Maintenance works');
    cy.contains('NewName');
  });
});
