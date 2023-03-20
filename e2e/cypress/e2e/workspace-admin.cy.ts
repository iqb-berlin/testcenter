// TODO better selectors

import {
  deleteDownloadsFolder, loginAdmin, useTestDB
} from './utils';

describe('Workspace-Admin', () => {
  beforeEach(useTestDB);
  beforeEach(deleteDownloadsFolder);
  beforeEach(loginAdmin);

  // TODO instead of testing the download of different filetypes, test of the popups are correct

  it('should download a testtakers.xml', () => {
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_TESTTAKERS.XML').should('exist');
  });

  it('should download a booklet.xml', () => {
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_BOOKLET.XML').should('exist');
  });

  it('should download a syscheck.xml', () => {
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_SYSCHECK.XML').should('exist');
  });

  it('should download a resource', () => {
    cy.get('[data-cy="SAMPLE_UNITCONTENTS.HTM"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_UNITCONTENTS.HTM').should('exist');
  });

  it('should download a unit', () => {
    cy.get('[data-cy="SAMPLE_UNIT2.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_UNIT2.XML').should('exist');
  });

  it('should delete syscheck.xml', () => {
    cy.get('[data-cy="files-checkbox-SYSCHECK.SAMPLE"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .should('not.exist');
  });

  // TODO uplaod test
  // it.skip('should upload SysCheck.xml', () => {
  //   const filepath = 'sampledata/SysCheck.xml';
  //   cy.get('button.mat-focus-indicator:nth-child(2)')
  //     .click();
  //   cy.get('.sidebar > input:nth-child(2)').attachFile(filepath);
  //   cy.wait(1500);
  //   cy.reload(true);
  //   cy.get('mat-table >mat-row button >span')
  //     .contains('SysCheck.xml')
  //     .should('exist');
  // });

  it('should download a systemcheck summary (csv)', () => {
    cy.get('[data-cy="System-Check Berichte"]')
      .click();
    cy.get('[data-cy="systemcheck-checkbox"]')
      .click();
    cy.get('[data-cy="download-button"]')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-syscheckreports.csv');
  });

  it('should download the responses of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox"]')
      .click();
    cy.get('[data-cy="download-responses"]')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-responses.csv');
  });

  it('should download the logs of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox"]')
      .click();
    cy.get('[data-cy="download-logs"]')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-logs.csv');
  });

  it('should delete the results of a group', () => {
    cy.get('[data-cy="Ergebnisse/Antworten"]')
      .click();
    cy.get('[data-cy="results-checkbox"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="results-checkbox"]')
      .should('not.exist');
  });
});
