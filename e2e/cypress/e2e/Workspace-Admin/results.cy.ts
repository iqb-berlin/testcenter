import {
  deleteDownloadsFolder, loginSuperAdmin, openSampleWorkspace,
  resetBackendData, logoutAdmin, visitLoginPage
} from '../utils';

describe('Workspace-Admin-results', () => {
  beforeEach(deleteDownloadsFolder);
  beforeEach(resetBackendData);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(() => openSampleWorkspace(1));

  afterEach(logoutAdmin);

  it('should download the responses of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox0"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-responses.csv')
      .should('exist');
  });

  it('should download the logs of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox0"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-logs.csv')
      .should('exist');
  });

  it('should delete the results of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox0"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Gruppendaten');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Gruppendaten löschen')
      .click();
    cy.get('[data-cy="results-checkbox"]')
      .should('not.exist');
  });
});
