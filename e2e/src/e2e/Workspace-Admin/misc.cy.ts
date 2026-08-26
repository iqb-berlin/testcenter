import {
  loginWorkspaceAdmin,
  logout,
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
    cy.get('[data-cy="newPasswordForm-used-pw"]')
      .type('ws_password');
    cy.get('[data-cy="newPasswordForm-new-pw"]')
      .type('ws_password_new');
    cy.get('[data-cy="newPasswordForm-confirm-pw"]')
      .type('ws_password_new');
    cy.get('[data-cy="newPasswordForm-submit"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Kennwort erfolgreich geändert. Sie werden abgemeldet.');
    cy.get('[data-cy="toast-action-0"]')
      .click();
    cy.get('[data-cy="login-admin-form"]')
      .should('be.visible');
    //Testmode geht verloren, also nochmal neu anwählen
    visitLoginPage();
    loginWorkspaceAdmin('workspace_admin', 'ws_password_new');
  });
});
