import {
  addWorkspaceAdmin,
  clickSuperadminSettings,
  insertCredentials,
  loginSuperAdmin,
  loginWorkspaceAdmin,
  logoutAdmin,
  probeBackendApi,
  resetBackendData,
  userData,
  visitLoginPage
} from '../utils';

describe('Usermanagement (user-tab)', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });
  beforeEach(() => {
    visitLoginPage();
    loginSuperAdmin();
    clickSuperadminSettings();
  });

  it('all user option buttons are visible', () => {
    cy.get('[data-cy="superadmin-tabs:users"]')
      .click();
    cy.get('[data-cy="add-user"]');
    cy.get('[data-cy="delete-user"]');
    cy.get('[data-cy="change-password"]');
    cy.get('[data-cy="change-superadmin"]');
  });

  it('add a new user', () => {
    addWorkspaceAdmin('newTest', 'user123');
    logoutAdmin();
    insertCredentials('newTest', 'user123');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.contains('newTest');
  });

  it('set admin rights for a workspaceadmin without correct password is not possible', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="change-superadmin"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .type('invalidPassword');
    cy.get('[data-cy="dialog-change-superadmin"] [type="submit"]')
      .click();
    cy.get('[data-cy="main-alert:warning"] [data-cy="close"]')
      .click();
  });

  it('set admin rights for a workspaceadmin with correct password', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="change-superadmin"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .type(userData.SuperAdminPassword);
    cy.get('[data-cy="dialog-change-superadmin"] [type="submit"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="goto-superadmin-settings"]');
  });

  it('change privileges for a workspaceadmin to read-only', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="workspace-1-role-ro"]')
      .click();
    cy.get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="upload-files"]')
      .should('be.disabled');
    cy.get('[data-cy="delete-files"]')
      .should('be.disabled');
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]');
  });

  it('change privileges for a workspaceadmin to read-write', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="workspace-1-role-rw"]')
      .click();
    cy.get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="upload-files"]')
      .should('be.enabled');
    cy.get('[data-cy="delete-files"]')
      .should('be.enabled');
  });

  it('change the password for a workspaceadmin', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="change-password"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .type('newPassword');
    cy.get('[formcontrolname="pw_confirm"]')
      .type('newPassword');
    cy.get('[type="submit"]')
      .click();
    logoutAdmin();
    insertCredentials(userData.WorkspaceAdminName, 'newPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.contains('Status: Angemeldet als "workspace_admin"');
  });

  it('change the password for a workspaceadmin: repeated password is incorrect', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="change-password"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .type('newPassword');
    cy.get('[formcontrolname="pw_confirm"]')
      .type('newPassword1');
    cy.contains('Die Kennwörter stimmen nicht überein');
  });

  it('delete a workspace admin', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="delete-user"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Administrator:innen');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Administrator:in löschen')
      .click();
    cy.contains(userData.WorkspaceAdminName)
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
  });
});

