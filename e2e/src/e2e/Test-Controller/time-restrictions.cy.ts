import {
  cleanUp,
  disableSimplePlayersInternalDebounce,
  getFromIframe, insertCredentials,
  loginTestTaker,
  logoutTestTakerDemo,
  logoutTestTakerHot,
  probeBackendApi,
  readBlockTime,
  resetBackendData,
  visitLoginPage
} from '../utils';

// Restriction Time: Declared in Sampledata/CY_Bklt_TC-1.xml
const RestrTimeVal = 12000;
const RestrTimeValOffset = 1000;

let blockTimeBeforeShowDialog: number = 0;
let blockTimeAfterCancelDialog: number = 0;
const timeToDisplayedDialog: number = 3000;

describe('Block Time-Restrictions demo and review-mode', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
  });

 it('demo: time is expired, the block will not be locked, there is only a warning message.', () => {
    insertCredentials('Test_Ctrl-13', '123');
    cy.get('[data-cy="login-user"]')
      .click();
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
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 0 min');
    cy.wait(RestrTimeVal + RestrTimeValOffset);
    cy.get('.snackbar-time-ended')
      .contains('Die Bearbeitung des Abschnittes ist beendet.');
    cy.get('[data-cy="info-blocktime-is-up"]')
      .should('not.exist');
  });

  it('review: time is expired, but the block will not be locked, there is only a warning message.', () => {
    insertCredentials('Test_Ctrl-14', '123');
    cy.get('[data-cy="login-user"]')
      .click();
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
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 0 min');
    cy.wait(RestrTimeVal + RestrTimeValOffset);
    cy.get('.snackbar-time-ended')
      .contains('Die Bearbeitung des Abschnittes ist beendet.');
    cy.get('[data-cy="info-blocktime-is-up"]')
      .should('not.exist');
  });
});

describe('Block Time-Restrictions hot-modes', { testIsolation: true }, () => {
  before(() => {
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    resetBackendData();
  });

  it('hot-restart:timer is not stopped while the exit block message is displayed', () => {
    loginTestTaker('Test_Ctrl-12', '123');
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
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    cy.wait(1000);
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-103"]')
      .click();
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
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
  });

  it('hot-restart: time is expired, block will be locked, warning message is displayed.', () => {
    loginTestTaker('Test_Ctrl-12', '123');
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
  });

  it('hot-return: timer is not stopped while the exit block message is displayed', () => {
    loginTestTaker('Test_Ctrl-10', '123');
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
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.get('[data-cy="page-navigation-1"]')
      .click();
    cy.wait(1000);
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-103"]')
      .click();
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
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
  });

  it('hot-return: time is expired, block will be locked, warning message is displayed.', () => {
    loginTestTaker('Test_Ctrl-11', '123');
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
  });
});

describe('check attribute: leave', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('check leave: confirm', () => {
    loginTestTaker('Test_Ctrl-15', '123');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-104"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
  });

  it('check leave: allowed', () => {
    loginTestTaker('Test_Ctrl-16', '123');
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-104"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
  });

  it('check leave: forbidden', () => {
    loginTestTaker('Test_Ctrl-17', '123');
    cy.get('[data-cy="unit-nav-item:CY-Unit.Sample-104"]')
      .click();
    cy.get('.snackbar-demo-mode');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('.snackbar-demo-mode')
      .contains('Schließen')
      .click();
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('.snackbar-demo-mode');
  });
});
