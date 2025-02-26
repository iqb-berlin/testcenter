import {
  getResultFileRows,
  deleteDownloadsFolder,
  getFromIframe, loginSuperAdmin,
  loginTestTaker, logoutAdmin, logoutTestTaker, openSampleWorkspace,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Check hot-return mode functions', { testIsolation: false }, () => {
  // TODO Testfälle bzgl. Ticket #315 erstellen
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    deleteDownloadsFolder();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('should be possible to start a hot-return-mode study as login: hret1', () => {
    loginTestTaker('hret1', '201', 'test-hot');
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
      .contains('hret1');
    cy.get('[data-cy="logout"]')
      .click();
  });

  it('should possible to continue the session from login: hret1, there must be the last given answer', () => {
    loginTestTaker('hret1', '201', 'test-hot');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    logoutTestTaker('hot');
  });

  it('should be possible to start a second hot-return-mode study as login: hret2', () => {
    loginTestTaker('hret2', '202', 'test-hot');
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
      .contains('hret2');
    cy.get('[data-cy="logout"]')
      .click();
  });

  it('should possible to continue the session from login: hret2, there must be the last given answer', () => {
    loginTestTaker('hret2', '202', 'test-hot');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    logoutTestTaker('hot');
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

  it('should be saved responses from login hret1 and hret2 in downloaded response file', () => {
    getResultFileRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhret1\b/);
        expect(responses[2]).to.be.match(/\bhret2\b/);
      });

    logoutAdmin();
  });
});
