import Chainable = Cypress.Chainable;

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
    headers: { TestMode: 'prepare' }
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

export const login = (username: string, password: string): void => {
  resetBackendData();
  visitLoginPage();
  insertCredentials(username, password);
};

export const logoutAdmin = (): void => {
  cy.visit(`${Cypress.config().baseUrl}/#/r/admin-starter`);
  cy.get('[data-cy="workspace-1"]')
    .should('exist'); // make sure call returned
  cy.get('[data-cy="logout"]')
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

export const loginAdmin = (username: string, password: string): void => {
  visitLoginPage();
  insertCredentials(username, password);
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/admin-starter`);
  cy.contains(username)
    .should('exist');
};

export const clickSuperadmin = (): void => {
  cy.contains('Systemverwaltung')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`);
};

export const addWorkspaceAdmin = (username: string, password: string): void => {
  cy.get('[data-cy="superadmin-tabs:users"]')
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
  cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
    .click();
  cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
    .click();
  cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-2"]')
    .click();
  cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-3"]')
    .click();
  cy.get('[data-cy="files-checkbox-SYSCHECK.SAMPLE"]')
    .click();
  cy.get('[data-cy="files-checkbox-SAMPLE_RESOURCE_PACKAGE.ITCR.ZIP"]')
    .click();
  cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]')
    .click();
  cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-4.0"]')
    .click();
  cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
    .click();
  cy.get('[data-cy="files-checkbox-UNIT.SAMPLE-2"]')
    .click();
  cy.get('[data-cy="delete-files"]')
    .click();
  cy.get('[data-cy="dialog-confirm"]')
    .click();
  cy.wait(1000);
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
