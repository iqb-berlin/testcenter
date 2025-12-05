import {
  backwardsTo, cleanUp,
  deleteDownloadsFolder,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  getFromIframe,
  getResultFileRows,
  gotoPage,
  loginSuperAdmin,
  loginTestTaker,
  logoutTestTakerHot,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check hot-return test-controller functionalities', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    deleteDownloadsFolder();
    resetBackendData();
    probeBackendApi();
  });

  describe('Login1: complete the test, leave the block via iqb-logo', { testIsolation: false }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-3', '123');
    });

  it('start a test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
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

  it('Complete all question-elements in Aufgabe 1', () => {
    gotoPage(1);
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    gotoPage(0);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('Complete all question-elements in Aufgabe 2', () => {
    forwardTo('Aufgabe2');
    getFromIframe('[data-cy="TestController-radio1-Aufg2"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('Complete all question-elements in Aufgabe 3', () => {
    forwardTo('Aufgabe3');
    getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('leave the time restricted block forward without a message is not possible', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabenabschnitt verlassen?');
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
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('leave the time restricted block in unit-menu without a message is not possible', () => {
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

  it('leave the block via iqb-logo, check the locked block', () => {
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

  it('booklet-config: lock_test_on_termination: booklet is locked; end the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_TC-3"]')
      .contains('gesperrt');
    cy.get('[data-cy="logout"]')
      .click();
    cy.get('[data-cy="login-admin"]')
      .should('be.visible');
    });
  });

  describe('Login2: run and complete the test, leave the block with unit-navigation forward', { testIsolation: false }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-4', '123');
    });

    it('start a test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
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

    it('Complete all question-elements in Aufgabe 1', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('Complete all question-elements in Aufgabe 2', () => {
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('Complete all question-elements in Aufgabe 3', () => {
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('leave the block with nav-forward, check the locked block', () => {
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

    it('end the test via unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="endTest"]')
        .click();
      cy.get('[data-cy="logout"]')
        .click();
      cy.get('[data-cy="login-admin"]')
        .should('be.visible');
    });
  });

  describe('Login3: run and complete the test, leave the block with unit-navigation backward', { testIsolation: false }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-5', '123');
    });

    after(() => {
     logoutTestTakerHot();
    });

    it('start a test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
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

    it('Complete all question-elements in Aufgabe 1', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('Complete all question-elements in Aufgabe 2', () => {
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('Complete all question-elements in Aufgabe 3', () => {
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('leave the block with nav-backward, check the locked block', () => {
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

  describe('Login4: complete the test, leave the block via unit-menu', { testIsolation: false }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-6', '123');
    });

    after(() => {
      logoutTestTakerHot();
    });

    it('start a test without booklet selection', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Startseite');
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

    it('Complete all question-elements in Aufgabe 1', () => {
      gotoPage(1);
      getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
        .contains('Presentation complete');
      gotoPage(0);
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('Complete all question-elements in Aufgabe 2', () => {
      forwardTo('Aufgabe2');
      getFromIframe('[data-cy="TestController-radio2-Aufg2"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('Complete all question-elements in Aufgabe 3', () => {
      forwardTo('Aufgabe3');
      getFromIframe('[data-cy="TestController-radio1-Aufg3"]')
        .click()
        .should('be.checked');
      // some time to ensure that the answer is saved
      cy.wait(1000);
    });

    it('leave the block with unit-menu, check the locked block', () => {
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
  });

  describe('check responses', { testIsolation: true }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
    });

    it('check responses and logs', () => {
      loginSuperAdmin();
      openSampleWorkspace(1);
      cy.get('[data-cy="Ergebnisse/Antworten"]')
        .click();
      cy.contains('Hot-Return');
      cy.get('[data-cy="results-checkbox1"]')
        .click();
      cy.intercept('GET', `${Cypress.env('urls').backend}/workspace/1/report/response?*`).as('waitForDownloadResponse');
      cy.get('[data-cy="download-responses"]')
        .click();
      cy.wait('@waitForDownloadResponse');
      cy.get('[data-cy="results-checkbox1"]')
        .click();
      cy.intercept('GET', `${Cypress.env('urls').backend}/workspace/1/report/log?*`).as('waitForDownloadLogs');
      cy.get('[data-cy="download-logs"]')
        .click();
      cy.wait('@waitForDownloadLogs');
    });

    it('check the responses from first login', () => {
      getResultFileRows('responses')
        .then(responses => {
          // metadata
          expect(responses[1]).to.be.match(/\bhot-return\b/);
          expect(responses[1]).to.be.match(/\bTest_Ctrl-3\b/);
          expect(responses[1]).to.be.match(/\bCY-Unit.Sample-100\b/);
          expect(responses[2]).to.be.match(/\bhot-return\b/);
          expect(responses[2]).to.be.match(/\bTest_Ctrl-3\b/);
          expect(responses[2]).to.be.match(/\bCY-Unit.Sample-101\b/);
          expect(responses[3]).to.be.match(/\bhot-return\b/);
          expect(responses[3]).to.be.match(/\bTest_Ctrl-3\b/);
          expect(responses[3]).to.be.match(/\bCY-Unit.Sample-102\b/);
          expect(responses[4]).to.be.match(/\bhot-return\b/);
          expect(responses[4]).to.be.match(/\bTest_Ctrl-3\b/);
          expect(responses[4]).to.be.match(/\bCY-Unit.Sample-103\b/);
          expect(responses[5]).to.be.match(/\bhot-return\b/);
          expect(responses[5]).to.be.match(/\bTest_Ctrl-3\b/);
          expect(responses[5]).to.be.match(/\bCY-Unit.Sample-104\b/);
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
          expect(responses[6]).to.be.match(/\bhot-return\b/);
          expect(responses[6]).to.be.match(/\bTest_Ctrl-4\b/);
          expect(responses[6]).to.be.match(/\bCY-Unit.Sample-100\b/);
          expect(responses[7]).to.be.match(/\bhot-return\b/);
          expect(responses[7]).to.be.match(/\bTest_Ctrl-4\b/);
          expect(responses[7]).to.be.match(/\bCY-Unit.Sample-101\b/);
          expect(responses[8]).to.be.match(/\bhot-return\b/);
          expect(responses[8]).to.be.match(/\bTest_Ctrl-4\b/);
          expect(responses[8]).to.be.match(/\bCY-Unit.Sample-102\b/);
          expect(responses[9]).to.be.match(/\bhot-return\b/);
          expect(responses[9]).to.be.match(/\bTest_Ctrl-4\b/);
          expect(responses[9]).to.be.match(/\bCY-Unit.Sample-103\b/);
          expect(responses[10]).to.be.match(/\bhot-return\b/);
          expect(responses[10]).to.be.match(/\bTest_Ctrl-4\b/);
          expect(responses[10]).to.be.match(/\bCY-Unit.Sample-104\b/);
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
          expect(responses[11]).to.be.match(/\bhot-return\b/);
          expect(responses[11]).to.be.match(/\bTest_Ctrl-5\b/);
          expect(responses[11]).to.be.match(/\bCY-Unit.Sample-100\b/);
          expect(responses[12]).to.be.match(/\bhot-return\b/);
          expect(responses[12]).to.be.match(/\bTest_Ctrl-5\b/);
          expect(responses[12]).to.be.match(/\bCY-Unit.Sample-101\b/);
          expect(responses[13]).to.be.match(/\bhot-return\b/);
          expect(responses[13]).to.be.match(/\bTest_Ctrl-5\b/);
          expect(responses[13]).to.be.match(/\bCY-Unit.Sample-102\b/);
          expect(responses[14]).to.be.match(/\bhot-return\b/);
          expect(responses[14]).to.be.match(/\bTest_Ctrl-5\b/);
          expect(responses[14]).to.be.match(/\bCY-Unit.Sample-103\b/);
          expect(responses[15]).to.be.match(/\bhot-return\b/);
          expect(responses[15]).to.be.match(/\bTest_Ctrl-5\b/);
          expect(responses[15]).to.be.match(/\bCY-Unit.Sample-104\b/);
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
          expect(responses[16]).to.be.match(/\bhot-return\b/);
          expect(responses[16]).to.be.match(/\bTest_Ctrl-6\b/);
          expect(responses[16]).to.be.match(/\bCY-Unit.Sample-100\b/);
          expect(responses[17]).to.be.match(/\bhot-return\b/);
          expect(responses[17]).to.be.match(/\bTest_Ctrl-6\b/);
          expect(responses[17]).to.be.match(/\bCY-Unit.Sample-101\b/);
          expect(responses[18]).to.be.match(/\bhot-return\b/);
          expect(responses[18]).to.be.match(/\bTest_Ctrl-6\b/);
          expect(responses[18]).to.be.match(/\bCY-Unit.Sample-102\b/);
          expect(responses[19]).to.be.match(/\bhot-return\b/);
          expect(responses[19]).to.be.match(/\bTest_Ctrl-6\b/);
          expect(responses[19]).to.be.match(/\bCY-Unit.Sample-103\b/);
          expect(responses[20]).to.be.match(/\bhot-return\b/);
          expect(responses[20]).to.be.match(/\bTest_Ctrl-6\b/);
          expect(responses[20]).to.be.match(/\bCY-Unit.Sample-104\b/);
          // responses unit1-3
          expect(responses[17]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[18]).to.be.match((/\bid"":""radio2"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
          expect(responses[19]).to.be.match((/\bid"":""radio1"",""status"":""VALUE_CHANGED"",""value"":""true\b/));
        });
    });
  });
});

