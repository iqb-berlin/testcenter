export const deleteDownloadsFolder = () => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.task('deleteFolder', downloadsFolder);
};

export const visitLoginPage = () => {
  cy.intercept({ url: `${Cypress.env('TC_URL')}/api/*` }).as('waitForConfig');
  cy.visit(`${Cypress.env('TC_URL')}/#/r/login/`);
  cy.wait('@waitForConfig');
};

export const resetBackendData = () => {
  // this works because in system-test TESTMODE_REAL_DATA is true
  cy.request({
    url: `${Cypress.env('TC_URL')}/api/version`,
    headers: { TestMode: 'True' }
  })
    .its('status').should('eq', 200);
  cy.wait(500);
};

export const insertCredentials = (username, password = '') => {
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

export const login = (username, password) => {
  resetBackendData();
  visitLoginPage();
  insertCredentials(username, password);
};

export const logoutAdmin = () => {
  cy.visit(`${Cypress.env('TC_URL')}/#/r/admin-starter`);
  cy.get('[data-cy="workspace-1"]')
    .should('exist');
  cy.get('[data-cy="logout"]')
    .click();
  cy.url()
    .should('eq', `${Cypress.env('TC_URL')}/#/r/login/`);
};

export const loginAdmin = () => {
  login('super', 'user123');
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.url()
    .should('eq', `${Cypress.env('TC_URL')}/#/r/admin-starter`);
  cy.get('[data-cy="workspace-1"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.env('TC_URL')}/#/admin/1/files`);
};

export const loginAsAdmin = (username = 'super', password = 'user123') => {
  visitLoginPage();
  insertCredentials(username, password);
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.get('[data-cy="workspace-1"]')
    .should('exist');
};

export const clickSuperadmin = () => {
  cy.contains('Systemverwaltung')
    .click();
  cy.url().should('eq', `${Cypress.env('TC_URL')}/#/superadmin/users`);
};
