import {
  insertCredentials,
  logoutTestTaker,
  probeBackendApi,
  resetBackendData,
  useTestDBSetDate,
  visitLoginPage
} from '../utils';

describe('check valid from restrictions', () => {
  // find the current time and dates restrictions in /sampledata/system-test/CY_Test_Logins.xml
  describe('Check "valid from" restrictions', () => {
    before(() => {
      resetBackendData();
      probeBackendApi();
    });
    beforeEach(visitLoginPage);

    it('login before time must be impossible', () => {
      // UnixTimestamp: 01.06.2023 09:00
      useTestDBSetDate('1685602800');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="login-problem:401"]');
    });

    it('login after time must be possible ', () => {
      // UnixTimestamp: 01.06.2023 10:30
      useTestDBSetDate('1685608200');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
    });

    it('login before date must be impossible', () => {
      // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="login-problem:401"]');
    });

    it('login after date must be possible.', () => {
      // UnixTimestamp: 02.06.2023 09:30
      useTestDBSetDate('1685691000');
      insertCredentials('validFrom01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
    });
  });

  describe('check "valid to" restrictions', () => {
    before(() => {
      resetBackendData();
      probeBackendApi();
    });
    beforeEach(visitLoginPage);

    it('login after time must be impossible', () => {
      // UnixTimestamp: 01.06.2023 11:00
      useTestDBSetDate('1685610000');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="login-problem:410"]');
    });

    it('login before time must be possible', () => {
      // UnixTimestamp: 01.06.2023 09:00
      useTestDBSetDate('1685602800');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
    });

    it('login after date must be impossible', () => {
      // UnixTimestamp: 02.06.2023 09:30
      useTestDBSetDate('1685691000');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="login-problem:410"]');
    });

    it('login before date must be possible', () => {
      // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validTo01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]');
    });
  });

  describe('check "valid for" restrictions', { testIsolation: false }, () => {
    before(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      resetBackendData();
      probeBackendApi();
    });
    beforeEach(visitLoginPage);

    it('a first time login must be possible', () => {
      // UnixTimestamp: 31.05.2023 10:30
      useTestDBSetDate('1685521800');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-CY-BKLT_RUNREVIEW"]');
      logoutTestTaker('demo');
    });

    it('a second login must be possible if the time has not expired', () => {
      // UnixTimestamp: 31.05.2023 10:30 + 9 Minuten
      useTestDBSetDate('1685522340');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-CY-BKLT_RUNREVIEW"]');
      logoutTestTaker('demo');
    });

    it('login after time is not possible', () => {
      // UnixTimestamp: 31.05.2023 10:30 + 11 Minuten
      useTestDBSetDate('1685522460');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .click();
      cy.get('[data-cy="login-problem:410"]');
    });
  });
});
