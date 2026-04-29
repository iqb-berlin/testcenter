// TODO better selectors
// TODO test different network-measurements
// TODO mock backend responses for networktest to speed up things
// TODO test sending of a report

import {
  loginSuperAdmin,
  openWorkspace,
  probeBackendApi,
  resetBackendData,
  selectFromDropdown,
  visitLoginPage,
  twoStepLogin,
  deleteTesttakersFiles, logoutAdmin, logout
} from '../utils';

describe('Sys-Check', () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(visitLoginPage);

  it('if an SC-login is configured, no SC button must be present', () => {
    cy.get('[data-cy="general-sys-check"]')
      .should('not.exist');
  });

  it('show the starter page, there is more than 1 syscheck-file in workspace', () => {
    twoStepLogin('sys-check', '');
    cy.get('[data-cy*="syscheck"]')
      .should('have.length', 2);
  });

  it('run and complete a system-check via SC-Login', () => {
    twoStepLogin('sys-check', '');
    cy.get('[data-cy="syscheck-SYSCHECK-2"]')
      .click();
    cy.get('#syscheck-next-step')
      .click();
    cy.contains('Bitte prüfen Sie die folgenden Aufgaben-Elemente');
    cy.get('#syscheck-next-step')
      .click();
    cy.get('[data-cy="input-name"]')
      .type('Test-Input1');
    selectFromDropdown('Auswahl', 'Option A');
    cy.get('[data-cy="textarea"]')
      .type('Test-Input2');
    cy.get('[data-cy="checkbox"]')
      .click();
    cy.get('[data-cy="Option B"]')
      .find('label')
      .click();
    cy.get('#syscheck-next-step')
      .click();
    cy.contains('Eingabefeld: Test-Input1');
    cy.contains('Auswahl: Option A');
    cy.contains('Eingabebereich: Test-Input2');
    cy.contains('Kontrollkästchen: true');
    cy.contains('Optionsfelder: Option B');
    cy.get('[data-cy="send sc-report"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Bericht gespeichert');
    cy.get('[data-cy="dialog-confirm"]')
      .click();
  });

  it('to save a report all required fields must be filled out', () => {
    twoStepLogin('sys-check', '');
    cy.get('[data-cy="syscheck-SYSCHECK-2"]')
      .click();
    cy.get('#syscheck-next-step')
      .click();
    cy.contains('Bitte prüfen Sie die folgenden Aufgaben-Elemente');
    cy.get('#syscheck-next-step')
      .click();
    cy.get('#syscheck-next-step')
      .click();
    cy.contains('Bitte prüfen Sie die Eingaben (unvollständig)');
  });

  it('dont display the starter page if there is only 1 syscheck-file in workspace', () => {
    loginSuperAdmin();
    openWorkspace('workspace-card-sample_workspace', 1);
    cy.get('[data-cy="files-checkbox-SYSCHECK.SAMPLE"]')
      .click();
    cy.get('[data-cy="delete-files"]')
      .click();
    cy.get('[data-cy="dialog-confirm"]')
      .click();
    logoutAdmin();
    visitLoginPage();
    twoStepLogin('sys-check', '');
    cy.get('#syscheck-next-step');
  });

  // todo ui/ux - dont understand how this worked before - we cannot seem to get the getSysCheckMode from the testDb
  it.skip('a global system-check button must be visible, if there is no sc-login in TT', () => {
    loginSuperAdmin();
    openWorkspace('workspace-card-sample_workspace', 1);
    deleteTesttakersFiles(1);
    cy.get('[data-cy="logo"]')
      .click();
    openWorkspace('workspace-card-second_workspace', 2);
    deleteTesttakersFiles(2);
    cy.get('[data-cy="logo"]')
      .click();
    logout();
    cy.window().then((win) => {
      win.location.href = 'about:blank'
    });
    cy.visit(`${Cypress.config().baseUrl}/#/r/admin-login?testMode=true`);
    cy.get('[data-cy="general-sys-check"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/check-starter`);
  });
});
