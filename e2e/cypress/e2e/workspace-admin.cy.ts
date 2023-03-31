import {
  deleteDownloadsFolder, loginAdmin, resetBackendData, openSampleWorkspace, deleteFilesSampleWorkspace
} from './utils';

// ########################## Credentials #################################################
const SuperAdminName = 'super';
const SuperAdminPassword = 'user123';
// #######################################################################################

describe('Workspace-Admin', () => {
  beforeEach(deleteDownloadsFolder);
  beforeEach(resetBackendData);
  beforeEach(() => loginAdmin(SuperAdminName, SuperAdminPassword));
  beforeEach(openSampleWorkspace);

  it('should be possible to download files', () => {
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_TESTTAKERS.XML').should('exist');
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_BOOKLET.XML').should('exist');
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_SYSCHECK.XML').should('exist');
    cy.get('[data-cy="SAMPLE_UNITCONTENTS.HTM"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_UNITCONTENTS.HTM').should('exist');
    cy.get('[data-cy="SAMPLE_UNIT2.XML"]')
      .click();
    cy.readFile('cypress/downloads/SAMPLE_UNIT2.XML').should('exist');
  });

  // delete files without dependencies
  it('should possible to delete the file syscheck.xml', () => {
    cy.get('[data-cy="files-checkbox-SYSCHECK.SAMPLE"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .should('not.exist');
  });

  // delete files with dependencies
  it('should not be possible to delete SAMPLE_BOOKLET.XML. There is a dependency in SAMPLE_TESTTAKERs.XML', () => {
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .should('exist');
    // delete firstly the file SAMPLE_TESTTAKERS.XML
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.wait(1000);
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .should('not.exist');
    // its possible to delete SAMPLE_BOOKLET.XML, because there is no dependency
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .should('not.exist');
  });

  it('should be possible to upload the file SysCheck.xml without any dependencies', () => {
    cy.get('[data-cy="files-checkbox-SYSCHECK.SAMPLE"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .should('not.exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/SysCheck.xml', { force: true });
    cy.wait(1500);
    cy.reload(true);
    cy.get('mat-table >mat-row button >span')
      .contains('SysCheck.xml')
      .should('exist');
  });

  it('should only be possible to upload a file with dependencies, if the dependent file already exists', () => {
    deleteFilesSampleWorkspace();
    // Try to load a file before the dependent file is loaded
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Unit.xml', { force: true })
      .wait(1500)
      .reload(true);
    cy.contains('Unit.xml')
      .should('not.exist');
    // try to load a file after the dependent file is loaded
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/verona-player-simple-4.0.0.html', { force: true })
      .wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/sample_resource_package.itcr.zip', { force: true })
      .wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true })
      .wait(1000);
    cy.reload(true);
    cy.contains('verona-player-simple-4.0.0.html')
      .should('exist');
    cy.contains('sample_resource_package.itcr.zip')
      .should('exist');
    cy.contains('SAMPLE_UNITCONTENTS.HTM')
      .should('exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Unit.xml', { force: true })
      .wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Unit2.xml', { force: true })
      .wait(1000);
    cy.reload(true);
    cy.contains('Unit.xml')
      .should('exist');
    cy.contains('Unit2.xml')
      .should('exist');
    // Try to load all other files in the right order
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/SysCheck.xml', { force: true })
      .wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Booklet.xml', { force: true })
      .wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Booklet2.xml', { force: true })
      .wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Booklet3.xml', { force: true })
      .wait(1000);
    cy.reload(true);
    cy.contains('Booklet.xml')
      .should('exist');
    cy.contains('Booklet2.xml')
      .should('exist');
    cy.contains('Booklet3.xml')
      .should('exist');
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Testtakers.xml', { force: true })
      .wait(1000);
    cy.reload(true);
    cy.contains('Testtakers.xml')
      .should('exist');
  });

  it('should be not possible to upload a Booklet-File with 2 Testlets and the same Testlet-Names', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.wait(1000);
    // load a prepared Booklet-File from folder cypress/fixtures
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Booklet_sameTestlets.xml', { force: true })
      .wait(1500);
    cy.contains('testletId')
      .should('exist');
    cy.reload(true);
    cy.contains('Booklet_sameTestlets.xml')
      .should('not.exist');
  });

  it('should be not possible to upload a Booklet-File with 2 Units and the same Unit-IDs', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.wait(1000);
    // load a prepared Booklet-File from folder cypress/fixtures
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Booklet_sameUnitIDs.xml', { force: true })
      .wait(1500);
    cy.contains('unitId')
      .should('exist');
    cy.reload(true);
    cy.contains('Booklet_sameUnitIDs.xml')
      .should('not.exist');
  });

  it('should be possible to upload a Booklet-File with 2 same Unit-IDs, but one of this with an alias', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.wait(1000);
    // load a prepared Booklet-File from folder cypress/fixtures
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Booklet_sameUnitIDs_Alias.xml', { force: true })
      .wait(1500);
    cy.reload(true);
    cy.contains('Booklet_sameUnitIDs_Alias.xml')
      .should('exist');
  });

  it('should be possible to overwrite a Booklet-File with the same Bookletname and Booklet-ID', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Booklet.xml', { force: true })
      .wait(1000);
    // load a the same booklet file again
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Booklet.xml', { force: true })
      .wait(1000);
    cy.contains('overwritten')
      .should('exist');
  });

  it('should be not possible to load a Booklet with the same name, but another ID and Testletsnames', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.wait(1000);
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('../sampledata/Booklet.xml', { force: true })
      .wait(1000);
    // load a prepared Booklet with same name, but different ID and Testletnames from folder cypress/fixtures
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Booklet.xml', { force: true })
      .wait(1000);
    cy.contains('did already exist')
      .should('exist');
  });

  it('should be not possible to load a Booklet with different names and same Booklet-ID', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    cy.wait(1000);
    // load a prepared Booklet with different name and same Booklet-ID from folder cypress/fixtures
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Booklet.xml', { force: true })
      .wait(1000);
    // load a prepared Booklet with different name and same Booklet-ID from folder cypress/fixtures
    cy.get('.sidebar > input:nth-child(2)')
      .selectFile('cypress/fixtures/Booklet_sameBookletID.xml', { force: true })
      .wait(1000);
    cy.contains('Duplicate Booklet-Id')
      .should('exist');
  });

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
