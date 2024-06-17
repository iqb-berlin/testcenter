import {
  loginSuperAdmin, openSampleWorkspace1, loginTestTaker, resetBackendData,
  useTestDB, credentialsControllerTest, visitLoginPage, getFromIframe, forwardTo, backwardsTo
} from '../utils';

// declared in Sampledata/CY_Test_Logins.xml-->Group:RunDemo
const TesttakerName = 'Test_Demo_Ctrl';
const TesttakerPassword = '123';

let startTime: number;
let endTime: number;
let elapsed: number;

describe('Navigation-& Testlet-Restrictions', { testIsolation: false }, () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    useTestDB();
    visitLoginPage();
    loginTestTaker(TesttakerName, TesttakerPassword, 'test');
  });
  beforeEach(useTestDB);

  it('should be possible to start a demo-test without booklet selection', () => {
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
    cy.url()
      .should('include', '/u/1');
  });

  it('should be no unit menu is visible', () => {
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('should be possible to enter the block. The password should already be filled in', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist')
      .click();
    cy.get('[data-cy="unit-block-dialog-title"]')
      .should('exist')
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
      .should('exist')
      .contains('Aufgabe1');
    cy.url()
      .should('include', '/u/2');
    cy.contains(/Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min/) // TODO use data-cy
      .should('exist');
  });

  it('should be possible to navigate to next unit without responses/presentation complete but with a message', () => {
    forwardTo('Aufgabe2');
    cy.contains('abgespielt')
      .should('exist');
    cy.url()
      .should('include', '/u/3');
    backwardsTo('Aufgabe1');
  });

  it('should be possible to navigate to the next unit without responses complete but with a message', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    getFromIframe('[data-cy="TestController-Text-Aufg1-S2"]')
      .contains('Presentation complete');
    forwardTo('Aufgabe2');
    cy.contains('bearbeitet') // TODO use data-cy
      .should('exist');
    cy.contains(/gesehen.+abgespielt/) // TODO use data-cy
      .should('not.be.exist');
    backwardsTo('Aufgabe1');
  });

  it('should be possible to navigate to the next unit when required fields have been filled', () => {
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.wait(1000); // so the answer gets saved
    forwardTo('Aufgabe2');
  });

  it('should be possible to navigate backwards and verify that the last answer is there', () => {
    backwardsTo('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });

  it('should give a warning message when the time is expired, but the block will not be locked.', () => {
    // Wait for remaining time of restricted area
    endTime = new Date().getTime();
    elapsed = endTime - startTime;
    cy.wait(credentialsControllerTest.DemoRestrTime - elapsed);
    cy.contains(/Die Bearbeitung des Abschnittes ist beendet./) // TODO use data-cy
      .should('exist');
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
  });

  it('should be possible to start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist')
      .contains('Fortsetzen') // TODO use data-cy
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Startseite');
  });

  it('should be no longer exists the last answers', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]');
    cy.get('[data-cy="unit-block-dialog-submit"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .should('exist')
      .contains('Aufgabe1');
    cy.contains(/Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min/) // TODO use data-cy
      .should('exist');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('not.be.checked');
  });

  it('should be possible to go back to the booklet view and check out', () => {
    cy.get('[data-cy="logo"]')
      .should('exist')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="endTest-1"]')
      .should('not.exist');
    cy.get('[data-cy="logout"]')
      .should('exist')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
  });

  it('should be no answer file in demo-mode', () => {
    loginSuperAdmin();
    openSampleWorkspace1();
    cy.get('[data-cy="Ergebnisse/Antworten"]') // TODO use data-cy
      .should('exist')
      .click();
    cy.wait(2000);
    cy.contains('rundemo')
      .should('not.exist');
  });
});
