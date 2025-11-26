import {
  backwardsTo,
  disableSimplePlayersInternalDebounce,
  logoutTestTaker,
  forwardTo,
  getFromIframe,
  loginSuperAdmin,
  loginTestTaker,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

// declared in Sampledata/CY_Test_Logins.xml-->Group:RunDemo
const TesttakerName = 'Test_Demo_Ctrl';
const TesttakerPassword = '123';

describe('navigation-& testlet restrictions', { testIsolation: false }, () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    probeBackendApi();
    visitLoginPage();
    loginTestTaker(TesttakerName, TesttakerPassword, 'test');
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('start a demo-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('booklet-config: there is no unit menu', () => {
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('enter the block: the password should already be filled in', () => {
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

  it('Complete all question-elements in Aufgabe 1', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    // some time to ensure that the answer is saved
    cy.wait(1000);
  });

  it('verify that the last answer is there', () => {
    forwardTo('Aufgabe2');
    backwardsTo('Aufgabe1')
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });

  it('start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.get('[data-cy="booklet-CY-BKLT_RUNDEMO"]')
      .contains('Fortsetzen')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('the last answers is no longer exist', () => {
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

  it('navigate back to the booklet view and check out', () => {
    logoutTestTaker('demo');
  });

  it('a response file is not generated', () => {
    visitLoginPage();
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('RunDemo');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.contains('Keine Daten verfügbar');
  });
});

