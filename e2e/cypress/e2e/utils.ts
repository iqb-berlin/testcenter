export const deleteDownloadsFolder = (): void => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.task('deleteFolder', downloadsFolder);
};

export const visitLoginPage = (): void => {
  cy.intercept({ url: `${Cypress.env('TC_API_URL')}/*` }).as('waitForConfig');
  cy.visit(`${Cypress.config().baseUrl}/#/r/login/`);
  cy.wait('@waitForConfig');
};

export const resetBackendData = (): void => {
  // this resets the DB because in system-test TESTMODE_REAL_DATA is true
  cy.request({
    url: `${Cypress.env('TC_API_URL')}/version`,
    headers: { TestMode: 'True' }
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

export const logoutAdmin = (): void => {
  cy.visit(`${Cypress.config().baseUrl}/#/r/admin-starter`)
    .should('exist');
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
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/admin-starter`);
  cy.contains(username)
    .should('exist');
};

export const logout = (): void => {
  cy.url().then($url => {
    if ($url.includes(`${Cypress.config().baseUrl}/#/r/admin-starter`)) {
      cy.get('[data-cy="logout"]')
        .click();
    } else {
      cy.log('Not logged in... doing nothing.');
    }
  });
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
