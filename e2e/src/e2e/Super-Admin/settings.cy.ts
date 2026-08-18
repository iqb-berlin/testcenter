import {
  clickSuperadminSettings,
  loginSuperAdmin,
  logout,
  probeBackendApi,
  resetBackendData,
  visitLoginPageWithProdDb
} from '../utils';

describe('Settings (setting-tab)', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPageWithProdDb()
    loginSuperAdmin();
    clickSuperadminSettings();
  });

  it('all setting options are visible', () => {

    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click({ timeout: 10000 });
    cy.get('[data-cy="admin-setting-warningfield"]');
    cy.get('[data-cy="admin-setting-app-name"]')
    cy.get('[data-cy="admin-setting-data-protect"]')
    cy.get('[data-cy="admin-setting-accessibility"]')
    cy.get('[data-cy="admin-setting-imprint"]')
    cy.get('[data-cy="admin-setting-repo"]')
    cy.get('[data-cy="admin-setting-git-token"]')
    cy.get('[data-cy="admin-setting-theme-Primar"]')
    cy.get('[data-cy="admin-setting-theme-Sekundar"]')
    cy.get('[data-cy="admin-setting-theme-Erwachsene"]')
    cy.get('[data-cy="admin-setting-submit"]')
  });

  // todo check how to test this without polluting the real database -> this test can be observed in regular dev container db (make up)
  it('set a message for maintenance works', () => {
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click({ timeout: 10000 });
    cy.get('[data-cy="admin-setting-warningfield"]')
      .clear()
      .type('Maintenance works');
    cy.get('[data-cy="admin-setting-set-date"]')
      .clear()
      .type('12.12.2050');
    cy.get('[data-cy="admin-setting-app-name"]')
      .clear()
      .type('NewName');
    cy.get('[data-cy="admin-setting-submit"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    logout();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
    cy.contains('Maintenance works');
  });

  it('clear a message for maintenance works', () => {
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click({ timeout: 10000 });
    cy.get('[data-cy="admin-setting-warningfield"]')
      .clear();
    cy.get('[data-cy="admin-setting-set-date"]')
      .clear();
    cy.get('[data-cy="admin-setting-app-name"]')
      .clear();
    cy.get('[data-cy="admin-setting-submit"]')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    logout();
  });
});
