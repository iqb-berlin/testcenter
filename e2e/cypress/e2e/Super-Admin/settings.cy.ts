import {
  clickSuperadmin, resetBackendData,
  loginSuperAdmin, visitLoginPage
} from '../utils';

describe('Settings (setting-tab)', () => {
  beforeEach(visitLoginPage);
  beforeEach(resetBackendData);
  beforeEach(loginSuperAdmin);
  beforeEach(clickSuperadmin);

  it('should be all settings functions visible', () => {
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/superadmin/settings`);
    cy.contains('Testheft')
      .should('exist');
    cy.contains('Gruppenmonitor')
      .should('exist');
    cy.contains('Login')
      .should('exist');
    cy.contains('System-Check')
      .should('exist');
    cy.contains('Warnung auf der Startseite')
      .should('exist');
    cy.contains('Logo')
      .should('exist');
  });

  it('should be possible to set a message for maintenance works', () => {
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click();
    cy.get('[formcontrolname="globalWarningText"]')
      .should('exist')
      .type('Maintenance works');
    cy.get('[formcontrolname="globalWarningExpiredDay"]')
      .should('exist')
      .type('12.12.2050');
    cy.get('[formcontrolname="appTitle"]')
      .should('exist')
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
    cy.contains('Maintenance works')
      .should('exist');
    cy.contains('NewName')
      .should('exist');
  });
});
