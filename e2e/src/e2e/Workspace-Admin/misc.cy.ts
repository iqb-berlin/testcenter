import {
  loginWorkspaceAdmin,
  logoutAdmin,
  probeBackendApi,
  resetBackendData,
} from '../utils';

describe('Workspace-Admin Login', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
    loginWorkspaceAdmin('workspace_admin', 'ws_password');
  });

  it('change the password', () => {
    cy.contains('workspace_admin')
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
    logoutAdmin();
    loginWorkspaceAdmin('workspace_admin', 'ws_password_new');
  });
});

