import {
  oneStepLogin,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
}
  from '../utils';

describe('The login-sink', () => {
  before(() => {
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
  });

  const adminLoginAttempt = (user: string, expectedCode: number, pw: string = 'wrongpassword') => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/admin-login`);
    cy.wait(1); // seems to be unreliable without
    oneStepLogin(user, pw);
    cy.get(`[data-cy="login-problem:${expectedCode}"]`)
      .should('exist');
  };

  it('trigger after five failed logins for the same admin user', () => {
    adminLoginAttempt('super', 400);
    adminLoginAttempt('super', 400);
    adminLoginAttempt('super', 400);
    adminLoginAttempt('super', 400);
    adminLoginAttempt('super', 400);
    adminLoginAttempt('super', 429);
    adminLoginAttempt('super', 429, 'user123');
  });
});
