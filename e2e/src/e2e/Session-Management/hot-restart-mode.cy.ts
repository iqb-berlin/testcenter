import {
  convertResultsSeperatedArrays,
  deleteDownloadsFolder,
  getFromIframe,
  loginSuperAdmin,
  loginTestTaker,
  logoutAdmin,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

let idHres1;
let idHres2;

describe('check hot-restart-mode functions', { testIsolation: false }, () => {
  before(() => {
    deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
    probeBackendApi();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('start first session', () => {
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

  it('start a second session', () => {
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

  it('different ID/Code must be saved for each session', () => {
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres1 = LoginID[1][2];
        idHres2 = LoginID[2][2];
        expect(idHres1).to.not.equal(idHres2);
      });
  });
});

