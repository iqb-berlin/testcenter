import {
  backwardsTo, cleanUp,
  convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  getFromIframe,
  loginSuperAdmin,
  logoutFromTestNoConfirmation,
  openWorkspace,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage,
  twoStepLogin,
  clickCardButton,
  logout
} from '../utils';

describe('run a review test, check time block dialogs', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    deleteDownloadsFolder();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    twoStepLogin('Test_Ctrl-2a', '123');
  });

  it('start a test check unit-menu and time display', () => {
    clickCardButton('booklet-CY-BKLT_TC-2A');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="unit-menu"]')
      .should('be.visible');
    cy.get('[data-cy="time-value"]')
      .should('be.visible')
      .contains('0:');
  });

 it('Complete all question-elements in Aufgabe 1', () => {
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('navigate backwards and verify that the last answer is there', () => {
    forwardTo('Aufgabe2');
    backwardsTo('Aufgabe1');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });
 //todo: Wenn Unit-Menu sichtbar Test beenden darüber und dann checken ob Testheft gesperrt ist, siehe auch 1521
  it('start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Im normalen Testablauf wird beim Verlassen des zeitbegrenzten Blocks eine Warnung angezeigt.');
    cy.get('[data-cy="toast-action-0"]')
      .click({force: true});
    cy.get('[data-cy="booklet-CY-BKLT_TC-2A"]')
      .contains('Weiter')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('the last answers should be not visible', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('.snackbar-time-started')
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('not.be.checked');
  });

  it('navigate backward to the booklet view and check out', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .should('not.exist');
    logoutFromTestNoConfirmation();
  });

  it('there are no responses in the response file', () => {
    visitLoginPage();
    loginSuperAdmin();
    openWorkspace('workspace-card-sample_workspace', 1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('Review');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Keine Daten verfügbar.');
    cy.get('[data-cy="toast-action-0"]')
      .click();
  });

  it('there are no logs in the response file', () => {
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Keine Daten verfügbar.');
    cy.get('[data-cy="toast-action-0"]')
      .click();
  });
});

describe('check review comments functionality', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    deleteDownloadsFolder();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    twoStepLogin('Test_Ctrl-2a', '123');
  });

  it('write a booklet comment', () => {
    clickCardButton('booklet-CY-BKLT_TC-2A');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="send-comments"]')
      .click();
    cy.get('[data-cy="comment-diag-reviewer"]')
      .type('Mustermann');
    cy.get('[data-cy="comment-diag-currentBklt"]')
      .find('input[type="radio"]')
      .check({ force: true });
    cy.get('[data-cy="comment-diag-comment"]')
      .type('Ein Kommentar zum Booklet');
    cy.get('[data-cy="comment-diag-priority1"]')
      .find('input[type="radio"]')
      .check({ force: true });
    cy.get('[data-cy="comment-diag-submit"]')
      .click({ force: true });
    });

  it('write a unit comment', () => {
    cy.get('[data-cy="send-comments"]')
      .click();
    cy.get('[data-cy="comment-diag-reviewer"]')
      .clear()
      .type('Mustermann');
    cy.get('[data-cy="comment-diag-currentUnit"]')
      .find('input[type="radio"]')
      .check({ force: true });
    cy.get('[data-cy="comment-diag-comment"]')
      .type('Ein Kommentar zur Unit');
    cy.get('[data-cy="comment-diag-priority1"]')
      .find('input[type="radio"]')
      .check({ force: true });
    cy.get('[data-cy="comment-diag-submit"]')
      .click({ force: true });
    cy.get('.snackbar-comment-saved')
      .contains('Kommentar gespeichert');
  });

  it('check buttons of comment toolbar', () => {
    cy.get('[data-cy="send-comments"]')
      .click();
    cy.get('[data-cy="comment-toolbar-show-list"]')
      .click();
    cy.get('[data-cy="comment-list-booklet-comments"]')
      .contains('Ein Kommentar zum Booklet');
    cy.get('[data-cy="comment-list-unit-comments"]')
      .contains('Ein Kommentar zur Unit');
    cy.get('[data-cy="comment-toolbar-back-to"]')
      .click();
    cy.get('[data-cy="comment-diag-reviewer"]')
      .should('be.visible');
    cy.get('[data-cy="comment-toolbar-new-comment"]')
      .click();
    cy.get('[data-cy="comment-diag-reviewer"]')
      .should('be.visible');
    cy.get('[data-cy="comment-toolbar-back-to"]')
      .should('not.exist');
    cy.get('[data-cy="comment-diag-close"]')
      .click({ force: true });
  });

  it('delete a comment', () => {
    cy.get('[data-cy="send-comments"]')
      .click();
    cy.get('[data-cy="comment-toolbar-show-list"]')
      .click();
    cy.get('[data-cy="comment-list-booklet-comments"]')
      .contains('Ein Kommentar zum Booklet')
      .click();
    cy.get('[data-cy="comment-diag-delete"]')
      .click({ force: true });
    cy.get('.snackbar-comment-deleted')
      .contains('Kommentar gelöscht');
    cy.get('[data-cy="comment-toolbar-show-list"]')
      .click({ force: true });
    cy.get('[data-cy="comment-list-booklet-comments"]')
      .should('not.exist');
    cy.get('[data-cy="comment-diag-close"]')
      .click({ force: true });
  });

  it('check the given comment in response file', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.intercept('GET', `${Cypress.env('urls').backend}/reviews/export`).as('waitForDownloadComment');
    cy.get('[data-cy="review-download"]')
      .click();
    cy.wait('@waitForDownloadComment');
    convertResultsSeperatedArrays('reviews')
      .then(sepArrays => {
        //priority
        expect(sepArrays[1][5]).to.be.equal('1');
        //reviewer
        expect(sepArrays[1][11]).to.be.equal('Mustermann');
        //entry
        expect(sepArrays[1][12]).to.be.equal('Ein Kommentar zur Unit');
      });
  });
});

describe('check code word options', { testIsolation: true }, () => {
  before(() => {
    cleanUp();
    deleteDownloadsFolder();
    resetBackendTestData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
  });

  it('show the current code word: text-field', () => {
    twoStepLogin('Test_Ctrl-2b', '123');
    clickCardButton('booklet-CY-BKLT_TC-2B');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Das Freigabewort lautet Hase');
    cy.get('[data-cy="code-input"]')
      .type('Hase');
    cy.get('[data-cy="continue"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true });
  });

  it('show the current code word: keypad-symbols', () => {
    twoStepLogin('Test_Ctrl-2c', '123');
    clickCardButton('booklet-CY-BKLT_TC-2C');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    //wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('Das Freigabewort lautet 123');
    cy.get('[data-cy="code-btn-1"]')
      .click();
    cy.get('[data-cy="code-btn-2"]')
      .click();
    cy.get('[data-cy="code-btn-3"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true });
    cy.get('[data-cy="toast-item"]')
      .should('not.exist');
  });
});

describe('check deny navigation dialogs', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    deleteDownloadsFolder();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    twoStepLogin('Test_Ctrl-2d', '123');
  });

  it('presentation/response-complete forward (ALWAYS)', () => {
    clickCardButton('booklet-CY-BKLT_TC-2D');
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    // wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    // wait for presentation complete
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('abgespielt')
      .and('contain', 'bearbeitet');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true});
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    // wait for presentation complete
    cy.wait(1000);
  });

  it('presentation/response-complete backward (ALWAYS)', () => {
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="toast-text-0"]')
      .contains('abgespielt')
      .and('contain', 'bearbeitet');
    cy.get('[data-cy="toast-action-0"]')
      .click({ force: true});
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });
});