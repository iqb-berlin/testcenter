import {
  clickSuperadmin, resetBackendData,
  loginSuperAdmin, logoutAdmin, visitLoginPage, loginWorkspaceAdmin
} from '../utils';

describe('Management Workspaces (workspace-tab)', () => {
  beforeEach(visitLoginPage);
  beforeEach(resetBackendData);
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
