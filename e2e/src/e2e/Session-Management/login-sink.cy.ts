import { insertCredentials, probeBackendApi, resetBackendData, visitLoginPage } from '../utils';

describe('The login-sink', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
  });

  const loginAttempt = (type: 'admin' | 'user', user: string, expectedCode: number, pw: string = 'wrongpassword') => {
    insertCredentials(user, pw);
    cy.get(`[data-cy="login-${type}`)
      .click();
    cy.get(`[data-cy="login-problem:${expectedCode}"]`)
      .should('exist');
  };

  it('trigger after five failed logins for the same admin user', () => {
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 429);
    loginAttempt('admin', 'super', 429, 'user123');
    loginAttempt('admin', 'super', 429);
    cy.wait(10000); // in testmode the sink is only activated for a few seconds
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 400);
    loginAttempt('admin', 'super', 429);
    loginAttempt('admin', 'super', 429, 'user123');
  });

  it('not trigger for testtaker logins', () => {
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
  });

  it('user- and admin-logout must be independent of each other.', () => {
    cy.wait(10000);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('user', 'username', 400);
    loginAttempt('admin', 'username', 400);
    loginAttempt('admin', 'username', 400, 'user123');
    loginAttempt('admin', 'username', 400);
  });
});
