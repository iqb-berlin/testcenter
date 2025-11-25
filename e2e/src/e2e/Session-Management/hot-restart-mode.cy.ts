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
    resetBackendData();
    probeBackendApi();
  });
  beforeEach(() => {
    visitLoginPage();
  });

  it('start first session', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/unit/CY-Unit.Sample-101/.*`)).as('waitUnitLoad');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    //make sure the session has been added
    cy.wait(['@waitUnitLoad']);
  });

  it('start a second session', () => {
    loginTestTaker('hres1', '203', 'test-hot');
    cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/unit/CY-Unit.Sample-101/.*`)).as('waitUnitLoad');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    //make sure the session has been added
    cy.wait(['@waitUnitLoad']);
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