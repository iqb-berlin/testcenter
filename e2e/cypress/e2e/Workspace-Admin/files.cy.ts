import {
  deleteDownloadsFolder,
  deleteFilesSampleWorkspace,
  loginSuperAdmin,
  logoutAdmin,
  openSampleWorkspace,
  resetBackendData,
  useTestDB,
  visitLoginPage
} from '../utils';

describe('Workspace-Admin-files', () => {
  beforeEach(deleteDownloadsFolder);
  beforeEach(resetBackendData);
  beforeEach(useTestDB);
  beforeEach(visitLoginPage);
  beforeEach(loginSuperAdmin);
  beforeEach(() => openSampleWorkspace(1));

  afterEach(logoutAdmin);

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

  it('should be possible to delete the syscheck.xml file, there are no dependencies on other files.', () => {
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

  it('should not be possible to delete SAMPLE_BOOKLET.XML, there is a dependency in SAMPLE_TESTTAKERs.XML', () => {
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
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
    cy.contains('1 Dateien werden von anderen verwendet und wurden nicht gelöscht.')
      .should('exist');
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .should('exist');
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .click();
  });

  it('should be possible to delete SAMPLE_BOOKLET.XML, if SAMPLE_TESTTAKERs.XML was previously deleted', () => {
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
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
    cy.contains('1 Dateien erfolgreich gelöscht.')
      .should('exist');
    cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
      .should('not.exist');
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
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
    cy.contains('1 Dateien erfolgreich gelöscht.')
      .should('exist');
    cy.get('[data-cy="SAMPLE_BOOKLET.XML"]')
      .should('not.exist');
  });

  it('should be possible to upload any file as a resource', () => {
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/AnyResource.txt', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.contains('AnyResource.txt')
      .should('exist');
  });

  it('should be not possible to upload a Testtaker, Booklet, Unit or SysCheck file with the right root but w', () => {
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Testtakers_error.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet_error.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Unit_error.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/SysCheck_error.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
  });

  it('should be possible to upload the file SysCheck.xml without any dependencies in other files', () => {
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
    cy.contains('1 Dateien erfolgreich gelöscht.')
      .should('exist');
    cy.get('[data-cy="SAMPLE_SYSCHECK.XML"]')
      .should('not.exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/SysCheck.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.reload(true);
    cy.get('mat-table >mat-row button >span')
      .contains('SysCheck.xml')
      .should('exist');
  });

  it('should only be possible to upload a unit file, if the player file already exists.', () => {
    deleteFilesSampleWorkspace();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
      .should('not.exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/verona-player-simple-6.0.html', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
      .should('exist');
  });

  it('should only be possible to upload a unit file and it\'s dependencies at once', () => {
    deleteFilesSampleWorkspace();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile([
        '../sampledata/Unit.xml',
        '../sampledata/verona-player-simple-6.0.html',
        '../sampledata/SAMPLE_UNITCONTENTS.HTM'
      ],
      { force: true }
      );
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]')
      .should('exist');
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]')
      .should('exist');
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
      .should('exist');
  });

  it('should only be possible to upload a booklet file, if the declared unit files already exist', () => {
    deleteFilesSampleWorkspace();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/verona-player-simple-6.0.html', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/sample_resource_package.itcr.zip', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_RESOURCE_PACKAGE.ITCR.ZIP"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .should('not.exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Unit2.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE-2"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .should('exist');
  });

  it('should only be possible to upload a testtaker file, if the declared booklet files already exist', () => {
    deleteFilesSampleWorkspace();
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/verona-player-simple-6.0.html', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-VERONA-PLAYER-SIMPLE-6.0"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/SAMPLE_UNITCONTENTS.HTM', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_UNITCONTENTS.HTM"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/sample_resource_package.itcr.zip', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_RESOURCE_PACKAGE.ITCR.ZIP"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Unit.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Unit2.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-UNIT.SAMPLE-2"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .should('not.exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet2.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-2"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet3.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-3"]')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Testtakers.xml', { force: true });
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-TESTTAKERS.XML"]')
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
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.contains('2 Dateien erfolgreich gelöscht.')
      .should('exist');
    // load a prepared Booklet-File from folder cypress/fixtures
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet_sameTestlets.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('testletId')
      .should('exist'); // TODO should be more precise
    cy.get('[data-cy="close-upload-report"]')
      .click();
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
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.contains('2 Dateien erfolgreich gelöscht.')
      .should('exist');
    // load a prepared Booklet-File from folder cypress/fixtures
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet_sameUnitIDs.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('Unit')
      .should('exist'); // TODO should be more precise
    cy.get('[data-cy="Booklet_sameUnitIDs.xml"]')
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
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.contains('2 Dateien erfolgreich gelöscht.')
      .should('exist');
    // load a prepared Booklet-File from folder cypress/fixtures
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet_sameUnitIDs_Alias.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
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
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.contains('2 Dateien erfolgreich gelöscht.')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    // load the same booklet file again
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('overwritten')
      .should('exist'); // TODO should be more precise
    cy.get('[data-cy="close-upload-report"]')
      .click();
    cy.get('[data-cy="files-checkbox-BOOKLET.SAMPLE-1"]')
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
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.contains('2 Dateien erfolgreich gelöscht.')
      .should('exist');
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('../sampledata/Booklet.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    // load a prepared Booklet with same name, but different ID and Testletnames from folder cypress/fixtures
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
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
    cy.get('[data-cy="dialog-title"]')
      .should('exist')
      .contains('Löschen von Dateien');
    cy.get('[data-cy="dialog-confirm"]')
      .should('exist')
      .contains('Löschen')
      .click();
    cy.contains('2 Dateien erfolgreich gelöscht.')
      .should('exist');
    // load a prepared Booklet with different name and same Booklet-ID from folder cypress/fixtures
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet.xml', { force: true });
    cy.contains('Erfolgreich hochgeladen')
      .should('exist');
    cy.get('[data-cy="close-upload-report"]')
      .click();
    // load a prepared Booklet with different name and same Booklet-ID from folder cypress/fixtures
    cy.get('[data-cy="uplaod-file-select"]')
      .selectFile('cypress/fixtures/Booklet_sameBookletID.xml', { force: true });
    cy.contains('Abgelehnt')
      .should('exist');
    cy.contains('Duplicate Booklet-Id')
      .should('exist');
  });
});
