import {
  insertCredentials,
  logoutTestTaker,
  resetBackendData,
  useTestDBSetDate,
  visitLoginPage
} from '../utils';

describe('Check logins with time restrictions', () => {
  // find the current time and dates restrictions in /sampledata/system-test/CY_Test_Logins.xml
  describe('Check valid from restrictions', () => {
    beforeEach(resetBackendData);
    beforeEach(visitLoginPage);

    it('should be not possible to login before the valid-from-date: 01.06.2023 10:00 related to time.', () => {
      // UnixTimestamp: 01.06.2023 09:00
      useTestDBSetDate('1685602800');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="login-problem:401"]')
        .should('exist');
    });

    it('should be possible to login after the valid-from-date: 01.06.2023 10:00 related to time.', () => {
      // UnixTimestamp: 01.06.2023 10:30
      useTestDBSetDate('1685608200');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
    });

    it('should be not possible to login before the valid-from-date: 01.06.2023 10:00 related to date.', () => {
      // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="login-problem:401"]')
        .should('exist');
    });

    it('should be possible to login after the valid-from-date: 01.06.2023 10:00 related to date.', () => {
      // UnixTimestamp: 02.06.2023 09:30
      useTestDBSetDate('1685691000');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
    });
  });

  describe('Check valid to restrictions', () => {
    beforeEach(resetBackendData);
    beforeEach(visitLoginPage);

    it('should be not possible to login after the valid-to-date: 01.06.2023 10:00 related to time.', () => {
      // UnixTimestamp: 01.06.2023 11:00
      useTestDBSetDate('1685610000');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="login-problem:410"]')
        .should('exist');
    });

    it('should be possible to login before the valid-to-date: 01.06.2023 10:00 related to time.', () => {
      // UnixTimestamp: 01.06.2023 09:00
      useTestDBSetDate('1685602800');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
    });

    it('should be not possible to login after the valid-to-date: 01.06.2023 10:00 related to date.', () => {
      // UnixTimestamp: 02.06.2023 09:30
      useTestDBSetDate('1685691000');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="login-problem:410"]')
        .should('exist');
    });

    it('should be possible to login before the valid-to-date: 01.06.2023 10:00 related to date.', () => {
      // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
    });
  });

  describe('Check valid for restrictions', { testIsolation: false }, () => {
    before(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      resetBackendData();
    });
    beforeEach(visitLoginPage);

    it('should be possible a first login with for-time-restriction.', () => {
      // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNREVIEW"]')
        .should('exist');
      logoutTestTaker('demo');
    });

    it('should be possible to login again before the time (10 minutes) expires.', () => {
      // UnixTimestamp: 31.05.2023 10:30 + 9 Minuten
      useTestDBSetDate('1685522340');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNREVIEW"]')
        .should('exist');
      logoutTestTaker('demo');
    });

    it('should be not possible to login again after the time (10 minutes) expires.', () => {
      // UnixTimestamp: 31.05.2023 10:30 + 11 Minuten
      useTestDBSetDate('1685522460');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="login-problem:410"]')
        .should('exist');
    });
  });
});
