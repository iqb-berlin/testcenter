import {
  deleteDownloadsFolder, disableSimplePlayersInternalDebounce,
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
    resetBackendData();
    probeBackendApi();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('start first session', () => {
    disableSimplePlayersInternalDebounce();
    loginTestTaker('SM-7', '201');
    cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/unit/CY-Unit.Sample-101/.*`)).as('waitUnitLoad');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    //make sure the session has been added
    cy.wait(['@waitUnitLoad']);
  });

  it('continue the test with login from first session', () => {
    disableSimplePlayersInternalDebounce();
    loginTestTaker('SM-7', '201');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('start a second session', () => {
    disableSimplePlayersInternalDebounce();
    loginTestTaker('SM-8', '202');
    cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/unit/CY-Unit.Sample-101/.*`)).as('waitUnitLoad');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    //make sure the session has been added
    cy.wait(['@waitUnitLoad']);
  });

  it('continue the test with login from second session', () => {
    disableSimplePlayersInternalDebounce();
    loginTestTaker('SM-8', '202');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('generated responses file exist in workspace with saved session-login', () => {
    loginSuperAdmin();
    openSampleWorkspace(1);
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.contains('Hote-Modes');
    cy.get('[data-cy="results-checkbox1"]')
      .click();
    cy.intercept('GET', `${Cypress.env('urls').backend}/workspace/1/report/response?*`).as('waitForDownload');
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.wait('@waitForDownload');
    getResultFileRows('responses')
      .then(responses => {
        //checks if only two sessions were created
        expect(responses[1]).to.be.match(/\bSM-7\b/);
        expect(responses[2]).to.be.match(/\bSM-8\b/);
      });
  });
});
