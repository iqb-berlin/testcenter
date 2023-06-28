import {
  convertResultsLoginRows,
  loginSuperAdmin,
  loginTestTaker,
  useTestDB,
  openSampleWorkspace1,
  resetBackendData,
  logoutAdmin,
  visitLoginPage,
  deleteTesttakersFiles,
  deleteDownloadsFolder,
  insertCredentials,
  logoutTestTaker,
  openSampleWorkspace2,
  convertResultsSeperatedArrays,
  useTestDBSetDate,
  getFromIframe,
  forwardTo,
  backwardsTo
} from './utils';

let idHres1;
let idHres2;

describe('Check Testtakers Content', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(openSampleWorkspace1);
  beforeEach(deleteTesttakersFiles);

  afterEach(logoutAdmin);

  it('should be possible to load a correct testtaker-xml without any error message', () => {
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('exist');
  });

  it('should be not possible to load a incorrect testtaker-xml with a duplicated group name)', () => {
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Testtaker_DuplicatedGroup.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('Duplicate')
      .should('exist');
    cy.contains('GroupId')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });

  it('should be not possible to load a incorrect testtaker-xml with a duplicated login name)', () => {
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Testtaker_DuplicatedLogin.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('Duplicate login')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });
});

describe('Check Testtakers Duplicates in workspaces', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);

  afterEach(logoutAdmin);

  it('should be not possible to overwrite the testtaker file in ws1, if the file have the another name', () => {
    openSampleWorkspace1();
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .should('exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains(/^Duplicate login:.*/)
      .should('exist');
    cy.contains(/^Duplicate group:.*/)
      .should('exist');
    cy.contains('Ok')
      .click();
  });

  it('should be possible overwrite the testtaker file in ws1, if the file have the same name', () => {
    openSampleWorkspace1();
    deleteTesttakersFiles();
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('overwritten')
      .should('exist');
    cy.contains('Ok')
      .click();
  });

  it('should not be possible to load the same testtaker file that is already exist in ws1 to ws2', () => {
    openSampleWorkspace2();
    deleteTesttakersFiles();
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains(/^Duplicate login:.*- also on workspace sample_workspace in file.*/)
      .should('exist');
    cy.contains(/^Duplicate group:.*- also on workspace sample_workspace in file*/)
      .should('exist');
    cy.contains('Ok')
      .click();
  });
});

describe('Check Login Possibilities', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);

  it('should not be possible to log in with a name and without an existing password', () => {
    insertCredentials('with_pw', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.contains(/^Anmeldedaten sind nicht gültig..*/)
      .should('exist');
  });

  it('should be not possible to login with name and wrong password', () => {
    insertCredentials('with_pw', '123');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.contains(/^Anmeldedaten sind nicht gültig..*/)
      .should('exist');
  });

  it('should be possible to login with name and right password and start test immediately', () => {
    insertCredentials('with_pw', '101');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('with_pw')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login only with a name', () => {
    insertCredentials('without_pw', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('without_pw')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login as link', () => {
    cy.visit(`${Cypress.config().baseUrl}`);
    cy.visit(`${Cypress.config().baseUrl}/#/as_link`);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
    cy.contains('as_link')
      .should('exist');
  });

  it('should be not possible to login with wrong code', () => {
    cy.visit(`${Cypress.config().baseUrl}`);
    insertCredentials('as_code1', '102');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .type('123');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.contains(/^Der Code ist leider nicht gültig.*/)
      .should('exist');
  });

  it('should be possible to login with right code and password', () => {
    insertCredentials('as_code1', '102');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .type('as_code01');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('as_code01')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login with code without password', () => {
    insertCredentials('as_code2', '');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('as_code02')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to login with code without password', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/as_code2`);
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    cy.get('[formcontrolname="code"]')
      .should('exist')
      .clear()
      .type('as_code02');
    cy.get('[data-cy="continue"]')
      .should('exist')
      .click();
    cy.get('iframe.unitHost');
    cy.get('[data-cy="logo"]')
      .click();
    cy.contains('as_code02')
      .should('exist');
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist');
  });

  it('should be possible to start a group monitor', () => {
    insertCredentials('group-monitor', '301');
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/monitor-starter`);
    cy.get('[data-cy="GM-SM_HotModes"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/gm/SM_HotModes`);
    cy.contains('hret1')
      .should('exist');
    cy.contains('hret2')
      .should('exist');
  });
});

describe('Check hot-return mode functions', () => {
  // abfangen der Calls schwierig, Test scheitert manchmal--> Optimierung nach Änderungen durch Philipp
  // Testfälle bzgl. Ticket #315 erstellen
  before(resetBackendData);
  before(deleteDownloadsFolder);
  beforeEach(() => {
    useTestDB();
    visitLoginPage();
  });

  it('should be possible to start a hot-return-mode study as login: hret1', () => {
    loginTestTaker('hret1', '201', true);

    cy.contains(/^Aufgabe1$/)
      .should('exist');

    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-101/response`).as('response-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.wait('@response-1');

    forwardTo('Aufgabe2');

    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-102/response`).as('response-2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click();
    cy.wait('@response-2');

    backwardsTo('Aufgabe1');

    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');

    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-102/state`).as('unit-102-state');
    forwardTo('Aufgabe2');
    cy.wait('@unit-102-state');

    logoutTestTaker('hot');
  });

  it('should restore the last given replies from login: hret1', () => {
    loginTestTaker('hret1', '201', true);

    cy.contains(/^Aufgabe2$/)
      .should('exist');

    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .should('be.checked');

    backwardsTo('Aufgabe1');

    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');

    logoutTestTaker('hot');
  });

  it('should be possible to start a hot-return-mode study as login: hret2', () => {
    loginTestTaker('hret2', '202', true);

    cy.contains(/^Aufgabe1$/)
      .should('exist');

    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-101/response`).as('response-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.wait('@response-1');

    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-102/state`).as('unitState102');
    forwardTo('Aufgabe2');
    cy.wait('@unitState102');

    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-102/response`).as('response-2');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click();
    cy.wait('@response-2');

    logoutTestTaker('hot');
  });

  it('should be a generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.contains('SM_HotModes')
      .should('exist');
    cy.get('[data-cy="results-checkbox1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="download-responses"]')
      .should('exist')
      .click();
  });

  it('should be saved recent replies from login: hret1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhret1\b/);
        expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[1]).to.be.match(/\bradio1"":""true\b/);
        expect(responses[2]).to.be.match(/\bhret1\b/);
        expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[2]).to.be.match(/\bradio2"":""true\b/);
      });

    logoutAdmin();
  });

  it('should be saved recent replies from login: hret2 in downloaded response file', () => {
    convertResultsLoginRows('responses')
      .then(responses => {
        expect(responses[3]).to.be.match(/\bhret2\b/);
        expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[3]).to.be.match(/\bradio1"":""true\b/);
        expect(responses[4]).to.be.match(/\bhret2\b/);
        expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[4]).to.be.match(/\bradio2"":""true\b/);
      });

    logoutAdmin();
  });
});

describe.skip('Check hot-restart-mode functions', () => {
  // todo: waits beim Setzen der Checkboxen ersetzen
  // abfangen der Calls schwierig, Test scheitert manchmal--> Optimierung nach Änderungen durch Philipp
  before(resetBackendData);
  before(deleteDownloadsFolder);
  beforeEach(() => {
    useTestDB();
    visitLoginPage();
  });

  it('should be possible to start a hot-restart-mode study as login: hres1', () => {
    loginTestTaker('hres1', '203');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/state`).as('testState');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-101/state`).as('unitState101');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/log`).as('testLog');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/commands`).as('commands');
    cy.contains('Sessionmanagement test hot modes')
      .should('exist');
    cy.contains(/^Starten$/)
      .should('exist');
    cy.get('[data-cy="booklet-SM_BKL"]')
      .should('exist')
      .click();
    cy.wait(['@testState', '@unitState101', '@unitState101', '@unitState101', '@testLog', '@commands']);
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    cy.wait(1000);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('exist')
      .click()
      .should('be.checked');
    cy.wait(1000);
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-102/state`).as('unitState102');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/3/unit/UNIT.SAMPLE-102/response`).as('unitResponse102');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist')
      .click();
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.wait(['@unitState102', '@unitState102', '@unitResponse102']);
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .should('exist')
      .click()
      .should('be.checked');
    cy.wait(1000);
    logoutTestTaker('hot');
  });

  it('should be a generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.contains('SM_HotModes')
      .should('exist');
    cy.get('[data-cy="results-checkbox1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="download-responses"]')
      .should('exist')
      .click();
  });

  it('should be saved recent replies from first login: hres1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhres1\b/);
        expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[1]).to.be.match(/\bradio1"":""true\b/);
        expect(responses[2]).to.be.match(/\bhres1\b/);
        expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[2]).to.be.match(/\bradio2"":""true\b/);
      });
  });

  it('should be possible to start a new hot-restart-mode study with the same login: hres1', () => {
    loginTestTaker('hres1', '203');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/state`).as('testState');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-101/state`).as('unitState101');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/log`).as('testLog');
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/commands`).as('commands');
    cy.contains('Sessionmanagement test hot modes')
      .should('exist');
    cy.contains(/^Starten$/)
      .should('exist');
    cy.get('[data-cy="booklet-SM_BKL"]')
      .should('exist')
      .click();
    cy.wait(['@testState', '@unitState101', '@unitState101', '@testLog', '@commands']);
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    cy.wait(1000);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('exist')
      .should('not.be.checked')
      .click()
      .should('be.checked');
    cy.wait(1000);
    cy.intercept(`${Cypress.env('TC_API_URL')}/test/4/unit/UNIT.SAMPLE-102/state`).as('unitState102');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist')
      .click();
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.wait(['@unitState102', '@unitState102']);
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .should('exist')
      .should('not.be.checked')
      .click()
      .should('be.checked');
    cy.wait(1000);
    logoutTestTaker('hot');
  });

  it('should be a newer generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.get('[data-cy="results-checkbox1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="download-responses"]')
      .should('exist')
      .click();
  });

  it('should be saved recent replies from second login: hres1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
      .then(responses => {
        expect(responses[3]).to.be.match(/\bhres1\b/);
        expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-101\b/);
        expect(responses[3]).to.be.match(/\bradio1"":""true\b/);
        expect(responses[4]).to.be.match(/\bhres1\b/);
        expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-102\b/);
        expect(responses[4]).to.be.match(/\bradio1"":""true\b/);
      });
  });

  it('should be generated a different ID for each hres-login', () => {
    // save the generated ID from first hres-login
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres1 = LoginID[1][2];
      });
    // save the generated ID from second hres-login
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres2 = LoginID[2][2];
      });

    expect(idHres1).to.be.not.equal(idHres2);
  });
});

describe('Check logins with time restrictions', () => {
  // find the current time and dates restrictions in /sampledata/system-test/CY_Test_Logins.xml
  describe('Check valid from restrictions', () => {
    before(resetBackendData);
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
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
      logoutTestTaker('demo');
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
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/4/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
      logoutTestTaker('demo');
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
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/3/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
      logoutTestTaker('demo');
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
      cy.url().should('eq', `${Cypress.config().baseUrl}/#/t/4/u/1`);
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="booklet-RUNDEMO"]')
        .should('exist');
      logoutTestTaker('demo');
    });
  });

  describe('Check valid for restrictions', () => {
    before(resetBackendData);
    beforeEach(useTestDB);
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
    });

    it('should be not possible to login again after the time (10 minutes) expires.', () => {
      // UnixTimestamp: 31.05.2023 10:30 + 11 Minuten
      useTestDBSetDate('1685522460');
      insertCredentials('validFor01', '123');
      cy.get('[data-cy="login-user"]')
        .should('exist')
        .click();
      cy.get('[data-cy="main-alert:WARNING"]')
        .should('exist')
        .contains('Gone');
      cy.get('[data-cy="close-alert"]')
        .click();
    });
  });
});
