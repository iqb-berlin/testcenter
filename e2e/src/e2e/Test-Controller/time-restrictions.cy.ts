import {
  loginTestTaker,
  resetBackendData,
  visitLoginPage,
  getFromIframe,
  readBlockTime,
  disableSimplePlayersInternalDebounce,
  logoutTestTaker
} from '../utils';

// Restriction Time: Declared in Sampledata/CY_BKL_Mode_Demo.xml
const RestrTimeVal = 60000;
const RestrTimeValOffset = 1000;

let blockTimeBeforeShowDialog: number = 0;
let blockTimeAfterCancelDialog: number = 0;
const timeToDisplayedDialog: number = 3000;

describe('Block Time-Restrictions demo and review-mode', { testIsolation: false }, () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  beforeEach(visitLoginPage);
  beforeEach(disableSimplePlayersInternalDebounce);

  it('demo: time is expired, the block will not be locked, there is only a warning message.', () => {
    loginTestTaker('Test_Demo_Ctrl', '123', 'test');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('.snackbar-time-started')
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
    cy.wait(RestrTimeVal + RestrTimeValOffset);
    cy.get('.snackbar-time-ended')
      .contains('Die Bearbeitung des Abschnittes ist beendet.');
    cy.get('[data-cy="info-blocktime-is-up"]')
      .should('not.exist');
    logoutTestTaker('demo');
  });

  it('review: time is expired, but the block will not be locked, there is only a warning message.', () => {
    loginTestTaker('Test_Review_Ctrl', '123', 'test');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('.snackbar-time-started')
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
    cy.wait(RestrTimeVal + RestrTimeValOffset);
    cy.get('.snackbar-time-ended')
      .contains('Die Bearbeitung des Abschnittes ist beendet.');
    cy.get('[data-cy="info-blocktime-is-up"]')
      .should('not.exist');
    logoutTestTaker('demo');
  });
});

describe('Block Time-Restrictions hot-modes', { testIsolation: false }, () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  beforeEach(visitLoginPage);
  beforeEach(disableSimplePlayersInternalDebounce);
  beforeEach(resetBackendData);

  it('hot-restart:timer is not stopped while the exit block message is displayed', () => {
    loginTestTaker('Test_HotRestart_Ctrl1', '123', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    // wait for presentation complete, before navigate forward
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]')
      .type('Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    cy.wait(1000);
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-103"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click();
    // note the time before the exit block message is displayed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeBeforeShowDialog = leaveBlockTime;
      });
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // the dialog should remain open for a few seconds
    cy.wait(timeToDisplayedDialog);
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    // Wait a certain time because the timing is too imprecise
    cy.wait(1000);
    // note the time after the exit block message is closed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeAfterCancelDialog = leaveBlockTime;
        // the second time must be smaller than first time minus timeToDisplayedDialog
        cy.wrap(blockTimeAfterCancelDialog)
          .should('be.lessThan', (blockTimeBeforeShowDialog - (timeToDisplayedDialog / 1000)));
        // expect(blockTimeAfterCancelDialog).to.be.lessThan(blockTimeBeforeShowDialog - (timeToDisplayedDialog / 1000));
      });
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    // wait for presentation complete, before end the test
    cy.wait(1000);
    logoutTestTaker('hot');
  });

  it('hot-restart: time is expired, block will be locked, warning message is displayed.', () => {
    loginTestTaker('Test_HotReturn_Ctrl1', '123', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    // wait for presentation complete, before navigate forward
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]')
      .type('Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait(RestrTimeVal + RestrTimeValOffset);
    cy.get('.snackbar-time-ended')
      .contains('Die Bearbeitung des Abschnittes ist beendet.');
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    logoutTestTaker('hot');
  });

  it('hot-return: timer is not stopped while the exit block message is displayed', () => {
    loginTestTaker('Test_HotReturn_Ctrl1', '123', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    // wait for presentation complete, before navigate forward
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]')
      .type('Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    cy.wait(1000);
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-103"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click();
    // note the time before the exit block message is displayed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeBeforeShowDialog = leaveBlockTime;
      });
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // the dialog should remain open for a few seconds
    cy.wait(timeToDisplayedDialog);
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    // Wait a certain time because the timing is too imprecise
    cy.wait(1000);
    // note the time after the exit block message is closed
    readBlockTime()
      .then(leaveBlockTime => {
        blockTimeAfterCancelDialog = leaveBlockTime;
        // the second time must be smaller than first time minus timeToDisplayedDialog
        cy.wrap(blockTimeAfterCancelDialog)
          .should('be.lessThan', (blockTimeBeforeShowDialog - (timeToDisplayedDialog / 1000)));
      });
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    // wait for presentation complete, before end the test
    cy.wait(1000);
    logoutTestTaker('hot');
  });

  it('hot-return: time is expired, block will be locked, warning message is displayed.', () => {
    loginTestTaker('Test_HotRestart_Ctrl1', '123', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    // wait for presentation complete, before navigate forward
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]')
      .type('Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.wait(RestrTimeVal + RestrTimeValOffset);
    cy.get('.snackbar-time-ended')
      .contains('Die Bearbeitung des Abschnittes ist beendet.');
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    logoutTestTaker('hot');
  });
});
