import Chainable = Cypress.Chainable;

export const userData = {
  SuperAdminName: 'super',
  SuperAdminPassword: 'user123',
  WorkspaceAdminName: 'workspace_admin',
  WorkspaceAdminPassword: 'anotherPassword'
};

export const credentialsControllerTest = {
  // Restriction Time: Declared in Sampledata/CY_BKL_Mode_Demo.xml
  DemoRestrTime: 60000
};

export const deleteDownloadsFolder = (): void => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.task('deleteFolder', downloadsFolder);
};

export const visitLoginPage = (): Chainable => cy.url()
  .then(url => {
    if (url !== `${Cypress.config().baseUrl}/#/r/login/`) {
      cy.intercept({ url: new RegExp(`${Cypress.env('TC_API_URL')}/(system/config|sys-checks)`) }).as('waitForConfig');
      cy.visit(`${Cypress.config().baseUrl}/#/r/login/`);
      cy.wait('@waitForConfig');
    }
  });

export const resetBackendData = (): void => {
  // this resets the DB because in system-test TESTMODE_REAL_DATA is true
  cy.request({
    url: `${Cypress.env('TC_API_URL')}/version`,
    headers: { TestMode: 'prepare-integration' }
  })
    .its('status').should('eq', 200);
  // sometimes DB isn't ready even after the endpoint returned 200
  // TODO replace this by something more meaningful
  cy.wait(500);
};

export const insertCredentials = (username: string, password = ''): void => {
  cy.get('[formcontrolname="name"]')
    .should('exist')
    .clear()
    .type(username);
  if (password) {
    cy.get('[formcontrolname="pw"]')
      .clear()
      .type(password);
  }
};

export const logout = (): Chainable => cy.url()
  .then(url => {
    if (url !== `${Cypress.config().baseUrl}/#/r/login/`) {
      cy.get('[data-cy="logo"]')
        .should('exist')
        .click();
      cy.get('[data-cy="logout"]')
        .should('exist')
        .click();
      cy.url()
        .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
    }
  });

export const logoutAdmin = (): void => {
  cy.get('[data-cy="logo"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/r/admin-starter`);
  cy.get('[data-cy="workspace-1"]')
    .should('exist'); // make sure call returned
  cy.get('[data-cy="logout"]')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
};

export const logoutTestTaker = (): void => {
  cy.get('[data-cy="logo"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
  cy.get('[data-cy="logout"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
};

export const openSampleWorkspace = (): void => {
  cy.get('[data-cy="workspace-1"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
};

export const loginSuperAdmin = (): void => {
  insertCredentials(userData.SuperAdminName, userData.SuperAdminPassword);
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .should('exist')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/admin-starter`);
  cy.contains(userData.SuperAdminName)
    .should('exist');
};

export const loginWorkspaceAdmin = (): void => {
  insertCredentials(userData.WorkspaceAdminName, userData.WorkspaceAdminPassword);
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .should('exist')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/admin-starter`);
  cy.contains(userData.WorkspaceAdminName)
    .should('exist');
};

export const loginTestTaker = (name: string, password: string): void => {
  insertCredentials(name, password);
  cy.get('[data-cy="login-user"]')
    .should('exist')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
  cy.contains(name)
    .should('exist');
};

export const clickSuperadmin = (): void => {
  cy.contains('Systemverwaltung')
    .should('exist')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`);
};

export const addWorkspaceAdmin = (username: string, password: string): void => {
  cy.get('[data-cy="superadmin-tabs:users"]')
    .should('exist')
    .click();
  cy.get('[data-cy="add-user"]')
    .click();
  cy.get('[formcontrolname="name"]')
    .should('exist')
    .type(username);
  cy.get('[formcontrolname="pw"]')
    .should('exist')
    // password < 7 characters
    .type('123456')
    .get('[type="submit"]')
    .should('be.disabled');
  cy.get('[formcontrolname="pw"]')
    .clear()
    .type(password)
    .get('[type="submit"]')
    .should('be.enabled')
    .click();
  cy.contains(username)
    .should('exist');
};

export const deleteFilesSampleWorkspace = (): void => {
  cy.get('[data-cy="files-checkAll-Testtakers"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-Booklet"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-SysCheck"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-Resource"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-Unit"]')
    .should('exist')
    .click();
  cy.get('[data-cy="delete-files"]')
    .should('exist')
    .should('exist')
    .click();
  cy.get('[data-cy="dialog-confirm"]')
    .should('exist')
    .should('exist')
    .click();
  cy.contains('erfolgreich gelöscht.')
    .should('exist');
  cy.contains('Teilnehmerlisten')
    .should('not.exist');
  cy.contains('Testhefte')
    .should('not.exist');
  cy.contains('System-Check-Definitionen')
    .should('not.exist');
  cy.contains('Ressourcen')
    .should('not.exist');
};

export const useTestDB = () : void => {
  cy.intercept(new RegExp(`${Cypress.env('TC_API_URL')}/.*`), req => {
    req.headers.TestMode = 'integration';
  }).as('testMode');
};
