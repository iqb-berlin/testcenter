import {
  deleteDownloadsFolder,
  getFromIframe,
  getResultFileRows,
  loginSuperAdmin,
  loginTestTaker,
  logoutAdmin,
  logoutTestTaker,
  openSampleWorkspace,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Check hot-return mode functions', { testIsolation: false }, () => {
  // TODO Testfälle bzgl. Ticket #315 erstellen
  before(() => {
    deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('start first session', () => {
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

  it('second login does not create a new session', () => {
    loginTestTaker('hret1', '201', 'test-hot');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    logoutTestTaker('hot');
  });

  it('start a second session', () => {
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

  it('second login does not create a new session', () => {
    loginTestTaker('hret2', '202', 'test-hot');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .should('be.checked');
    logoutTestTaker('hot');
  });

  it('generated file (responses, logs) exist in workspace with session group names', () => {
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

  it('session login must be saved in response file', () => {
    getResultFileRows('responses')
      .then(responses => {
        expect(responses[1]).to.be.match(/\bhret1\b/);
        expect(responses[2]).to.be.match(/\bhret2\b/);
      });

    logoutAdmin();
  });
});
