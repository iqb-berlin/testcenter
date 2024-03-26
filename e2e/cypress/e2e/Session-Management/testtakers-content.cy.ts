import {
  deleteTesttakersFiles,
  loginSuperAdmin, logoutAdmin,
  openSampleWorkspace1,
  resetBackendData,
  useTestDB,
  visitLoginPage
} from '../utils';

describe('Check Testtakers Content', () => {
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(openSampleWorkspace1);
  beforeEach(deleteTesttakersFiles);

  afterEach(logoutAdmin);

  it('should be possible to load a correct testtaker-xml without any error message', () => {
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('exist');
  });

  it('should be not possible to load a incorrect testtaker-xml with a duplicated group name)', () => {
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Testtaker_DuplicatedGroup.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('Duplicate')
      .should('exist');
    cy.contains('GroupId')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });

  it('should be not possible to load a incorrect testtaker-xml with a duplicated login name)', () => {
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Testtaker_DuplicatedLogin.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('Duplicate key-sequence')
      .should('exist');
    cy.contains('Ok')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
      .should('not.exist');
  });
});
