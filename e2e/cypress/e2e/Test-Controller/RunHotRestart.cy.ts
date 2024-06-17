import {
  loginTestTaker, resetBackendData, logoutTestTaker,
  useTestDB, credentialsControllerTest, visitLoginPage, deleteDownloadsFolder, getFromIframe, forwardTo,
  backwardsTo, readBlockTime, loginSuperAdmin, openSampleWorkspace1, logoutAdmin, convertResultsLoginRows
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
    useTestDB();
    visitLoginPage();
    loginTestTaker(TesttakerName1, TesttakerPassword1, mode);
  });

  after(() => {
    logoutTestTaker('hot');
  });

  beforeEach(useTestDB);

  it('should be possible to start a hot-restart-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller')
      .should('exist');
  });

  it('should be not possible to enter the block if a incorrect password is entered', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hund');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.contains(/Freigabewort.+stimmt nicht/)
      .should('exist');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-101/response`).as('response101-1-1');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait('@response101-1-1');
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
    cy.contains(/Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min/) // TODO use data-cy
      .should('exist');
  });

  it('should be not possible to navigate to next unit without responses/presentation complete', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabe darf nicht verlassen werden');
    cy.get('[data-cy="dialog-content"]')
      .should('exist')
      .contains(/abgespielt.+gescrollt.+bearbeitet/);
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
  });

  it('should be not possible to navigate to the next unit without responses complete', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabe darf nicht verlassen werden');
    cy.get('[data-cy="dialog-content"]')
      .should('exist')
      .contains('Es müssen erst alle Teilaufgaben bearbeitet werden.')
      .should('exist');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('should be possible to navigate with presentation and response complete to the next unit', () => {
    cy.get('[data-cy="page-navigation-0"]')
      .should('exist')
      .click();
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-101/response`).as('response101-1-2');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.wait('@response101-1-2');
    forwardTo('Aufgabe2');
  });

  it('should be possible to complete the test and leave the block with a warning message', () => {
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-102/response`).as('response102-1-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click()
      .should('be.checked');
    cy.wait('@response102-1-1');
    forwardTo('Aufgabe3');
    cy.intercept(`${Cypress.env('urls').backend}/test/3/unit/UNIT.SAMPLE-103/response`).as('response103-1-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
    cy.wait('@response103-1-1');
  });

  it('should be not possible to leave the time restricted block forward without a message', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist');
    cy.get('[data-cy="dialog-cancel"]')
      .should('exist')
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

  it('should be not possible to leave the time restricted block backward without a message', () => {
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist');
    cy.get('[data-cy="dialog-cancel"]')
      .should('exist')
      .click();
  });

  it('should be not possible to leave the time restricted block in unit-menu without a message', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1')
      .should('exist');
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.wait(1000);
    cy.get('[data-cy="unit-menu"]')
      .should('exist')
      .click();
    cy.get('[data-cy="endTest"]')
      .should('exist')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist');
    cy.get('[data-cy="dialog-cancel"]')
      .should('exist')
      .click();
  });

  it('should be not that the time stops while the exit block message is displayed', () => {
    cy.get('[data-cy="page-navigation-0"]')
      .click();
    // todo philipp: warum wird sich hier nicht presentation complete gemerkt?
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.wait(1000);
    // note the time before the exit block message is displayed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeShowDialog = leaveBlockTime;
      });
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
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

  it('should be possible to leave the block, after which the block will be locked', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="resumeTest-1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Endseite');
    cy.wait(2000);
  });

  it('should be not possible to enter the booklet again after ending the test (lock_test_on_term.) ', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="logout"]')
      .should('exist');
    cy.get('[data-cy="booklet-RUNHOTRET"]')
      .should('not.exist');
  });
});

describe('Login2: Resp/Pres complete, leave the block with unit-navigation forward', { testIsolation: false }, () => {
  before(() => {
    useTestDB();
    cy.reload();
    visitLoginPage();
    loginTestTaker(TesttakerName1, TesttakerPassword1, mode);
  });

  after(() => {
    logoutTestTaker('hot');
  });

  beforeEach(useTestDB);

  it('should be possible to start a hot-restart-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller')
      .should('exist');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-101/response`).as('response101-2-1');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait('@response101-2-1');
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
  });

  it('should be possible to complete the test', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.get('[data-cy="page-navigation-0"]')
      .should('exist')
      .click();
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-101/response`).as('response101-2-2');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.wait('@response101-2-2');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-102/response`).as('response102-2-1');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click()
      .should('be.checked');
    cy.wait('@response102-2-1');
    forwardTo('Aufgabe3');
    cy.intercept(`${Cypress.env('urls').backend}/test/4/unit/UNIT.SAMPLE-103/response`).as('response103-2-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
    cy.wait('@response103-2-1');
  });

  it('should be possible to leave the block, after which the block will be locked', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Endseite');
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
  });
});

describe('Login3: Resp/Pres complete, leave the block with unit-navigation backward', { testIsolation: false }, () => {
  before(() => {
    useTestDB();
    cy.reload();
    visitLoginPage();
    loginTestTaker(TesttakerName2, TesttakerPassword2, mode);
  });

  after(() => {
    logoutTestTaker('hot');
  });

  beforeEach(useTestDB);

  it('should be possible to start a hot-restart-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller')
      .should('exist');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.intercept(`${Cypress.env('urls').backend}/test/5/unit/UNIT.SAMPLE-101/response`).as('response101-2-1');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait('@response101-2-1');
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
  });

  it('should be possible to complete the test', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.get('[data-cy="page-navigation-0"]')
      .should('exist')
      .click();
    cy.intercept(`${Cypress.env('urls').backend}/test/5/unit/UNIT.SAMPLE-101/response`).as('response101-2-2');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.wait('@response101-2-2');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/5/unit/UNIT.SAMPLE-102/response`).as('response102-2-1');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click()
      .should('be.checked');
    cy.wait('@response102-2-1');
    forwardTo('Aufgabe3');
    cy.intercept(`${Cypress.env('urls').backend}/test/5/unit/UNIT.SAMPLE-103/response`).as('response103-2-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
    cy.wait('@response103-2-1');
  });

  it('should be possible to leave the block, after which the block will be locked', () => {
    backwardsTo('Aufgabe2');
    backwardsTo('Aufgabe1');
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Endseite');
    cy.wait(2000);
  });
});

describe('Login4: Resp/Pres complete, leave the block & end the test with unit-menu', { testIsolation: false }, () => {
  before(() => {
    useTestDB();
    cy.reload();
    visitLoginPage();
    loginTestTaker(TesttakerName3, TesttakerPassword3, mode);
  });

  after(() => {
    logoutTestTaker('hot');
  });

  beforeEach(useTestDB);

  it('should be possible to start a hot-return-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    getFromIframe('[data-cy="TestController-TextStartseite"]')
      .contains('Testung Controller')
      .should('exist');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.intercept(`${Cypress.env('urls').backend}/test/6/unit/UNIT.SAMPLE-101/response`).as('response101-3-1');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait('@response101-3-1');
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
  });

  it('should be possible to complete the test', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.get('[data-cy="page-navigation-0"]')
      .should('exist')
      .click();
    cy.intercept(`${Cypress.env('urls').backend}/test/6/unit/UNIT.SAMPLE-101/response`).as('response101-3-2');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.wait('@response101-3-2');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/6/unit/UNIT.SAMPLE-102/response`).as('response102-3-1');
    getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
      .click()
      .should('be.checked');
    cy.wait('@response102-3-1');
    forwardTo('Aufgabe3');
    cy.intercept(`${Cypress.env('urls').backend}/test/6/unit/UNIT.SAMPLE-103/response`).as('response103-3-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
    cy.wait('@response103-3-1');
  });

  it('should be possible to leave the block, after which the block will be locked', () => {
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.contains('Endseite')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Aufgabenabschnitt verlassen?');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Endseite');
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('should be possible to end the test ', () => {
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="endTest"]')
      .click();
    cy.get('[data-cy="logout"]')
      .should('exist');
    cy.get('[data-cy="booklet-RUNHOTRET"]')
      .should('not.exist');
  });
});

describe('Login5: Resp/Pres complete, leave the block after time is up', { testIsolation: false }, () => {
  before(() => {
    useTestDB();
    cy.reload();
    visitLoginPage();
    loginTestTaker(TesttakerName4, TesttakerPassword4, mode);
  });
  after(() => {
    logoutTestTaker('hot');
  });
  beforeEach(useTestDB);

  it('should be possible to start a hot-return-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('should be possible to enter the block if a correct password is entered', () => {
    forwardTo('Aufgabe1');
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('contain', '')
      .type('Hase');
    cy.intercept(`${Cypress.env('urls').backend}/test/7/unit/UNIT.SAMPLE-101/response`).as('response101-4-1');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait('@response101-4-1')
      .then(() => {
        startTime = new Date().getTime();
      });
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
  });

  it('should be possible to complete the test', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    cy.get('[data-cy="page-navigation-0"]')
      .should('exist')
      .click();
    cy.intercept(`${Cypress.env('urls').backend}/test/7/unit/UNIT.SAMPLE-101/response`).as('response101-4-2');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.wait('@response101-4-2');
    forwardTo('Aufgabe2');
    cy.intercept(`${Cypress.env('urls').backend}/test/7/unit/UNIT.SAMPLE-102/response`).as('response102-4-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click()
      .should('be.checked');
    cy.wait('@response102-4-1');
    forwardTo('Aufgabe3');
    cy.intercept(`${Cypress.env('urls').backend}/test/7/unit/UNIT.SAMPLE-103/response`).as('response103-4-1');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
    cy.wait('@response103-4-1');
  });

  it('should be not possible to enter the block after time is up', () => {
    // Wait for remaining time of restricted area
    endTime = new Date().getTime();
    elapsed = endTime - startTime;
    cy.wait(credentialsControllerTest.DemoRestrTime - elapsed);
    cy.contains(/Die Bearbeitung des Abschnittes ist beendet./) // TODO use data-cy
      .should('exist');
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Endseite');
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });
});

describe('Check responses and logs', { testIsolation: false }, () => {
  before(() => {
    useTestDB();
    cy.reload();
    visitLoginPage();
  });

  beforeEach(useTestDB);

  it('should be possible to download a responses/log file in the workspace with groupname: RunHotReturn', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.contains('RunHotRestart')
      .should('exist');
    cy.get('[data-cy="results-checkbox1"]')
      .should('exist')
      .click();
    cy.get('[data-cy="download-responses"]')
      .should('exist')
      .click();
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .should('exist')
      .click();
    logoutAdmin();
  });

  it('should be saved recent replies and metadata from first login: hres1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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

  it('should be saved recent replies and metadata from second login: hres1 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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

  it('should be saved recent replies and metadata from login: hres2 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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

  it('should be saved recent replies and metadata from login: hres3 in downloaded response file', () => {
    convertResultsLoginRows('responses')
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
