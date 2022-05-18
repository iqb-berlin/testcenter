export const deleteDownloadsFolder = () => {
  const downloadsFolder = Cypress.config("downloadsFolder");
  cy.task("deleteFolder", downloadsFolder);
};

export const visitLoginPage = () => {
  cy.visit("http://localhost:4200/#/login/");
}

export const login = (username, password) => {
  cy.get('mat-form-field input').eq(0)
    .clear()
    .type(username)
    .get('mat-form-field input').eq(1)
    .type(password);
}

export const logout = () => {
  visitLoginPage();
  cy.contains('Neu anmelden')
    .click();
  cy.url().should('eq', 'http://localhost:4200/#/r/login/')
}

export const loginAdmin = () => {
  cy.visit("http://localhost:4200/#/login/");
  login('super', 'user123');
  cy.contains("Weiter als Admin").click();
  cy.url().should('eq', 'http://localhost:4200/#/r/admin-starter');
  cy.get('.mat-primary > span:nth-child(1)').click();
  cy.url('eq', 'http://localhost:4200/#/admin/1/files');
};

export const loginSuperAdmin = () => {
  cy.visit('http://localhost:4200/#/login/')
  login('super', 'user123')
  cy.contains('Weiter als Admin')
    .click()
  cy.url().should('eq', 'http://localhost:4200/#/r/admin-starter');
  cy.contains('System-Admin')
    .click()
  cy.url().should('eq', 'http://localhost:4200/#/superadmin/users')
}

export const createUserAnswers = () => {
  cy.visit('http://localhost:4200/#/login/');
  login('test', 'user123')
  cy.contains('Weiter')
    .click()
    .wait(1000);
  cy.get('.mat-form-field-infix')
    .type('xxx')
    .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
    .click();
  cy.get('a.mat-primary:nth-child(1) > span:nth-child(1) > div:nth-child(1)')
    .click();
  cy.iframe('.unitHost').find('#unit > fieldset:nth-child(4) > div:nth-child(2) > div:nth-child(2) > label:nth-child(2) > input:nth-child(1)')
    .type('Test Satz')
  cy.get('.mat-tooltip-trigger').eq(0)
    .click();
  cy.get('button.mat-focus-indicator:nth-child(1) > span:nth-child(1)')
    .click();
  logout()
}
