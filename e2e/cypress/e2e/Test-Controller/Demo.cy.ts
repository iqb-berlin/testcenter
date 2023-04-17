import {
  loginAdmin, openSampleWorkspace, loginUser, resetBackendData
} from '../utils';

// ########################## User Credentials #################################################
const SuperAdminName = 'super';
const SuperAdminPassword = 'user123';

// Credentials Logins(Declared in Sampledata/CY_ControllerTest_Logins.xml-->Group:RunDemo)
const UserName = 'Test_Demo_Ctrl';
const UserPassword = '123';

// Credentials Booklet(Declared in Sampledata/CY_BKL_Mode_Demo.xml-->Testlet Restriction)
const RestrTime = 60000;
const BookletLoadTime = 1000;

// some variables for cypress wait times
const waitSnackbarBlockTimeFinished = 6000;
const waitSnackbarNavigationPrevented = 4000;
const waitLoadCompleted = 1000;

let startTime: number;
let endTime: number;
let elapsed: number;

describe('Navigation-& Testlet-Restrictions', () => {
  before(resetBackendData);
  before(() => loginUser(UserName, UserPassword));

  it('should be possible to choose a demo-mode booklet', () => {
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist')
      .click();
    cy.wait(BookletLoadTime);
    // check for an exact match
    cy.contains(/^Startseite$/)
      .should('exist');
  });

  it('should be no unit menu is visible', () => {
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="unit-menu"]')
      .should('not.exist');
  });

  it('should ask for a password for the restricted area and the password should already be filled in', () => {
    cy.get('[mattooltip="Weiter"]')
      .should('exist')
      .click();
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="unlockUnit"]')
      .should('have.value', 'HASE');
  });

  it('should be possible to enter the block and see the first unit.', () => {
    // Time restricted area has been entered. Start the timer
    cy.contains('OK').then(() => {
      startTime = new Date().getTime();
    })
      .click();
    // check for an exact match
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    // check time restriction
    cy.contains(/^Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min$/, { timeout: 2000 })
      .should('exist');
    // wait until the message for time is finished is no longer displayed
    cy.wait(waitSnackbarBlockTimeFinished);
  });

  it('should be possible to navigate to next unit without responses/presentation complete but with a message', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // set a different timeout for snack-bars, because the snack-bar will only be visible for a few seconds
    cy.contains(/.*abgespielt.*bearbeitet.*/, { timeout: 2000 })
      .should('exist');
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    // wait until the snack-bar for navigation prevented is no longer displayed
    cy.wait(waitSnackbarNavigationPrevented);
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
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // set a different timeout for snack-bars, because the snack-bar will only be visible for a few seconds
    cy.contains(/.*bearbeitet.*/, { timeout: 2000 })
      .should('exist');
    cy.contains(/.*abgespielt.*/, { timeout: 2000 })
      .should('not.exist');
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    // wait until the snack-bar for navigation prevented is no longer displayed
    cy.wait(waitSnackbarNavigationPrevented);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.contains(/^Aufgabe1$/)
      .should('exist');
  });

  it('should be possible to navigate to the next unit when required fields have been filled', () => {
    cy.wait(waitLoadCompleted);
    // click the required field
    cy.get('iframe')
      .its('0.contentDocument.body')
      .should('be.visible')
      .then(cy.wrap)
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .should('exist')
      .click()
      .should('be.checked');
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    // set a different timeout for snack-bars, because the snack-bar will only be visible for a few seconds
    cy.contains(/.*bearbeitet.*/, { timeout: 2000 })
      .should('not.exist');
    cy.contains(/^Aufgabe2$/)
      .should('exist');
  });

  it('should be possible to navigate backwards and verify that the last answer is there', () => {
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.wait(waitLoadCompleted);
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
    cy.wait(RestrTime - elapsed);
    cy.contains(/^Die Bearbeitung des Abschnittes ist beendet.$/, { timeout: 2000 })
      .should('exist');
    cy.wait(waitLoadCompleted);
  });

  it('should be possible to start the booklet again after exiting the test', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.wait(waitLoadCompleted);
    cy.contains(/^Aufgabe2$/)
      .should('exist');
    cy.get('[data-cy="logo"]')
      .click();
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="booklet-RUNDEMO"]')
      .should('exist')
      .contains('Fortsetzen')
      .click();
    cy.wait(BookletLoadTime);
    cy.contains('Startseite')
      .should('exist');
  });

  it('should be no longer exists the last answers', () => {
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="unlockUnit"]');
    cy.contains('OK')
      .click();
    cy.wait(waitLoadCompleted);
    cy.contains(/^Aufgabe1$/)
      .should('exist');
    // check time restriction
    cy.contains(/^Die Bearbeitungszeit für diesen Abschnitt hat begonnen: 1 min$/, { timeout: 2000 })
      .should('exist');
    // wait until the message for time is finished is no longer displayed
    cy.wait(waitSnackbarBlockTimeFinished);
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
    cy.get('[data-cy="logo"]')
      .should('exist')
      .click();
    cy.wait(1000);
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/test-starter`);
    cy.get('[data-cy="logout"]')
      .should('exist')
      .click();
    cy.url()
      .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
  });

  it('should be no answer file in demo-mode', () => {
    loginAdmin(SuperAdminName, SuperAdminPassword);
    openSampleWorkspace();
    cy.wait(waitLoadCompleted);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.wait(waitLoadCompleted);
    cy.contains('rundemo')
      .should('not.exist');
  });
});
