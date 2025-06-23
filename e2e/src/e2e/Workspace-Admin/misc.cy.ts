import {
  insertCredentials,
  loginWorkspaceAdmin,
  probeBackendApi,
  resetBackendData,
  userData,
  visitLoginPage
} from '../utils';

describe('Workspace-Admin Login', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
    loginWorkspaceAdmin();
  });

  it('change the password', () => {
    cy.contains(userData.WorkspaceAdminName)
      .click()
      .get('[data-cy="change-password"]')
      .click()
      .get('[formcontrolname="pw"]')
      .type('newPassword')
      .get('[formcontrolname="pw_confirm"]')
      .type('newPassword')
      .get('[type="submit"]')
      .click();
    cy.wait(3000);
    visitLoginPage();
    insertCredentials(userData.WorkspaceAdminName, 'newPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.get('[data-cy="card-login-name"]')
      .contains('Status: Angemeldet als "workspace_admin"');
  });
});
