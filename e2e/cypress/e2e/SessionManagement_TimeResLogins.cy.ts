import {
  ConvertResultsLoginRows, loginSuperAdmin, loginTestTaker, useTestDB, openSampleWorkspace1,
  resetBackendData, logoutAdmin, visitLoginPage, deleteTesttakersFiles, deleteDownloadsFolder, insertCredentials,
  logoutTestTaker, ConvertResultsSeperatedArrays, useTestDBSetDate
} from './utils';

let firstLoginTime: number;
let generatedTimeNum: number;
let generatedTimeString;

describe('Check logins with time restrictions', () => {
  // find the current time and dates restrictions in /sampledata/system-test/CY_Test_Logins.xml
  describe.skip('Check valid for restrictions', () => {
    beforeEach(resetBackendData);
    beforeEach(useTestDB);
    beforeEach(visitLoginPage);

    it('should be not possible to login before the valid-from-date: 01.06.2023 10:00 related to time.', () => {
    // UnixTimestamp: 01.06.2023 09:00
      useTestDBSetDate('1685602800');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="main-alert:WARNING"]')
        .should('exist')
        .contains('Unauthorized');
      cy.get('[data-cy="close-alert"]')
        .click();
    });

    it('should be possible to login after the valid-from-date: 01.06.2023 10:00 related to time.', () => {
    // UnixTimestamp: 01.06.2023 10:30
      useTestDBSetDate('1685608200');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
      cy.contains('validFrom01')
        .should('exist');
    });

    it('should be not possible to login before the valid-from-date: 01.06.2023 10:00 related to date.', () => {
    // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="main-alert:WARNING"]')
        .should('exist')
        .contains('Unauthorized');
      cy.get('[data-cy="close-alert"]')
        .click();
    });

    it('should be possible to login after the valid-from-date: 01.06.2023 10:00 related to date.', () => {
    // UnixTimestamp: 02.06.2023 09:30
      useTestDBSetDate('1685691000');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
      cy.contains('validFrom01')
        .should('exist');
    });
  });

  describe('Check valid to restrictions', () => {
    before(resetBackendData);
    beforeEach(useTestDB);
    beforeEach(visitLoginPage);

    it('should be not possible to login after the valid-to-date: 01.06.2023 10:00 related to time.', () => {
    // UnixTimestamp: 01.06.2023 11:00
      useTestDBSetDate('1685610000');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="main-alert:WARNING"]')
        .should('exist')
        .contains('Gone');
      cy.get('[data-cy="close-alert"]')
        .click();
    });

    it('should be possible to login before the valid-to-date: 01.06.2023 10:00 related to time.', () => {
    // UnixTimestamp: 01.06.2023 09:00
      useTestDBSetDate('1685602800');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
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
      cy.get('[data-cy="main-alert:WARNING"]')
        .should('exist')
        .contains('Gone');
      cy.get('[data-cy="close-alert"]')
        .click();
    });

    it('should be possible to login before the valid-to-date: 01.06.2023 10:00 related to date.', () => {
    // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
    });
  });

  describe.skip('Check valid for restrictions', () => {
    beforeEach(resetBackendData);
    beforeEach(useTestDB);
    before(() => {
      useTestDB();
      visitLoginPage();
    });

    it('should be possible to login again before the time (10 minutes) expires.', () => {
      loginTestTaker('validFor01', '123');
      firstLoginTime = Math.floor(new Date().getTime() / 1000);
      logoutTestTaker('demo');
      // set the system time 9 minutes forward
      generatedTimeNum = firstLoginTime + 540;
      generatedTimeString = generatedTimeNum.toString();
      //resetBackendData();
      //useTestDB();
      useTestDBSetDate(generatedTimeString);
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
      cy.contains('validFor01')
        .should('exist');
    });

    it.skip('should be not possible to login again after the time (10 minutes) expires.', () => {
      loginTestTaker('validFor01', '123');
      firstLoginTime = Math.floor(new Date().getTime() / 1000);
      logoutTestTaker('demo');
      // set the system time 9 minutes forward
      generatedTimeNum = firstLoginTime + 540;
      generatedTimeString = generatedTimeNum.toString();
      resetBackendData();
      useTestDB();
      useTestDBSetDate(generatedTimeString);
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
      cy.contains('validFor01')
        .should('exist');
    });
  });
});
