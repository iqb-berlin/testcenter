import {
  backwardsTo,
  convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  getFromIframe,
  gotoPage,
  loginSuperAdmin,
  loginTestTaker,
  logoutTestTaker,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData, visitLoginPage
} from '../utils';

// declared in Sampledata/CY_Test_Logins.xml-->Group:RunReview
const TesttakerName = 'Test_Review_Ctrl';
const TesttakerPassword = '123';

describe('navigation-& testlet restrictions', { testIsolation: false }, () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    probeBackendApi();
    visitLoginPage();
    loginTestTaker(TesttakerName, TesttakerPassword, 'test');
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('start a review-test without booklet selection', () => {
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
      .contains('Kommentar geben');
    cy.get('[data-cy="comment-diag-sender"]')
      .type('tobias');
    cy.get('[data-cy="comment-diag-currentBklt"]')
      .click();
    cy.get('[data-cy="comment-diag-currentUnit"]')
      .click();
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
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('navigate backwards and verify that the last answer is there', () => {
    forwardTo('Aufgabe2');
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });

  it('start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_RUNREVIEW"]')
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
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
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
    logoutTestTaker('demo');
  });

  it('there are no responses in the response file', () => {
    visitLoginPage();
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('RunReview');
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
        expect(sepArrays[1][8]).to.be.equal('tobias: its a new comment');
      });
  });
});

