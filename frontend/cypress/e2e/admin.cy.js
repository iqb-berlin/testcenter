import {
  deleteDownloadsFolder, loginAdmin
} from './utils.cy';

describe('Admin functionality test', () => {
  beforeEach(deleteDownloadsFolder);
  beforeEach(loginAdmin);

  // TODO instead of testing the download of different filetypes, test of the popups are correct

  it('should download a testtakers.xml', () => {
    cy.get('mat-table >mat-row button >span')
      .contains('SAMPLE_TESTTAKERS.XML')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_TESTTAKERS.XML').should('exist');
  });

  it('should download a booklet.xml', () => {
    cy.get('mat-table >mat-row button >span')
      .contains('SAMPLE_BOOKLET.XML')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_BOOKLET.XML').should('exist');
  });

  it('should download a syscheck.xml', () => {
    cy.get('mat-table >mat-row button >span')
      .contains('SAMPLE_SYSCHECK.XML')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_SYSCHECK.XML').should('exist');
  });

  it('should download a resource', () => {
    cy.get('mat-table >mat-row button >span')
      .contains('SAMPLE_UNITCONTENTS.HTM')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_UNITCONTENTS.HTM').should('exist');
  });

  it('should download a unit', () => {
    cy.get('mat-table >mat-row button >span')
      .contains('SAMPLE_UNIT2.XML')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_UNIT2.XML').should('exist');
  });

  it('should delete syscheck.xml', () => {
    cy.get('#mat-checkbox-7 > label:nth-child(1) > span:nth-child(1)')
      .click();
    cy.get('button.mat-tooltip-trigger:nth-child(1) > span:nth-child(1) > mat-icon:nth-child(1)')
      .click();
    cy.get('button.mat-primary')
      .click();
    cy.get('mat-table >mat-row button >span')
      .contains('SysCheck.xml')
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
    cy.get('a.mat-tab-link:nth-child(2)')
      .click();
    cy.get('mat-cell > mat-checkbox')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(1) > span:nth-child(1)')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-syscheckreports.csv');
  });

  it('should download the responses of a group', () => {
    cy.get('a.mat-tab-link:nth-child(3)')
      .click();
    cy.get('mat-cell > mat-checkbox')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(1) > span:nth-child(1)')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-responses.csv');
  });

  it('should download the logs of a group', () => {
    cy.get('a.mat-tab-link:nth-child(3)')
      .click();
    cy.get('mat-cell > mat-checkbox')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(2) > span:nth-child(1)')
      .click();
    cy.readFile('cypress/downloads/iqb-testcenter-logs.csv');
  });

  it('should delete the results of a group', () => {
    cy.get('a.mat-tab-link:nth-child(3)')
      .click();
    cy.get('mat-cell > mat-checkbox')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(4) > span:nth-child(1)')
      .click();
    cy.get('button.mat-primary > span:nth-child(1)')
      .click();
    cy.get('mat-cell.mat-cell:nth-child(2)')
      .should('not.exist');
  });
});
