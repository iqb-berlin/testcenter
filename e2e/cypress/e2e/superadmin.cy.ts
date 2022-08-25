// TODO better selectors

import {
  clickSuperadmin, insertCredentials, loginAsAdmin, logoutAdmin, resetBackendData, visitLoginPage
} from './utils';

describe('Superadmin', () => {
  beforeEach(resetBackendData);
  beforeEach(() => loginAsAdmin());
  beforeEach(clickSuperadmin);

  it('Should create a new admin with read-only privileges', () => {
    cy.get('[data-cy="add-user"]')
      .click()
      .get('[formcontrolname="name"]')
      .type('newTest')
      .get('[formcontrolname="pw"]')
      .type('user123')
      .get('[type="submit"]')
      .click();
    cy.contains('newTest')
      .should('exist')
      .click()
      .get('[data-cy="workspace-role-ro"]')
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    insertCredentials('newTest', 'user123');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.contains('Status: Angemeldet als "newTest"')
      .should('exist');
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="upload-files"]')
      .should('be.disabled')
      .get('[data-cy="delete-files"]')
      .should('be.disabled');
  });

  it('Should change the password of a existing user', () => {
    cy.contains('workspace_admin')
      .click()
      .get('[data-cy="change-password"]')
      .click()
      .get('[formcontrolname="pw"]')
      .type('newPassword')
      .get('[type="submit"]')
      .click();
    logoutAdmin();
    insertCredentials('workspace_admin', 'newPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.contains('Status: Angemeldet als "workspace_admin"')
      .should('exist');
  });

  it('Should change privileges of existing admin to read-write', () => {
    cy.contains('workspace_admin')
      .should('exist')
      .click()
      .get('[data-cy="workspace-role-ro"]')
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    insertCredentials('workspace_admin', 'anotherPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/admin-starter`);
    cy.contains('Status: Angemeldet als "workspace_admin"')
      .should('exist');
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="upload-files"]')
      .should('be.enabled')
      .get('[data-cy="delete-files"]')
      .should('be.enabled');
  });

  it('Should delete an admin by clicking on the name', () => {
    cy.contains('workspace_admin')
      .click()
      .get('[data-cy="delete-user"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .click();
    cy.contains('workspace_admin')
      .should('not.exist')
    cy.get('[data-cy="logo"]')
      .click();
  });

  it('Should create new super admin', () => {
    cy.get('[data-cy="add-user"]')
      .click()
      .get('[data-cy="new-user-name"]')
      .type('newSuper')
      .get('[data-cy="new-user-password"]')
      .type('user123')
      .get('[data-cy="new-user-submit"]')
      .click();
    cy.contains('newSuper')
      .click();
    cy.get('[data-cy="change-superadmin"]')
      .click()
      .get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[formControlName="pw"]')
      .type('user123')
      .get('[data-cy="pw-submit"]')
      .click();
    cy.contains('newSuper *');
    cy.get('[data-cy="logo"]')
      .click();
    logoutAdmin();
    cy.get('[formcontrolname="name"]')
      .clear()
      .type('newSuper')
      .get('[formcontrolname="pw"]')
      .type('user123');
    cy.contains('Weiter als Admin')
      .click();
    cy.contains('Verwaltung von Testinhalten')
      .should('exist');
    cy.contains('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen')
      .should('exist');
  });

  it('Should not change super admin status without correct password', () => {
    cy.contains('workspace_admin')
      .click();
    cy.get('[data-cy="change-superadmin"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .click();
    cy.get('[formControlName="pw"]')
      .should('exist')
      .type('wrongPassword')
      .get('[data-cy="confirm-password-form"] [type="submit"]')
      .click();
    cy.get('[data-cy="main-alert:WARNING"]')
      .should('exist')
      .click();
  });

  it('Should change super admin status with correct password', () => {
    cy.contains('workspace_admin')
      .click();
    cy.get('[data-cy="change-superadmin"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .click();
    cy.get('[formControlName="pw"]')
      .should('exist')
      .type('user123')
      .get('[data-cy="confirm-password-form"] [type="submit"]')
      .click();
    logoutAdmin();
    insertCredentials('workspace_admin', 'anotherPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.contains('Verwaltung von Testinhalten')
      .should('exist');
    cy.contains('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen')
      .should('exist');
  });

  it('Should add a new workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.get('[data-cy="add-workspace"]')
      .should('exist')
      .click();
    cy.get('[formControlName="name"]')
      .should('exist')
      .type('ws 2')
      .get('[type="submit"]')
      .click();
    cy.contains('ws 2')
      .should('exist');
  });

  it('Should change users access rights on workspace tab', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="workspace-role-ro"]')
      .eq(2)
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginAsAdmin('workspace_admin', 'anotherPassword');
    cy.contains('sample_workspace')
      .should('exist')
      .click();
    cy.get('[data-cy="upload-files"]')
      .should('be.disabled')
      .get('[data-cy="delete-files"]')
      .should('be.disabled');
    logoutAdmin();
    loginAsAdmin('super', 'user123');
    clickSuperadmin();
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="workspace-role-rw"]')
      .eq(2)
      .should('exist')
      .click()
      .get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginAsAdmin('workspace_admin', 'anotherPassword');
    cy.contains('sample_workspace')
      .should('exist')
      .click();
    cy.get('[data-cy="upload-files"]')
      .should('be.enabled')
      .get('[data-cy="delete-files"]')
      .should('be.enabled');
  });

  it('Should delete a user with checkbox', () => {
    cy.contains('workspace_admin')
      .should('exist');
    cy.get('[data-cy="check-user"]').eq(2)
      .click();
    cy.get('[data-cy="delete-user"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .click();
    cy.contains('workspace_admin')
      .should('not.exist')
  });

  it('Should delete a workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .should('exist')
      .click();
    cy.get('[data-cy="delete-workspace"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .click();
    cy.contains('sample_workspace')
      .should('not.exist');
    cy.visit('/#/r/admin-starter');
    cy.get('[data-cy="workspace-1"]')
      .should('not.exist');
    cy.get('[data-cy="logout"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
    insertCredentials('super', 'user123');
    cy.contains('sample_workspace')
      .should('not.exist');
  });

  it('Should go to System-Admin (management window)', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/workspaces`);
    cy.get('[data-cy="superadmin-tabs:settings"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/settings`);
    cy.get('[data-cy="superadmin-tabs:users"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`);
  });

  it('Should open workspace', () => {
    visitLoginPage();
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
    cy.get('[data-cy="System-Check Berichte"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/syscheck`);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/results`);
    cy.get('[data-cy="Dateien"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
  });
});
