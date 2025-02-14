import {
  clickSuperadminSettings, resetBackendData,
  loginSuperAdmin, logoutAdmin, visitLoginPage, loginWorkspaceAdmin
} from '../utils';

describe('Management Workspaces (workspace-tab)', () => {
  before(resetBackendData);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(clickSuperadminSettings);

  it('should be all buttons are visible and sample_workspace is installed in Tab:Workspaces', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.get('[data-cy="add-workspace"]');
    cy.get('[data-cy="delete-workspace"]');
    cy.get('[data-cy="rename-workspace"]');
    cy.contains('sample_workspace');
  });

  it('should be possible to add a new workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.get('[data-cy="add-workspace"]')
      .click();
    cy.get('[formControlName="name"]')
      // Saving with only 2 characters should not be possible
      .type('ws');
    cy.get('[type="submit"]')
      .should('be.disabled');
    cy.get('[formControlName="name"]')
      .clear()
      // Saving with more than 3 characters should be possible
      .type('ws 2');
    cy.get('[type="submit"]')
      .click();
    cy.contains('ws 2');
  });

  it('should be possible to change users RO access rights on workspace tab', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="workspace-role-ro2"]')
      .click();
    cy.get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="upload-files"]')
      .should('be.disabled');
    cy.get('[data-cy="delete-files"]')
      .should('be.disabled');
  });

  it('should be possible to change users RW access rights on workspace tab', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="workspace-role-rw2"]')
      .click();
    cy.get('[data-cy="save"]')
      .click();
    logoutAdmin();
    loginWorkspaceAdmin();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="upload-files"]')
      .should('be.enabled');
    cy.get('[data-cy="delete-files"]')
      .should('be.enabled');
  });

  it('should be possible to rename a workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('sample_workspace')
      .click();
    cy.get('[data-cy="rename-workspace"]')
      .click();
    cy.get('[formcontrolname="name"]')
      .type('newName');
    cy.get('[type="submit"]')
      .click();
    cy.contains('newName');
  });

  it('should be possible to delete a workspace', () => {
    cy.get('[data-cy="superadmin-tabs:workspaces"]')
      .click();
    cy.contains('newName')
      .click();
    cy.get('[data-cy="delete-workspace"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Arbeitsbereichen');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Arbeitsbereich/e löschen')
      .click();
    cy.contains('newName')
      .should('not.exist');
  });
});
