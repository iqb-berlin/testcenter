import {
  deleteTesttakersFiles,
  loginSuperAdmin,
  openSampleWorkspace,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Check Testtakers Content', () => {
  before(resetBackendData);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);

  it('load invalid testtaker-xml with duplicated group name is not possible)', () => {
    openSampleWorkspace(1);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile(`${Cypress.config('fixturesFolder')}/Testtaker_DuplicatedGroup.xml`, { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate key-sequence');
    cy.get('[data-cy="upload-report"]')
      .contains('GroupId');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });

  it('load invalid testtaker-xml with duplicated login name is not possible)', () => {
    openSampleWorkspace(1);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile(`${Cypress.config('fixturesFolder')}/Testtaker_DuplicatedLogin.xml`, { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate key-sequence');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });

  it('overwrite the testtaker with other filename is not possible', () => {
    openSampleWorkspace(1);
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Abgelehnt');
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate');
    cy.get('[data-cy="close-upload-report"]')
      .click();
  });

  it('load the same testtaker that exist in ws1 to ws2 is not possible', () => {
    openSampleWorkspace(2);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Abgelehnt');
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate');
    cy.get('[data-cy="close-upload-report"]')
      .click();
  });

  it('overwrite testtaker with the same file name is possible', () => {
    openSampleWorkspace(1);
    deleteTesttakersFiles(1);
    cy.wait(500);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Erfolgreich hochgeladen');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Erfolgreich hochgeladen');
    cy.get('[data-cy="upload-report"]')
      .contains('overwritten');
    cy.get('[data-cy="close-upload-report"]')
      .click();
  });

});
