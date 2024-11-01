import {
  loginTestTaker,
  resetBackendData,
  credentialsControllerTest,
  visitLoginPage,
  deleteDownloadsFolder,
  getFromIframe,
  forwardTo,
  backwardsTo,
  readBlockTime,
  loginSuperAdmin,
  openSampleWorkspace1,
  convertResultsLoginRows,
  disableSimplePlayersInternalDebounce, logoutTestTaker, gotoPage
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
let blockTimeShowDialog: number = 0;
let blockTimeCancelDialog: number = 0;

let startTime: number;
let endTime: number;
let elapsed: number;

describe('Login1: Resp/Pres complete, leave the block and end the test with IQB-logo', { testIsolation: false }, () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
    loginTestTaker(TesttakerName1, TesttakerPassword1, mode);
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should be possible to start a hot-return-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller');
  });

  it('should not be possible to enter the block if a incorrect code is entered', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hund');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.contains(/Freigabewort.+stimmt nicht/);
  });

  it('should be possible to enter the block if the correct code is entered', () => {
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.contains(/Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min/); // TODO use data-cy;
  });

  it('should not be possible to navigate to next unit without responses/presentation complete', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('have.class', 'marked');
    cy.get('[data-cy="unit-nav-item:UNIT.SAMPLE-102"]')
      .should('have.class', 'marked');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabe darf nicht verlassen werden');
    cy.get('[data-cy="dialog-content"]')
      .contains(/abgespielt.+gescrollt.+bearbeitet/);
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('should not be possible to navigate away without responses complete', () => {
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

  it('should be possible to navigate with presentation and response complete to the next unit', () => {
    gotoPage(0);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    forwardTo('Aufgabe2');
  });

  it('should be possible to complete the test and leave the block with a warning message', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click();
    forwardTo('Aufgabe3');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]').as('radio1-Aufg3');
    cy.get('@radio1-Aufg3')
      .click();
  });

  it('should not be possible to leave the time restricted block forward without a message', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]');
    cy.get('[data-cy="dialog-cancel"]')
      .click();
  });

  it('should be possible to navigate backwards and verify that the last answer is there', () => {
    backwardsTo('Aufgabe2');
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .should('be.checked');
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });

  it('should not be possible to leave the time restricted block backward without a message', () => {
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]');
    cy.get('[data-cy="dialog-cancel"]')
      .click();
  });

  it('should not be possible to leave the time restricted block in unit-menu without a message', () => {
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
    cy.get('[data-cy="dialog-confirm"]');
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('.mat-drawer-backdrop')
      .click();
  });

  it('should not stop the time while the exit-confirmation-message is displayed', () => {
    gotoPage(0);
    // note the time before the exit block message is displayed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeShowDialog = leaveBlockTime;
      });
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
    // the dialog should remain open for a few seconds
    cy.wait(3000);
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    // note the time after the exit block message is closed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeCancelDialog = leaveBlockTime;
        // the second time must be smaller than first time minus an inaccuracy of 2
        expect(blockTimeCancelDialog).to.be.lessThan(blockTimeShowDialog -= 2);
      });
  });

  it('should not be possible to enter the timed block again after leaving the test entirely', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
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
});

describe('Login2: Response/Presentation complete, leave the block and end the test with unit-navigation', { testIsolation: false }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    logoutTestTaker('hot');
    visitLoginPage();
    loginTestTaker(TesttakerName2, TesttakerPassword2, mode);
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should be possible to start a hot-return-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
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

  it('should be possible to complete the test', () => {
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

  it('should be possible to leave the block and lock it afterwards', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });
});

describe('Login3: Resp/Pres complete, leave the block and end the test with unit-menu', { testIsolation: false }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    logoutTestTaker('hot');
    visitLoginPage();
    loginTestTaker(TesttakerName3, TesttakerPassword3, mode);
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should be possible to start a hot-return-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
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

  it('should be possible to complete the test', () => {
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

  it('should be possible to leave the block and lock it afterwards', () => {
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="endTest"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
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
});

describe('Login4: Resp/Pres complete, leave the block after time is up', { testIsolation: false }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    logoutTestTaker('hot');
    visitLoginPage();
    loginTestTaker(TesttakerName4, TesttakerPassword4, mode);
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should be possible to start a hot-return-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('should be possible to enter the block if a correct code is entered', () => {
    forwardTo('Aufgabe1');
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    startTime = new Date().getTime();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('should be possible to complete the test', () => {
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

  it('should not be possible to enter the block after time is up', () => {
    // Wait for remaining time of restricted area
    endTime = new Date().getTime();
    elapsed = endTime - startTime;

    cy.wait(credentialsControllerTest.DemoRestrTime - elapsed);

    cy.contains(/Die Bearbeitung des Abschnittes ist beendet./); // TODO use data-cy
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });
});

describe('Check responses and logs', { testIsolation: false }, () => {
  before(() => {
    logoutTestTaker('hot');
    visitLoginPage();
  });

  it('should be possible to download a responses/log file in the workspace with groupname: RunHotReturn', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
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

  it('should be saved recent replies and metadata from login: hret1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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

  it('should be saved recent replies and metadata from login: hret2 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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

  it('should be saved recent replies and metadata from login: hret3 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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

  it('should be saved recent replies and metadata from login: hret4 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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
