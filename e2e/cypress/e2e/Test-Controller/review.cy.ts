import {
  backwardsTo,
  convertResultsSeperatedArrays,
  credentialsControllerTest,
  deleteDownloadsFolder,
  forwardTo,
  getFromIframe, gotoPage,
  loginSuperAdmin,
  loginTestTaker,
  openSampleWorkspace1,
  resetBackendData,
  visitLoginPage
} from '../utils';

// declared in Sampledata/CY_Test_Logins.xml-->Group:RunReview
const TesttakerName = 'Test_Review_Ctrl';
const TesttakerPassword = '123';

let startTime: number;
let endTime: number;
let elapsed: number;

describe('Navigation-& Testlet-Restrictions', { testIsolation: false }, () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    visitLoginPage();
    loginTestTaker(TesttakerName, TesttakerPassword, 'test');
  });

  it('should start a review-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('should be visible a unit menu', () => {
    cy.get('[data-cy="unit-menu"]')
      .should('exist');
  });

  it('should be visible comments button', () => {
    cy.get('[data-cy="send-comments"]')
      .should('exist');
  });

  it('should enter the block. The password should already be filled in', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .contains('Aufgabenblock');
    cy.get('[data-cy="unlockUnit"]')
      .should('have.value', 'HASE');
    // Time restricted area has been entered. Start the timer
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .then(() => {
        startTime = new Date().getTime();
      })
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.url()
      .should('include', '/u/2');
    cy.contains(/Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min/)
      .should('exist');
  });

  it('should be visible a countdown in the window header', () => {
    cy.contains('0:')
      .should('exist');
  });

  it('should give a comment', () => {
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
    cy.contains(/Kommentar gespeichert/) // TODO use data-cy
      .should('exist');
  });

  it('should navigate to next unit without responses/presentation complete but with a message', () => {
    forwardTo('Aufgabe2');
    cy.contains(/abgespielt.+bearbeitet/) // TODO use data-cy
      .should('exist');
    cy.url()
      .should('include', '/u/3');
    backwardsTo('Aufgabe1');
  });

  it('should navigate to the next unit without responses complete but with a message', () => {
    gotoPage(1);
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    forwardTo('Aufgabe2');
    cy.contains('bearbeitet') // TODO use data-cy
      .should('exist');
    cy.contains(/gesehen.+abgespielt/) // TODO use data-cy
      .should('not.be.exist');
    backwardsTo('Aufgabe1');
  });

  it('should navigate to the next unit when required fields have been filled', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    forwardTo('Aufgabe2');
  });

  it('should navigate backwards and verify that the last answer is there', () => {
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });

  it('should show a warning message when the time expires but don\'t lock the block.', () => {
    // Wait for remaining time of restricted area
    endTime = new Date().getTime();
    elapsed = endTime - startTime;
    cy.wait(credentialsControllerTest.DemoRestrTime - elapsed);
    cy.contains(/Die Bearbeitung des Abschnittes ist beendet./) // TODO use data-cy
      .should('exist');
    // Aufgabe1 is visible, because the block is in demo-mode not blocked
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('should start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="booklet-RUNREVIEW"]')
      .contains('Fortsetzen') // TODO use data-cy
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist');
  });

  it('should not restore the last answers', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="time-value"]')
      .contains('0:');
    cy.contains(/Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min/) // TODO use data-cy
      .should('exist');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('not.be.checked');
  });

  it('should go back to the booklet view and check out', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="endTest-1"]')
      .should('not.exist');
    cy.get('[data-cy="logout"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
  });

  it('should exist an answer file without responses', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('RunReview')
      .should('exist');
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

  it('should not exist a log file', () => {
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.contains('Keine Daten verfügbar')
      .should('exist');
  });

  it('should not exist a review file', () => {
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-comments"]')
      .click();
    cy.contains('Keine Daten verfügbar')
      .should('exist');
  });

  it('should exist a comment file with given comment', () => {
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-comments"]')
      .click();
    convertResultsSeperatedArrays('reviews')
      .then(sepArrays => {
        expect(sepArrays[0][6]).to.be.equal('category: tech');
        expect(sepArrays[1][5]).to.be.equal('1');
        expect(sepArrays[1][8]).to.be.equal('tobias: its a new comment');
      });
  });
});
