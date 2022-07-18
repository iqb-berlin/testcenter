// TODO better selectors
// TODO test different network-measurements
// TODO mock backend responses for networktest to speed up things
// TODO test sending of a report

import { resetBackendData } from './utils.cy';

describe('Sys-Check', () => {
  beforeEach(resetBackendData);
  it('should exist', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('System-Check Auswahl')
      .should('exist');
    cy.contains('An example SysCheck definition')
      .should('exist');
  });

  it('Run through the whole system-check', () => {
    cy.visit(`${Cypress.config().baseUrl}/#/r/check-starter`);
    cy.contains('An example SysCheck definition')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/w`);
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/n`);
    cy.contains('Netzwerk')
      .should('exist');
    cy.get('#syscheck-previous-step')
      .should('be.visible');
    cy.contains('Die folgenden Netzwerkeigenschaften wurden festgestellt: Ihre Verbindung zum Testserver ist gut.', { timeout: 30000 });
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/u`);
    cy.contains('Bitte prüfen Sie die folgenden Aufgaben-Elemente');
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/q`);
    cy.get('#\\32')
      .type('Test-Input1');
    cy.get('.mat-select-arrow')
      .click()
      .get('#mat-option-0 > span:nth-child(1)')
      .click();
    cy.get('#\\34')
      .type('Test-Input2');
    cy.get('.mat-checkbox-inner-container')
      .click();
    cy.get('#mat-radio-3 > label:nth-child(1) > span:nth-child(1)')
      .click();
    cy.get('button.mat-focus-indicator:nth-child(3)')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/check/1/SYSCHECK.SAMPLE/r`);
    cy.contains(' Name: Test-Input1 ');
    cy.contains(' Who am I?: Harvy Dent ');
    cy.contains(' Why so serious?: Test-Input2 ');
    cy.contains(' Check this out: true ');
    cy.contains(' All we here is: Radio Gugu ');
    cy.contains('System-Check Abbrechen')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/check-starter`);
  });
});
