import {
  deleteTesttakersFiles,
  loginSuperAdmin,
  logoutAdmin,
  openSampleWorkspace1, openSampleWorkspace2,
  resetBackendData,
  useTestDB,
  visitLoginPage
} from '../utils';

describe('Check Testtakers Duplicates in workspaces', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);

  afterEach(logoutAdmin);

  it('should be not possible to overwrite the testtaker file in ws1, if the file have the another name', () => {
    openSampleWorkspace1();
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .should('exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains(/^Duplicate login:.*/)
      .should('exist');
    cy.contains('Ok')
      .click();
  });

  it('should be possible overwrite the testtaker file in ws1, if the file have the same name', () => {
    openSampleWorkspace1();
    deleteTesttakersFiles();
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('overwritten')
      .should('exist');
    cy.contains('Ok')
      .click();
  });

  it('should not be possible to load the same testtaker file that is already exist in ws1 to ws2', () => {
    openSampleWorkspace2();
    deleteTesttakersFiles();
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains(/^Duplicate login:.*- also on workspace sample_workspace in file.*/)
      .should('exist');
    cy.contains('Ok')
      .click();
  });
});