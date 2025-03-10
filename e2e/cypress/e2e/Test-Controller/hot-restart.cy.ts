import {
  loginTestTaker,
  resetBackendData,
  logoutTestTaker,
  visitLoginPage,
  deleteDownloadsFolder,
  getFromIframe,
  forwardTo,
  backwardsTo,
  loginSuperAdmin,
  logoutAdmin,
  getResultFileRows,
  disableSimplePlayersInternalDebounce, gotoPage, openSampleWorkspace
} from '../utils';

// declared in Sampledata/CY_ControllerTest_Logins.xml-->Group:runhotret
const TesttakerName1 = 'Test_HotRestart_Ctrl1';
const TesttakerPassword1 = '123';
const TesttakerName2 = 'Test_HotRestart_Ctrl2';
const TesttakerPassword2 = '123';
const TesttakerName3 = 'Test_HotRestart_Ctrl3';
const TesttakerPassword3 = '123';
const TesttakerName4 = 'Test_HotRestart_Ctrl4';
const TesttakerPassword4 = '123';

const mode = 'test-hot';

describe('check hot-restart functionalities', { testIsolation: false }, () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Login1: Resp/Pres complete, leave the block and end the test with IQB-logo', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName1, TesttakerPassword1, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    after(() => {
      logoutTestTaker('hot');
    });

    it('start a hot-restart-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      getFromIframe('[data-cy="TestController-TextStartseite"]')
        .contains('Testung Controller');
    });

    it('enter the block with incorrect password is not possible', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-block-dialog-title"]')
        .contains('Aufgabenblock');
      cy.get('[data-cy="unlockUnit"]')
        .should('contain', '')
        .type('Hund');
      cy.get('[data-cy="unit-block-dialog-submit"]')
        .click();
      cy.get('.snackbar-wrong-block-code')
        .contains('stimmt nicht');
    });

    it('enter the block with correct password', () => {
      cy.get('[data-cy="unit-block-dialog-title"]')
        .contains('Aufgabenblock');
      cy.get('[data-cy="unlockUnit"]')
        .should('contain', '')
        .type('Hase');
      cy.get('[data-cy="unit-block-dialog-submit"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
      cy.get('.snackbar-time-started')
        .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
    });

    it('navigate to next unit without responses/presentation complete is not possible', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabe darf nicht verlassen werden');
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

    it('navigate to the next unit without responses complete is not possible', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabe darf nicht verlassen werden');
      cy.get('[data-cy="dialog-content"]')
        .contains('Es müssen erst alle Teilaufgaben bearbeitet werden.');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('navigate with presentation and response complete to the next unit', () => {
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe2');
    });

    it('complete the test and leave the block with a warning message', () => {
      cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-102/response`).as('response102-1-1');
      getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe3');
      cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-103/response`).as('response103-1-1');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
    });

    it('leave the time restricted block forward without a message is not possible', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('navigate backwards: the last answer must be there', () => {
      backwardsTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
        .should('be.checked');
      backwardsTo('Aufgabe1');
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .should('be.checked');
    });

    it('leave the time restricted block backward without a message ist not possible', () => {
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('leave the time restricted block in unit-menu without a message is not possible', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="endTest"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('.mat-drawer-backdrop')
        .click();
    });

    it('leave and lock the block', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="resumeTest-1"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
    });

    it('booklet-config: lock_test_on_termination: enter the block again is not possible', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="endTest-1"]')
        .click();
      cy.get('[data-cy="logout"]');
      cy.get('[data-cy="booklet-RUNHOTRES"]')
        .contains('gesperrt');
    });
  });

  describe('Login2: Resp/Pres complete, leave the block with unit-navigation forward', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName1, TesttakerPassword1, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    after(() => {
      logoutTestTaker('hot');
    });

    it('should start a hot-restart-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      getFromIframe('[data-cy="TestController-TextStartseite"]')
        .contains('Testung Controller');
    });

    it('enter the block with correct password', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-block-dialog-title"]')
        .contains('Aufgabenblock');
      cy.get('[data-cy="unlockUnit"]')
        .should('contain', '')
        .type('Hase');
      cy.get('[data-cy="unit-block-dialog-submit"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

    it('complete the test', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
    });

    it('leave the block, after which the block will be locked', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
      // cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
    });
  });

  describe('Login3: Resp/Pres complete, leave the block with unit-navigation backward', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName2, TesttakerPassword2, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    after(() => {
      logoutTestTaker('hot');
    });

    it('start a hot-restart-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      getFromIframe('[data-cy="TestController-TextStartseite"]')
        .contains('Testung Controller');
    });

    it('enter the block with correct password', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-block-dialog-title"]')
        .contains('Aufgabenblock');
      cy.get('[data-cy="unlockUnit"]')
        .should('contain', '')
        .type('Hase');
      cy.get('[data-cy="unit-block-dialog-submit"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

    it('complete the test', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
    });

    it('leave the block, after which the block will be locked', () => {
      backwardsTo('Aufgabe2');
      backwardsTo('Aufgabe1');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
    });
  });

  describe('Login4: Resp/Pres complete, leave the block & end the test with unit-menu', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName3, TesttakerPassword3, mode);
    });

    after(() => {
      logoutTestTaker('hot');
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    it('start a hot-return-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      getFromIframe('[data-cy="TestController-TextStartseite"]')
        .contains('Testung Controller');
    });

    it('enter the block with correct password', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-block-dialog-title"]')
        .contains('Aufgabenblock');
      cy.get('[data-cy="unlockUnit"]')
        .should('contain', '')
        .type('Hase');
      cy.get('[data-cy="unit-block-dialog-submit"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

    it('complete the test', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
    });

    it('leave the block, after which the block will be locked', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.contains('Endseite')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
    });

    it('end the test ', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="endTest"]')
        .click();
      cy.get('[data-cy="logout"]');
      cy.get('[data-cy="booklet-RUNHOTRET"]')
        .should('not.exist');
    });
  });

  describe('Login5: Resp/Pres complete, leave the block after time is up', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName4, TesttakerPassword4, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    after(() => {
      logoutTestTaker('hot');
    });

    it('start a hot-return-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.url()
        .should('include', '/u/1');
    });

    it('enter the block with correct password', () => {
      forwardTo('Aufgabe1');
      cy.get('[data-cy="unit-block-dialog-title"]')
        .contains('Aufgabenblock');
      cy.get('[data-cy="unlockUnit"]')
        .should('contain', '')
        .type('Hase');
      cy.intercept(`${Cypress.env('urls').backend}/test/7/unit/UNIT.SAMPLE-101/response`).as('response101-4-1');
      cy.get('[data-cy="unit-block-dialog-submit"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

    it('complete the test', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
        .click()
        .should('be.checked');
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
    });
  });

  describe('check responses and logs', { testIsolation: false }, () => {
    before(() => {
      visitLoginPage();
    });

    it('download a responses/log file with groupname: RunHotReturn', () => {
      loginSuperAdmin();
      openSampleWorkspace(1);
      cy.get('[data-cy="Ergebnisse/Antworten"]')
        .click();
      cy.contains('RunHotRestart');

      cy.get('[data-cy="results-checkbox1"]')
        .click();
      cy.get('[data-cy="download-responses"]')
        .click();
      cy.get('[data-cy="results-checkbox1"]')
        .click();
      cy.get('[data-cy="download-logs"]')
        .click();
      logoutAdmin();
    });

    it('check responses from first login', () => {
      getResultFileRows('responses')
        .then(responses => {
        // metadata
          expect(responses[1]).to.be.match(/\brunhotres\b/);
          expect(responses[1]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[1]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[2]).to.be.match(/\brunhotres\b/);
          expect(responses[2]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[2]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[3]).to.be.match(/\brunhotres\b/);
          expect(responses[3]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[3]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[4]).to.be.match(/\brunhotres\b/);
          expect(responses[4]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[4]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[5]).to.be.match(/\brunhotres\b/);
          expect(responses[5]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[5]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[5]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[2]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[3]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[4]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });

    it('check responses from second login', () => {
      getResultFileRows('responses')
        .then(responses => {
        // metadata
          expect(responses[6]).to.be.match(/\brunhotres\b/);
          expect(responses[6]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[6]).to.be.match(/\bva4dg-jc\b/);
          expect(responses[6]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[7]).to.be.match(/\brunhotres\b/);
          expect(responses[7]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[7]).to.be.match(/\bva4dg-jc\b/);
          expect(responses[7]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[8]).to.be.match(/\brunhotres\b/);
          expect(responses[8]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[8]).to.be.match(/\bva4dg-jc\b/);
          expect(responses[8]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[9]).to.be.match(/\brunhotres\b/);
          expect(responses[9]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[9]).to.be.match(/\bva4dg-jc\b/);
          expect(responses[9]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[10]).to.be.match(/\brunhotres\b/);
          expect(responses[10]).to.be.match(/\bTest_HotRestart_Ctrl1\b/);
          expect(responses[10]).to.be.match(/\bva4dg-jc\b/);
          expect(responses[10]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[7]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[8]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[9]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });

    it('check responses from third login', () => {
      getResultFileRows('responses')
        .then(responses => {
        // metadata
        // metadata
          expect(responses[11]).to.be.match(/\brunhotres\b/);
          expect(responses[11]).to.be.match(/\bTest_HotRestart_Ctrl2\b/);
          expect(responses[11]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[11]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[12]).to.be.match(/\brunhotres\b/);
          expect(responses[12]).to.be.match(/\bTest_HotRestart_Ctrl2\b/);
          expect(responses[12]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[12]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[13]).to.be.match(/\brunhotres\b/);
          expect(responses[13]).to.be.match(/\bTest_HotRestart_Ctrl2\b/);
          expect(responses[13]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[13]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[14]).to.be.match(/\brunhotres\b/);
          expect(responses[14]).to.be.match(/\bTest_HotRestart_Ctrl2\b/);
          expect(responses[14]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[14]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[15]).to.be.match(/\brunhotres\b/);
          expect(responses[15]).to.be.match(/\bTest_HotRestart_Ctrl2\b/);
          expect(responses[15]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[15]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[12]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[13]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[14]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });

    it('check responses from fourth login', () => {
      getResultFileRows('responses')
        .then(responses => {
        // metadata
        // metadata
          expect(responses[16]).to.be.match(/\brunhotres\b/);
          expect(responses[16]).to.be.match(/\bTest_HotRestart_Ctrl3\b/);
          expect(responses[16]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[16]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[17]).to.be.match(/\brunhotres\b/);
          expect(responses[17]).to.be.match(/\bTest_HotRestart_Ctrl3\b/);
          expect(responses[17]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[17]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[18]).to.be.match(/\brunhotres\b/);
          expect(responses[18]).to.be.match(/\bTest_HotRestart_Ctrl3\b/);
          expect(responses[18]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[18]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[19]).to.be.match(/\brunhotres\b/);
          expect(responses[19]).to.be.match(/\bTest_HotRestart_Ctrl3\b/);
          expect(responses[19]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[19]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[20]).to.be.match(/\brunhotres\b/);
          expect(responses[20]).to.be.match(/\bTest_HotRestart_Ctrl3\b/);
          expect(responses[20]).to.be.match(/\bh5ki-bd\b/);
          expect(responses[20]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[17]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[18]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[19]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });
  });
});
