import {
  deleteDownloadsFolder,
  loginSuperAdmin,
  logoutAdmin,
  openSampleWorkspace,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Workspace-Admin-results', () => {
  before(() => {
    deleteDownloadsFolder();
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    visitLoginPage();
    loginSuperAdmin();
    openSampleWorkspace(1);
  });

  it('download the responses of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox0"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-responses.csv`);
  });

  it('download the logs of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox0"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-logs.csv`);
  });

  it('delete the results of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox0"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Gruppendaten');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Gruppendaten löschen')
      .click();
    cy.get('[data-cy="results-checkbox"]')
      .should('not.exist');
  });
});
