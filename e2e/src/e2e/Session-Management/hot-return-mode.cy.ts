import {
  deleteDownloadsFolder,
  getFromIframe,
  getResultFileRows,
  loginSuperAdmin,
  loginTestTaker,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Check hot-return mode functions', { testIsolation: true }, () => {
  // TODO Testfälle bzgl. Ticket #315 erstellen
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
    loginTestTaker('hret1', '201', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    //wait for response complete
    cy.wait(1000);
  });

  it('continue the test with login from first session', () => {
    loginTestTaker('hret1', '201', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('start a second session', () => {
    loginTestTaker('hret2', '202', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    //wait for response complete
    cy.wait(1000);
  });

  it('continue the test with login from second session', () => {
    loginTestTaker('hret2', '202', 'test-hot');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('generated responses file exist in workspace with saved session-login', () => {
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
    getResultFileRows('responses')
      .then(responses => {
        //checks if only two sessions were created
        expect(responses[1]).to.be.match(/\bhret1\b/);
        expect(responses[2]).to.be.match(/\bhret2\b/);
      });
  });
});

