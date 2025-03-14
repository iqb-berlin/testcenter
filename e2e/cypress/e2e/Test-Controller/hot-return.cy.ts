import {
  loginTestTaker,
  resetBackendData,
  visitLoginPage,
  deleteDownloadsFolder,
  getFromIframe,
  forwardTo,
  backwardsTo,
  loginSuperAdmin,
  getResultFileRows,
  disableSimplePlayersInternalDebounce, logoutTestTaker, gotoPage, openSampleWorkspace
} from '../utils';

// declared in Sampledata/CY_ControllerTest_Logins.xml-->Group:runhotret
const TesttakerName1 = 'Test_HotReturn_Ctrl1';
const TesttakerPassword1 = '123';
const TesttakerName2 = 'Test_HotReturn_Ctrl2';
const TesttakerPassword2 = '123';
const TesttakerName3 = 'Test_HotReturn_Ctrl3';
const TesttakerPassword3 = '123';
const TesttakerName4 = 'Test_HotReturn_Ctrl4';
const TesttakerPassword4 = '123';

const mode = 'test-hot';

describe('check hot-return test-controller functionalities', { testIsolation: false }, () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('hot-return-login 1', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName1, TesttakerPassword1, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    it('start a hot-return-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      getFromIframe('[data-cy="TestController-TextStartseite"]')
        .contains('Testung Controller');
    });

    it('enter the block with incorrect is not possible', () => {
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

    it('enter the block with correct code', () => {
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
        .should('have.class', 'marked');
      cy.get('[data-cy="unit-nav-item:UNIT.SAMPLE-102"]')
        .should('have.class', 'marked');
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

    it('navigate away without responses complete is not possible', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      cy.get('[data-cy="unit-navigation-forward"]')
        .should('have.class', 'marked');
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

    it('complete the last unit in restricted block', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
        .click();
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]').as('radio1-Aufg3');
      cy.get('@radio1-Aufg3')
        .click();
    });

    it('navigate backwards and verify that the last answer is there', () => {
      backwardsTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
        .should('be.checked');
      backwardsTo('Aufgabe1');
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .should('be.checked');
    });

    it('leave the time restricted block backward without a message is not possible', () => {
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
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
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('.mat-drawer-backdrop')
        .click();
    });

    it('enter the locked block is not possible', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="endTest-1"]')
        .click();
      cy.get('[data-cy="booklet-RUNHOTRET"]')
        .contains('Fortsetzen')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
    });

    after(() => logoutTestTaker('hot'));
  });

  describe('hot-return-login 2', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName2, TesttakerPassword2, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    it('should start a hot-return-test without booklet selection', () => {
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

    it('leave the block and lock it afterwards', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
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

    after(() => logoutTestTaker('hot'));
  });

  describe('hot-return-login 3', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName3, TesttakerPassword3, mode);
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

    it('leave the block and lock it afterwards', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="endTest"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="booklet-RUNHOTRET"]')
        .contains('Fortsetzen')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Endseite');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
    });

    after(() => logoutTestTaker('hot'));
  });

  describe('hot-return-login 4', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker(TesttakerName4, TesttakerPassword4, mode);
    });

    beforeEach(disableSimplePlayersInternalDebounce);

    it('start a hot-return-test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
      cy.url()
        .should('include', '/u/1');
    });

    it('enter the block with correct code', () => {
      forwardTo('Aufgabe1');
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
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-title"]')
        .contains('Aufgabenabschnitt verlassen?');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
    });

    after(() => logoutTestTaker('hot'));
  });

  describe('check responses', { testIsolation: false }, () => {
    before(() => {
      visitLoginPage();
    });

    it('download the response file with groupname: RunHotReturn', () => {
      loginSuperAdmin();
      openSampleWorkspace(1);
      cy.get('[data-cy="Ergebnisse/Antworten"]')
        .click();
      cy.contains('RunHotReturn');
      cy.get('[data-cy="results-checkbox1"]')
        .click();
      cy.get('[data-cy="download-responses"]')
        .click();
      cy.get('[data-cy="results-checkbox1"]')
        .click();
      cy.get('[data-cy="download-logs"]')
        .click();
    });

    it('check the responses from first login', () => {
      getResultFileRows('responses')
        .then(responses => {
          // metadata
          expect(responses[1]).to.be.match(/\brunhotret\b/);
          expect(responses[1]).to.be.match(/\bTest_HotReturn_Ctrl1\b/);
          expect(responses[1]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[2]).to.be.match(/\brunhotret\b/);
          expect(responses[2]).to.be.match(/\bTest_HotReturn_Ctrl1\b/);
          expect(responses[2]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[3]).to.be.match(/\brunhotret\b/);
          expect(responses[3]).to.be.match(/\bTest_HotReturn_Ctrl1\b/);
          expect(responses[3]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[4]).to.be.match(/\brunhotret\b/);
          expect(responses[4]).to.be.match(/\bTest_HotReturn_Ctrl1\b/);
          expect(responses[4]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[5]).to.be.match(/\brunhotret\b/);
          expect(responses[5]).to.be.match(/\bTest_HotReturn_Ctrl1\b/);
          expect(responses[5]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[2]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[3]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[4]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });

    it('check the responses from second login', () => {
      getResultFileRows('responses')
        .then(responses => {
          // metadata
          expect(responses[6]).to.be.match(/\brunhotret\b/);
          expect(responses[6]).to.be.match(/\bTest_HotReturn_Ctrl2\b/);
          expect(responses[6]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[7]).to.be.match(/\brunhotret\b/);
          expect(responses[7]).to.be.match(/\bTest_HotReturn_Ctrl2\b/);
          expect(responses[7]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[8]).to.be.match(/\brunhotret\b/);
          expect(responses[8]).to.be.match(/\bTest_HotReturn_Ctrl2\b/);
          expect(responses[8]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[9]).to.be.match(/\brunhotret\b/);
          expect(responses[9]).to.be.match(/\bTest_HotReturn_Ctrl2\b/);
          expect(responses[9]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[10]).to.be.match(/\brunhotret\b/);
          expect(responses[10]).to.be.match(/\bTest_HotReturn_Ctrl2\b/);
          expect(responses[10]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[7]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[8]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[9]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });

    it('check the responses from third login', () => {
      getResultFileRows('responses')
        .then(responses => {
          // metadata
          expect(responses[11]).to.be.match(/\brunhotret\b/);
          expect(responses[11]).to.be.match(/\bTest_HotReturn_Ctrl3\b/);
          expect(responses[11]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[12]).to.be.match(/\brunhotret\b/);
          expect(responses[12]).to.be.match(/\bTest_HotReturn_Ctrl3\b/);
          expect(responses[12]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[13]).to.be.match(/\brunhotret\b/);
          expect(responses[13]).to.be.match(/\bTest_HotReturn_Ctrl3\b/);
          expect(responses[13]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[14]).to.be.match(/\brunhotret\b/);
          expect(responses[14]).to.be.match(/\bTest_HotReturn_Ctrl3\b/);
          expect(responses[14]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[15]).to.be.match(/\brunhotret\b/);
          expect(responses[15]).to.be.match(/\bTest_HotReturn_Ctrl3\b/);
          expect(responses[15]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[12]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[13]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[14]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });

    it('check the responses from fourth login', () => {
      getResultFileRows('responses')
        .then(responses => {
          // metadata
          expect(responses[16]).to.be.match(/\brunhotret\b/);
          expect(responses[16]).to.be.match(/\bTest_HotReturn_Ctrl4\b/);
          expect(responses[16]).to.be.match(/\bUNIT.SAMPLE-100\b/);
          expect(responses[17]).to.be.match(/\brunhotret\b/);
          expect(responses[17]).to.be.match(/\bTest_HotReturn_Ctrl4\b/);
          expect(responses[17]).to.be.match(/\bUNIT.SAMPLE-101\b/);
          expect(responses[18]).to.be.match(/\brunhotret\b/);
          expect(responses[18]).to.be.match(/\bTest_HotReturn_Ctrl4\b/);
          expect(responses[18]).to.be.match(/\bUNIT.SAMPLE-102\b/);
          expect(responses[19]).to.be.match(/\brunhotret\b/);
          expect(responses[19]).to.be.match(/\bTest_HotReturn_Ctrl4\b/);
          expect(responses[19]).to.be.match(/\bUNIT.SAMPLE-103\b/);
          expect(responses[20]).to.be.match(/\brunhotret\b/);
          expect(responses[20]).to.be.match(/\bTest_HotReturn_Ctrl4\b/);
          expect(responses[20]).to.be.match(/\bUNIT.SAMPLE-104\b/);
          // responses unit1-3
          expect(responses[17]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[18]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[19]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });
  });
});
