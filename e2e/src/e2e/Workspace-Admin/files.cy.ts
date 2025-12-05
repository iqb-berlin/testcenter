import {
  deleteDownloadsFolder,
  deleteFilesSampleWorkspace,
  loginSuperAdmin,
  logoutAdmin,
  openSampleWorkspace,
  probeBackendApi,
  reload,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Workspace-Admin-files', () => {
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

  it('download files', () => {
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/SAMPLE_TESTTAKERS.XML`).should('exist');
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/SAMPLE_BOOKLET.XML`).should('exist');
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/SAMPLE_SYSCHECK.XML`).should('exist');
    cy.get('[data-cy="SAMPLE_UNITCONTENTS.HTM"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/SAMPLE_UNITCONTENTS.HTM`).should('exist');
    cy.get('[data-cy="SAMPLE_UNIT2.XML"]')
      .click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/SAMPLE_UNIT2.XML`).should('exist');
  });

  it('delete the syscheck.xml file', () => {
    cy.get('[data-cy="files-checkbox-SYSCHECK.SAMPLE"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .should('not.exist');
  });

  it('delete SAMPLE_BOOKLET.XML is not possible, booklet is declared in tt-xml', () => {
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.contains('1 Dateien werden von anderen verwendet und wurden nicht gelöscht.');
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]');
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
  });

  it('delete SAMPLE_BOOKLET.XML, if tt-xml is deleted before', () => {
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.contains('1 Dateien erfolgreich gelöscht.');
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .should('not.exist');
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.contains('1 Dateien erfolgreich gelöscht.');
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .should('not.exist');
  });

  it('upload any file as a resource', () => {
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/AnyResource.txt`, { force: true });
    cy.contains('Erfolgreich hochgeladen');
    cy.contains('AnyResource.txt');
  });

  it('uploading invalid files is not possible', () => {
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Testtakers_error.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Booklet_error.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Unit_error.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/invalid_SysCheck.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
  });

  it('upload the file SysCheck.xml', () => {
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/SysCheck.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen');
    reload();
    cy.get('mat-table >mat-row button >span')
      .contains('SysCheck.xml');
  });

  it('upload a unit file, the player file must be exists.', () => {
    deleteFilesSampleWorkspace();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
      .should('not.exist');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/verona-player-simple-6.0.html', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/sample_resource_package.itcr.zip', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]');
  });

  it('upload resources files and unit-xml ', () => {
    cy.get('[data-cy="files-checkAll-Unit"]')
      .click();
    cy.get('[data-cy="files-checkAll-Resource"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.contains('erfolgreich gelöscht.');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile([
          '../sampledata/Unit.xml',
          '../sampledata/verona-player-simple-6.0.html',
          '../sampledata/SAMPLE_UNITCONTENTS.HTM',
          '../sampledata/sample_resource_package.itcr.zip'
        ],
        { force: true }
      );
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]');
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]');
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]');
  });

  it('upload a booklet file, if the declared unit files already exist', () => {
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/verona-player-simple-6.0.html', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/sample_resource_package.itcr.zip', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_RESOURCE_PACKAGE.ITCR.ZIP"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .should('not.exist');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/coding-scheme.vocs.json', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Unit2.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE-2"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]');
  });

  it('upload a tt-xml, if the declared booklet files already exist', () => {
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/verona-player-simple-6.0.html', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/sample_resource_package.itcr.zip', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_RESOURCE_PACKAGE.ITCR.ZIP"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/coding-scheme.vocs.json', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Unit2.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE-2"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Abgelehnt');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .should('not.exist');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet2.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-2"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet3.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-3"]');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]');
  });

  it('upload a Booklet-File with 2 Testlets and the same Testlet-Names is not possible', () => {
    // firstly delete the testtakers and booklet, because after Backend-Reset the filenames are different
    cy.get('[data-cy="files-checkAll-Testtakers"]')
      .click();
    cy.get('[data-cy="files-checkAll-Booklet"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.contains('erfolgreich gelöscht.');
    // load a prepared Booklet-File from fixtures folder
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Booklet_sameTestlets.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.contains('testletId');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.contains('Booklet_sameTestlets.xml')
      .should('not.exist');
  });

  it('upload a Booklet-File with 2 Units and the same Unit-IDs is not possible', () => {
    // load a prepared Booklet-File from fixtures folder
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Booklet_sameUnitIDs.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.contains('Unit');
    cy.get('[data-cy="Booklet_sameUnitIDs.xml"]')
      .should('not.exist');
  });

  it('upload a Booklet-File with 2 same Unit-IDs and a unit alias', () => {
    // load a prepared Booklet-File from fixtures folder
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Booklet_sameUnitIDs_Alias.xml`, { force: true });
    cy.contains('Erfolgreich hochgeladen');
    cy.contains('Booklet_sameUnitIDs_Alias.xml');
  });

  it('overwrite a Booklet-File with the same booklet name and booklet-ID', () => {
    cy.get('[data-cy="files-checkAll-Booklet"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .contains('Löschen')
      .click();
    cy.contains('erfolgreich gelöscht.');
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    // load the same booklet file again
    cy.get('[data-cy="upload-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('overwritten');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]');
  });

  it('load a Booklet with the same name, but another ID and testlet name is not possible', () => {
    // load a prepared Booklet with same name, but different ID and Testletnames from fixtures folder
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Booklet.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.contains('did already exist');
  });

  it('load a Booklet with different names and same Booklet-ID is not possible', () => {
    // load a prepared Booklet with different name and same Booklet-ID from fixtures folder
    cy.get('[data-cy="upload-file-select"]')
      .selectFile(`${Cypress.config('fixturesFolder')}/Booklet_sameBookletID.xml`, { force: true });
    cy.contains('Abgelehnt');
    cy.contains('Duplicate Booklet-Id');
  });
});
