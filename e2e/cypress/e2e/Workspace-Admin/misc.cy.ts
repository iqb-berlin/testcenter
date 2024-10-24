import {
  insertCredentials,
  loginWorkspaceAdmin,
  resetBackendData,
  userData,
  useTestDB,
  visitLoginPage
} from '../utils';

describe('Workspace-Admin Login', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginWorkspaceAdmin);

  it('should change the password, and be redirected to login page', () => {
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
    insertCredentials(userData.WorkspaceAdminName, 'newPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.contains('Status: Angemeldet als "workspace_admin"')
      .should('exist');
  });
});
