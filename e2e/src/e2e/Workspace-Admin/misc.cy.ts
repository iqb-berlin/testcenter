import {
  insertCredentials,
  loginWorkspaceAdmin, logoutAdmin,
  probeBackendApi,
  resetBackendData,
  userData,
  visitLoginPage
} from '../utils';

describe('Workspace-Admin Login', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
    loginWorkspaceAdmin('workspace_admin', 'ws_password');
  });

  it('change the password', () => {
    cy.get('[data-cy="change-password"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .type('ws_password_new')
    cy.get('[formcontrolname="pw_confirm"]')
      .type('ws_password_new')
    cy.get('[type="submit"]')
      .click();
    cy.contains('Schließen')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin('workspace_admin', 'ws_password_new');
  });
});
