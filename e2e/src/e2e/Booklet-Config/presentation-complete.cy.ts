import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

// TODO check presentation-complete hier wieder aktivieren (skip entfernen), wenn stabil headless läuft
/*
presentation/response-complete machen die Tests headless instabil.
Daher sollen diese Funktionen nur noch in einem Test getestet werden.
Das erfolgt nun in Test-Controller/Nav-Restriction. Wenn dauerhaft Stabilität
gewährleistet werden kann, können Tests auch hier wieder aktiviert werden.
*/

describe.skip('check parameter: presentation-complete', { testIsolation: true }, () => {
  before(() => {
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  });

  it('OFF (default): forward', () => {
    loginTestTaker('Bklt_Config-1', '123', mode);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
  });

  it('OFF (default): backward', () => {
    loginTestTaker('Bklt_Config-1', '123', mode);
    cy.get('[data-cy="unit-navigation-forward"]');
    cy.get('[data-cy="unit-navigation-backward"]');
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('ON: forward', () => {
    loginTestTaker('Bklt_Config-2', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(2000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .should('be.visible')
      .click();
    cy.contains('mat-dialog-container', 'abgespielt')
      .find('[data-cy="dialog-confirm"]')
      .click();
    cy.contains('Aufgabe1');
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .should('be.visible')
      .click();
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.contains('Aufgabe2');
  });

  it('ON: backward', () => {
    loginTestTaker('Bklt_Config-2', '123', mode);
    cy.contains('mat-dialog-container', 'Vollbild')
      .find('[data-cy="dialog-cancel"]')
      .click();
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(2000);
    getFromIframe('[data-cy="next-unit-page"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
      .should('be.visible')
      .click();
    cy.contains('Aufgabe2');
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
      .should('be.visible')
      .click();
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.contains('Aufgabe1');
  });

  it('ALWAYS: forward', () => {
    loginTestTaker('Bklt_Config-3', '123', mode);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.contains('mat-dialog-container', 'abgespielt')
      .find('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2')
  });

  it('ALWAYS: backward', () => {
    loginTestTaker('Bklt_Config-3', '123', mode);
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(2000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2')
    getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
      .click();
    //wait for response complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.contains('mat-dialog-container', 'abgespielt')
      .find('[data-cy="dialog-confirm"]')
      .click();
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1')
  });
});







