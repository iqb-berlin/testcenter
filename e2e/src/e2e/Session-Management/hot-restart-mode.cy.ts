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
  visitLoginPage,
  logoutTestTaker

} from '../utils';

let idHres1;
let idHres2;

describe('check hot-restart-mode functions', { testIsolation: true }, () => {
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
    //wait for response complete
    cy.wait(1000);

  });

  it('start a second session', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    //wait for response complete
    cy.wait(1000);

  });

  it('generated response file exist in workspace with different ID/Code for each session', () => {
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('SessionManagement Hot-Modes-Test Logins');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.intercept('GET', `${Cypress.env('urls').backend}/workspace/1/report/response?*`).as('waitForDownload');
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.wait('@waitForDownload');
    convertResultsSeperatedArrays('responses')
      .then(LoginID => {
        idHres1 = LoginID[1][2];
        idHres2 = LoginID[2][2];
        expect(idHres1).to.not.equal(idHres2);
      });
  });
});

