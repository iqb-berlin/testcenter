import {
  clickSuperadmin, insertCredentials, useTestDB, resetBackendData,
  loginSuperAdmin, logoutAdmin, addWorkspaceAdmin, visitLoginPage, loginWorkspaceAdmin,
  userData
} from './utils';

describe('Usermanagement (user-tab)', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(clickSuperadmin);

  it('should be that all user buttons are present', () => {
    cy.get('[data-cy="superadmin-tabs:users"]')
      .should('exist')
      .click()
      .url()
      .should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`)
      .get('[data-cy="add-user"]')
      .should('exist')
      .get('[data-cy="delete-user"]')
      .should('exist')
      .get('[data-cy="change-password"]')
      .should('exist')
      .get('[data-cy="change-superadmin"]')
      .should('exist');
  });

  it('should be possible to create a new user', () => {
    addWorkspaceAdmin('newTest', 'user123');
    logoutAdmin();
    insertCredentials('newTest', 'user123');
    cy.get('[data-cy="login-admin"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.contains('newTest')
      .should('exist');
  });

  it('should not be possible to set admin rights for existing workspace admin without correct password', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click();
    cy.get('[data-cy="change-superadmin"]')
      .click()
      .get('[data-cy="dialog-change-superadmin"]')
      .get('[formcontrolname="pw"]')
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
      .type(userData.SuperAdminPassword)
      .get('[data-cy="dialog-change-superadmin"] [type="submit"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .should('not.exist');
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.get('[data-cy="goto-superadmin"]')
      .should('exist');
  });

  it('should not be a workspace visible for the workspace admin yet', () => {
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .should('not.exist');
  });

  it('should be possible change privileges of existing workspace_admin to read-only', () => {
    cy.contains(userData.WorkspaceAdminName)
      .should('exist')
      .click()
      .get('[data-cy="workspace-1-role-ro"]')
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="upload-files"]')
      .should('be.disabled')
      .get('[data-cy="delete-files"]')
      .should('be.disabled');
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .should('exist'); // make sure files call happened before continuing
  });

  it('should be possible to change privileges of existing workspace_admin to read-write', () => {
    cy.contains(userData.WorkspaceAdminName)
      .should('exist')
      .click()
      .get('[data-cy="workspace-1-role-rw"]')
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="upload-files"]')
      .should('be.enabled')
      .get('[data-cy="delete-files"]')
      .should('be.enabled');
  });

  it('should be possible to change the password of a existing workspaceadmin', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click()
      .get('[data-cy="change-password"]')
      .click()
      .get('[formcontrolname="pw"]')
      .type('newPassword')
      .get('[type="submit"]')
      .click();
    logoutAdmin();
    insertCredentials(userData.WorkspaceAdminName, 'newPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.contains('Status: Angemeldet als "workspace_admin"')
      .should('exist');
  });

  it('should be possible to delete a workspace admin', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click()
      .get('[data-cy="delete-user"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Administrator:innen');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Administrator:in löschen')
      .click();
    cy.contains(userData.WorkspaceAdminName)
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
  });
});

describe('Management Workspaces (workspace-tab)', () => {
  beforeEach(visitLoginPage);
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(loginSuperAdmin);
  beforeEach(clickSuperadmin);

  it('should be all buttons are visible and sample_workspace is installed in Tab:Workspaces', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .should('exist')
      .click()
      .url()
      .should('eq', `${Cypress.config().baseUrl}/#/superadmin/workspaces`)
      .get('[data-cy="add-workspace"]')
      .should('exist')
      .get('[data-cy="delete-workspace"]')
      .should('exist')
      .get('[data-cy="rename-workspace"]')
      .should('exist');
    cy.contains('sample_workspace')
      .should('exist');
  });

  it('should be possible to add a new workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.get('[data-cy="add-workspace"]')
      .should('exist')
      .click();
    cy.get('[formControlName="name"]')
      .should('exist')
      // Saving with only 2 characters should not be possible
      .type('ws')
      .get('[type="submit"]')
      .should('be.disabled');
    cy.get('[formControlName="name"]')
      .should('exist')
      .clear()
      // Saving with more than 3 characters should be possible
      .type('ws 2')
      .get('[type="submit"]')
      .click();
    cy.contains('ws 2')
      .should('exist');
  });

  it('should be possible to change users RO access rights on workspace tab', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="workspace-role-ro2"]')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .should('exist')
      .click();
    cy.get('[data-cy="upload-files"]')
      .should('be.disabled')
      .get('[data-cy="delete-files"]')
      .should('be.disabled');
  });

  it('should be possible to change users RW access rights on workspace tab', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="workspace-role-rw2"]')
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .should('exist')
      .click();
    cy.get('[data-cy="upload-files"]')
      .should('be.enabled')
      .get('[data-cy="delete-files"]')
      .should('be.enabled');
  });

  it('should be possible to open the workspace and check that all buttons are visible', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="Dateien"]')
      .click()
      .url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="System-Check Berichte"]')
      .click()
      .url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/syscheck`);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click()
      .url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/results`);
  });

  it('should be possible to rename a workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="rename-workspace"]')
      .click();
    cy.get('[formcontrolname="name"]')
      .type('newName')
      .get('[type="submit"]')
      .click();
    cy.contains('newName')
      .should('exist');
  });

  it('should be possible to delete a workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .should('exist')
      .click();
    cy.get('[data-cy="delete-workspace"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Arbeitsbereichen');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Arbeitsbereich/e löschen')
      .click();
    cy.contains('sample_workspace')
      .should('not.exist');
    cy.visit('/#/r/starter');
    cy.get('[data-cy="workspace-1"]')
      .should('not.exist');
    cy.get('[data-cy="logout"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
    loginSuperAdmin();
    cy.contains('sample_workspace')
      .should('not.exist');
  });
});

describe('Settings (setting-tab)', () => {
  beforeEach(visitLoginPage);
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
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