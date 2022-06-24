import {
  insertCredentials, login, loginSuperAdmin, logout
} from './utils.cy';

describe('Superadmin Tests', () => {
  beforeEach(loginSuperAdmin);

  it('Should create a new admin with read-only privileges', () => {
    cy.get('[data-cy="add-user"]')
      .click()
      .get('[formControlName="name"]')
      .type('newTest')
      .get('[formControlName="pw"]')
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
    logout();
    insertCredentials('newTest', 'user123');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/admin-starter`);
    cy.contains('Status: Angemeldet als "newTest"')
      .should('exist');
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/admin/1/files`);
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
      .get('[formControlName="pw"]')
      .type('newPassword')
      .get('[type="submit"]')
      .click();
    logout();
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
    logout();
    insertCredentials('workspace_admin', 'anotherPassword');
    cy.get('[data-cy="login-admin"]')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/admin-starter`);
    cy.contains('Status: Angemeldet als "workspace_admin"')
      .should('exist');
    cy.contains('sample_workspace')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/admin/1/files`);
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
      .get('.mat-tooltip-trigger')
      .eq(0)
      .click();
  });

  it('Should create new super admin', () => {
    cy.get('button.mat-focus-indicator:nth-child(1)')
      .click()
      .get('.mat-dialog-content > p:nth-child(1) > mat-form-field')
      .type('newSuper')
      .get('.mat-dialog-content > p:nth-child(3) > mat-form-field')
      .type('user123')
      .get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('newSuper')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(4)')
      .click()
      .get('button.mat-primary > span:nth-child(1)')
      .click()
      .wait(1000);
    cy.get('.mat-dialog-content > p:nth-child(2) > mat-form-field')
      .type('user123')
      .get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('newSuper *');
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
    logout();
    cy.get('[formcontrolname="name"]')
      .clear()
      .type('newSuper')
      .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
      .type('user123');
    cy.contains('Weiter als Admin')
      .click();
    cy.contains('Verwaltung von Testinhalten')
      .should('exist');
    cy.contains('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen')
      .should('exist');
  });

  it('Should not change super admin status without correct password', () => {
    cy.contains('super *')
      .click()
      .get('button.mat-focus-indicator:nth-child(4)')
      .click()
      .wait(1000);
    cy.get('button.mat-primary > span:nth-child(1)')
      .click()
      .wait(1000);
    cy.get('.mat-dialog-content > p:nth-child(2) > mat-form-field')
      .type('wrongPassword')
      .get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('Fehler: Für diese Funktion haben Sie keine Berechtigung.')
      .should('exist');
    cy.contains('Fehler: Für diese Funktion haben Sie keine Berechtigung.')
      .click();
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
  });

  it('Should change super admin status with correct password', () => {
    cy.contains('super *')
      .click()
      .get('button.mat-focus-indicator:nth-child(4)')
      .click();
    cy.get('button.mat-primary > span:nth-child(1)')
      .click()
      .wait(1000);
    cy.get('.mat-dialog-content > p:nth-child(2) > mat-form-field')
      .type('user123')
      .get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('newSuper')
      .should('exist');
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
    logout();
    cy.get('[formcontrolname="name"]')
      .clear()
      .type('super')
      .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
      .type('user123');
    cy.contains('Weiter als Admin')
      .click();
    cy.contains('Verwaltung von Testinhalten')
      .should('exist');
    cy.contains('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen')
      .should('not.exist');
  });

  it('Should add a new workspace', () => {
    cy.get('a.mat-tab-link:nth-child(2)')
      .click();
    cy.location().should(loc => {
      expect(loc.href).to.eq(`${Cypress.env('TC_URL')}/#/superadmin/workspaces`);
    });
    cy.get('button.mat-focus-indicator:nth-child(1)')
      .click();
    cy.get('.mat-dialog-content > p:nth-child(1) >mat-form-field')
      .type('ws 2')
      .get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('ws 2')
      .should('exist');
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
  });

  it('Should change users access rights on workspace tab', () => {
    cy.get('a.mat-tab-link:nth-child(2)')
      .click();
    cy.contains('ws 2')
      .click()
      .wait(500);
    cy.get('mat-checkbox > label:nth-child(1) > span:nth-child(1)').eq(6)
      .click();
    cy.get('mat-checkbox > label:nth-child(1) > span:nth-child(1)').eq(3)
      .click();
    cy.get('div.ng-star-inserted:nth-child(1) > button:nth-child(2)')
      .click();
    cy.contains('ws 1')
      .click();
    cy.contains('ws 2')
      .click()
      .get('mat-checkbox > label:nth-child(1) > span:nth-child(1) > input').eq(3)
      .should('be.checked');
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
  });

  it('Should delete a user with checkbox', () => {
    cy.contains('workspace_admin')
      .should('exist');
    cy.get('#mat-checkbox-3 > label:nth-child(1) > span:nth-child(1)').eq(0)
      .click();
    cy.get('#mat-checkbox-3 > label:nth-child(1) > span:nth-child(1) input').eq(0)
      .should('be.checked');
    cy.get('button.mat-focus-indicator:nth-child(2)').eq(0)
      .click()
      .get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('workspace_admin')
      .should('not.exist')
      .get('.mat-tooltip-trigger').eq(0)
      .click();
  });

  it('Should delete a workspace', () => {
    cy.get('a.mat-tab-link:nth-child(2)')
      .click();
    cy.contains('ws 2')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(2)').eq(0)
      .click();
    cy.get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.contains('ws 2')
      .should('not.exist');
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
  });

  it('Should go to System-Admin (management window)', () => {
    cy.get('a.mat-tab-link:nth-child(2)')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/superadmin/workspaces`);
    cy.get('a.mat-tab-link:nth-child(3)')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/superadmin/settings`);
    cy.get('a.mat-tab-link:nth-child(1)')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/superadmin/users`);
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
  });

  it('Should open workspace', () => {
    cy.visit(`${Cypress.env('TC_URL')}/#/login/`);
    login('super', 'user123');
    cy.contains('Weiter als Admin')
      .click();
    cy.contains('ws 1')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/admin/1/files`);
    cy.get('a.mat-tab-link:nth-child(2)')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/admin/1/syscheck`);
    cy.get('a.mat-tab-link:nth-child(3)')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/admin/1/results`);
    cy.get('a.mat-tab-link:nth-child(1)')
      .click();
    cy.url().should('eq', `${Cypress.env('TC_URL')}/#/admin/1/files`);
  });
});
