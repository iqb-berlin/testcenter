import {
  loginSuperAdmin, openSampleWorkspace, loginTestTaker, resetBackendData, logoutTestTaker,
  useTestDB, credentialsControllerTest, visitLoginPage
} from '../utils';

const waitMaxSnackBarDisplayed = 10000;
// declared in Sampledata/CY_ControllerTest_Logins.xml-->Group:RunDemo
const TesttakerName = 'Test_Demo_Ctrl';
const TesttakerPassword = '123';
const mode = 'demo';

let startTime: number;
let endTime: number;
let elapsed: number;

describe('Navigation-& Testlet-Restrictions', () => {
  before(resetBackendData);
  beforeEach(useTestDB);
  before(() => {
    useTestDB();
    visitLoginPage();
    loginTestTaker(TesttakerName, TesttakerPassword);
  });

  it('should be possible to choose a demo-mode booklet', () => {
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist')
      .click();
    cy.contains(/^Startseite$/)
      .should('exist');
  });

  it('should be no unit menu is visible', () => {
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('should be possible to enter the block. The password should already be filled in', () => {
    cy.get('[mattooltip="Weiter"]')
      .should('exist')
      .click();
    cy.contains('Aufgabenblock')
      .should('exist');
    cy.get('[data-cy="unlockUnit"]')
      .should('have.value', 'HASE');
    // Time restricted area has been entered. Start the timer
    cy.contains('OK').then(() => {
      startTime = new Date().getTime();
    })
      .click();
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    cy.contains(/^Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min$/)
      .should('exist');
    // wait until the message is no longer displayed
    cy.contains('Bearbeitungszeit', { timeout: waitMaxSnackBarDisplayed })
      .should('not.exist');
  });

  it('should be possible to navigate to next unit without responses/presentation complete but with a message', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // set a different timeout for snack-bars, because the snack-bar will only be visible for a few seconds
    cy.contains(/.*abgespielt.*bearbeitet.*/)
      .should('exist');
    // wait until the message is no longer displayed
    cy.contains('abgespielt', { timeout: waitMaxSnackBarDisplayed })
      .should('not.exist');
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.get('[data-cy="unit-navigation-backward"]')
      .should('exist')
      .click();
    cy.contains(/^Aufgabe1$/)
      .should('exist');
  });

  it('should be possible to navigate to the next unit without responses complete but with a message', () => {
    cy.get('[data-cy="page-navigation-1"]')
      .should('exist')
      .click();
    cy.get('iframe')
      .its('0.contentDocument.body')
      .should('be.visible')
      .then(cy.wrap)
      .contains('Presentation complete')
      .should('exist');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // set a different timeout for snack-bars, because the snack-bar will only be visible for a few seconds
    cy.contains(/.*bearbeitet.*/)
      .should('exist');
    cy.contains(/.*abgespielt.*/)
      .should('not.exist');
    // wait until the message is no longer displayed
    cy.contains('bearbeitet', { timeout: waitMaxSnackBarDisplayed })
      .should('not.exist');
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.contains(/^Aufgabe1$/)
      .should('exist');
  });

  it('should be possible to navigate to the next unit when required fields have been filled', () => {
    cy.get('iframe')
      .its('0.contentDocument.body')
      .should('be.visible')
      .then(cy.wrap)
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('exist')
      .click()
      .should('be.checked');
    cy.wait(1000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // set a different timeout for snack-bars, because the snack-bar will only be visible for a few seconds
    cy.contains(/.*bearbeitet.*/, { timeout: waitMaxSnackBarDisplayed })
      .should('not.exist');
    cy.contains(/^Aufgabe2$/)
      .should('exist');
  });

  it('should be possible to navigate backwards and verify that the last answer is there', () => {
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    // click the required field
    cy.get('iframe')
      .its('0.contentDocument.body')
      .should('be.visible')
      .then(cy.wrap)
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
  });

  it('should be there a warning message when the time is expires, but the block will not be locked.', () => {
    // Wait for remaining time of restricted area
    endTime = new Date().getTime();
    elapsed = endTime - startTime;
    cy.wait(credentialsControllerTest.DemoRestrTime - elapsed);
    cy.contains(/^Die Bearbeitung des Abschnittes ist beendet.$/)
      .should('exist');
    // wait until the message is no longer displayed
    cy.contains('Bearbeitung', { timeout: waitMaxSnackBarDisplayed })
      .should('not.exist');
    // Aufgabe1 is visible, because the block is in demo-mode not blocked
    cy.contains(/^Aufgabe1$/)
      .should('exist');
  });

  it('should be possible to start the booklet again after exiting the test', () => {
    cy.get('[data-cy="logo"]')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist')
      .contains('Fortsetzen')
      .click();
    cy.get('[data-cy="unit-navigation-forward"]')
      .should('exist');
  });

  it('should be no longer exists the last answers', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unlockUnit"]');
    cy.contains('OK')
      .click();
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    cy.contains(/^Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min$/)
      .should('exist');
    // wait until the message is no longer displayed
    cy.contains('Bearbeitungszeit', { timeout: waitMaxSnackBarDisplayed })
      .should('not.exist');
    cy.contains('Aufgabe1')
      .should('exist');
    cy.get('iframe')
      .its('0.contentDocument.body')
      .should('be.visible')
      .then(cy.wrap)
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('not.be.checked');
  });

  it('should be possible to go back to the booklet view and check out', () => {
    logoutTestTaker(mode);
  });

  it('should be no answer file in demo-mode', () => {
    loginSuperAdmin();
    openSampleWorkspace();
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .should('exist')
      .click();
    cy.wait(2000);
    cy.contains('rundemo')
      .should('not.exist');
  });
});
