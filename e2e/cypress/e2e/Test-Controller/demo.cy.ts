import {
  loginSuperAdmin,
  openSampleWorkspace,
  loginTestTaker,
  resetBackendData,
  visitLoginPage,
  getFromIframe,
  forwardTo,
  backwardsTo,
  disableSimplePlayersInternalDebounce,
  gotoPage
} from '../utils';

// declared in Sampledata/CY_Test_Logins.xml-->Group:RunDemo
const TesttakerName = 'Test_Demo_Ctrl';
const TesttakerPassword = '123';

describe('Navigation-& Testlet-Restrictions', { testIsolation: false }, () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    visitLoginPage();
    loginTestTaker(TesttakerName, TesttakerPassword, 'test');
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should start a demo-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('should be no unit menu is visible', () => {
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('should enter the block. The password should already be filled in', () => {
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

  it('should navigate to next unit without responses/presentation complete but with a message', () => {
    forwardTo('Aufgabe2');
    cy.get('.snackbar-demo-mode')
      .contains('Es wurde nicht alles gesehen oder abgespielt.');
    cy.url()
      .should('include', '/u/3');
    backwardsTo('Aufgabe1');
  });

  it('should navigate to the next unit without responses complete but with a message', () => {
    gotoPage(1);
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    forwardTo('Aufgabe2');
    cy.get('.snackbar-demo-mode')
      .contains('Es wurde nicht alles bearbeitet.');
    cy.get('.snackbar-demo-mode')
      .contains('gesehen')
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

  it('should start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .contains('Fortsetzen')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Startseite');
  });

  it('should be no longer exists the last answers', () => {
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

  it('should be no answer file in demo-mode', () => {
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('rundemo')
      .should('not.exist');
  });
});
