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

  it('should be not possible to load a incorrect testtaker-xml with a duplicated group name)', () => {
    openSampleWorkspace(1);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Testtaker_DuplicatedGroup.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate key-sequence');
    cy.get('[data-cy="upload-report"]')
      .contains('GroupId');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });

  it('should be not possible to load a incorrect testtaker-xml with a duplicated login name)', () => {
    openSampleWorkspace(1);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Testtaker_DuplicatedLogin.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate key-sequence');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });

  it('should be not possible to overwrite the testtaker file in ws1, if the file have the another name', () => {
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

  it('should be possible overwrite the testtaker file in ws1, if the file have the same name', () => {
    openSampleWorkspace(1);
    deleteTesttakersFiles();
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

  it('should not be possible to load the same testtaker file that is already exist in ws1 to ws2', () => {
    openSampleWorkspace(2);
    deleteTesttakersFiles();
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="upload-report"]')
      .contains('Abgelehnt');
    cy.get('[data-cy="upload-report"]')
      .contains('Duplicate');
    cy.get('[data-cy="close-upload-report"]')
      .click();
  });
});
