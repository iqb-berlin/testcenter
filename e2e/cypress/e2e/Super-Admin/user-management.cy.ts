import {
  clickSuperadminSettings, insertCredentials, resetBackendData,
  loginSuperAdmin, logoutAdmin, addWorkspaceAdmin, visitLoginPage, loginWorkspaceAdmin,
  userData
} from '../utils';

describe('Usermanagement (user-tab)', () => {
  before(resetBackendData);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(clickSuperadminSettings);

  it('should be that all user buttons are present', () => {
    cy.get('[data-cy="superadmin-tabs:users"]')
      .click();
    cy.get('[data-cy="add-user"]');
    cy.get('[data-cy="delete-user"]');
    cy.get('[data-cy="change-password"]');
    cy.get('[data-cy="change-superadmin"]');
  });

  it('should be possible to create a new user', () => {
    addWorkspaceAdmin('newTest', 'user123');
    logoutAdmin();
    insertCredentials('newTest', 'user123');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.contains('newTest');
  });

  it('should not be possible to set admin rights for existing workspace admin without correct password', () => {
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

  it('should be possible to set admin rights for existing workspace admin with correct password', () => {
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

  it('should be possible change privileges of existing workspace_admin to read-only', () => {
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

  it('should be possible to change privileges of existing workspace_admin to read-write', () => {
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

  it('should be possible to change the password of a existing workspaceadmin', () => {
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

  it('should not be able to change the password, if both input fields are different', () => {
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

  it('should be possible to delete a workspace admin', () => {
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
