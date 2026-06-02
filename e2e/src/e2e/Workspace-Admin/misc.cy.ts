import {
  loginWorkspaceAdmin,
  logoutAdmin,
  probeBackendApi,
  resetBackendData, visitLoginPage
} from '../utils';

describe('Workspace-Admin Login', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
    visitLoginPage();
    loginWorkspaceAdmin('workspace_admin', 'ws_password');
  });

  it('change the password', () => {
    cy.get('[data-cy="change-password"]')
      .click();
    cy.get('[formcontrolname="pw"]')
      .type('ws_password_new');
    cy.get('[formcontrolname="pw_confirm"]')
      .type('ws_password_new');
    cy.get('[type="submit"]')
      .click();
    cy.contains('Schließen')
      .click();
    cy.get('[data-cy="login-admin-form"]');
    //Testmode geht verloren, also nochmal neu anwählen
    visitLoginPage();
    loginWorkspaceAdmin('workspace_admin', 'ws_password_new');
  });
});
