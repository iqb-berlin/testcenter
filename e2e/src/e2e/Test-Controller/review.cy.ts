import {
  backwardsTo, cleanUp,
  convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  getFromIframe,
  loginSuperAdmin,
  logoutTestTakerDemo,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData,
  visitLoginPage,
  insertCredentials
} from '../utils';

describe('navigation-& testlet restrictions', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    deleteDownloadsFolder();
    resetBackendData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    insertCredentials('Test_Ctrl-2', '123');
    cy.get('[data-cy="login-user"]')
      .click();
    cy.url().should('contain', `${Cypress.config().baseUrl}/#/r/starter`);
  });

  it('starter page shows review download button', () => {
    cy.contains('Reviews downloaden')
      .should('be.visible');
  });

  it('start a review-test from booklet selection', () => {
    cy.get('[data-cy^="booklet-"]')
      .first()
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('booklet-config: a unit menu must be there', () => {
    cy.get('[data-cy="unit-menu"]');
  });

  it('comments button must be visible', () => {
    cy.get('[data-cy="send-comments"]');
  });

  it('enter the block, the password should already be filled in', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('have.value', 'Hase');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.url()
      .should('include', '/u/2');
    cy.get('.snackbar-time-started')
      .contains('Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min');
  });

  it('booklet-config: a countdown must be visible in the window header', () => {
    cy.get('[data-cy="time-value"]')
      .contains('0:');
  });

  it('write a comment', () => {
    cy.get('[data-cy="send-comments"]')
      .click();
    cy.get('[data-cy="comment-diag-title"]')
      .contains('Kommentar verfassen');
    cy.get('[data-cy="comment-diag-reviewer"]')
      .type('tobias');
    cy.get('[data-cy="comment-diag-currentBklt"]')
      .click();
    cy.get('[data-cy="comment-diag-currentUnit"]')
      .click({ force: true })
    cy.get('[data-cy="comment-diag-priority1"]')
      .contains('dringend')
      .click();
    cy.get('[data-cy="comment-diag-cat-tech"]')
      .click();
    cy.get('[data-cy="comment-diag-comment"]')
      .type('its a new comment');
    cy.get('[data-cy="comment-diag-submit"]')
      .click();
    cy.get('.snackbar-comment-saved')
      .contains('Kommentar gespeichert');
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

  it('start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_TC-2"]')
      .contains('Fortsetzen')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('the last answers should be not visible', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]');
    cy.get('[data-cy="unit-block-dialog-submit"]')
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
    cy.get('[data-cy="endTest-1"]')
      .should('not.exist');
    cy.get('.snackbar-demo-mode')
      .contains('Schließen')
      .click();
    logoutTestTakerDemo();
  });

  it('there are no responses in the response file', () => {
    visitLoginPage();
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('Review');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    // responses must be empty
    convertResultsSeperatedArrays('responses')
      .then(sepArrays => {
        expect(sepArrays[1][6]).to.be.equal('[]');
      });
  });

  it('there are no logs in the response file', () => {
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.get('.snackbar-demo-mode')
      .contains('Keine Daten verfügbar');
    cy.get('.snackbar-demo-mode')
      .contains('Schließen')
      .click();
  });

  it('check the given comment in response file', () => {
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.intercept('GET', `${Cypress.env('urls').backend}/workspace/1/report/review?*`).as('waitForDownloadComment');
    cy.get('[data-cy="download-comments"]')
      .click();
    cy.wait('@waitForDownloadComment');
    convertResultsSeperatedArrays('reviews')
      .then(sepArrays => {
        expect(sepArrays[0][6]).to.be.equal('category: tech');
        expect(sepArrays[1][5]).to.be.equal('1');
        expect(sepArrays[1][8]).to.be.equal('its a new comment');
      });
  });
});

