import {
  clickSuperadminSettings,
  loginSuperAdmin,
  logout,
  probeBackendApi,
  resetBackendTestData, visitLoginPage,
  visitLoginPageWithProdDb
} from '../utils';

describe('Settings (setting-tab)', () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
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
    cy.get('[data-cy="admin-setting-theme-Primar"]')
    cy.get('[data-cy="admin-setting-theme-Sekundar"]')
    cy.get('[data-cy="admin-setting-theme-Erwachsene"]')
    cy.get('[data-cy="admin-setting-submit"]')
  });

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
    // the intercept is necessary as logout leads to reloading leads to losing ?testMode=true
    cy.intercept(`${Cypress.env('urls').backend}/**`, request => {
      request.headers.TestMode = 'integration';
    });
    logout();
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
