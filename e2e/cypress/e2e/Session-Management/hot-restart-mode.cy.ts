import {
  convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  getFromIframe,
  loginSuperAdmin,
  loginTestTaker,
  openSampleWorkspace,
  resetBackendData,
  visitLoginPage,
  logoutAdmin

} from '../utils';

let idHres1;
let idHres2;

describe('Check hot-restart-mode functions', { testIsolation: false }, () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    deleteDownloadsFolder();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('should be possible to start a hot-restart session: hres1', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.get('[data-cy="logo"]')
      .click();
    cy.log('end test');
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="card-login-name"]')
      .contains('h5ki-bd-');
    cy.get('[data-cy="logout"]')
      .click();
  });

  it('should not possible to continue the session from login: hres1, it must be start a new session', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    cy.get('[data-cy="logo"]')
      .click();
    cy.log('end test');
    cy.get('[data-cy="endTest-1"]')
      .click();
    cy.get('[data-cy="card-login-name"]')
      .contains('va4dg-jc');
    cy.get('[data-cy="logout"]')
      .click();
  });

  it('should be a generated file (responses, logs) in the workspace with groupname: SM_HotModes', () => {
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('SessionManagement Hot-Modes-Test Logins');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    logoutAdmin();
  });

  it('should be generated a different ID/Code for each hres-login', () => {
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres1 = LoginID[1][2];
        idHres2 = LoginID[2][2];
        expect(idHres1).to.not.equal(idHres2);
      });
  });
});
