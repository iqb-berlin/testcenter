export const deleteDownloadsFolder = () => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.task('deleteFolder', downloadsFolder);
};

export const visitLoginPage = () => {
  cy.visit(`${Cypress.env('TC_URL')}/#/r/login/`);
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
  cy.wait(100);
  insertCredentials(username, password);
};

export const logout = () => {
  visitLoginPage();
  cy.intercept({
    method: 'GET',
    url: `${Cypress.env('TC_URL')}/api/**`
  }).as('dataGetFirst');
  cy.wait('@dataGetFirst');
  cy.get('[data-cy="logout"]')
    .should('be.visible')
    .click();
  cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/login/`);
};

export const loginAdmin = () => {
  login('super', 'user123');
  cy.get('[data-cy="login-admin"]').click();
  cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/admin-starter`);
  cy.get('.mat-primary > span:nth-child(1)').click();
  cy.url('eq', `${Cypress.env('TC_URL')}/#/admin/1/files`);
};

export const loginSuperAdmin = () => {
  resetBackendData();
  visitLoginPage();
  insertCredentials('super', 'user123');
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.url().should('eq', `${Cypress.env('TC_URL')}/#/r/admin-starter`);
  cy.contains('Systemverwaltung')
    .click();
  cy.url().should('eq', `${Cypress.env('TC_URL')}/#/superadmin/users`);
};
