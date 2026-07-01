import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

// TODO check presentation-complete hier wieder aktivieren (skip entfernen), wenn stabil headless läuft
/*
presentation/response-complete machen die Tests headless instabil.
Daher sollen diese Funktionen nur noch in einem Test getestet werden.
Das erfolgt nun in Test-Controller/Nav-Restriction. Wenn dauerhaft Stabilität
gewährleistet werden kann, können Tests auch hier wieder aktiviert werden.
Dazu im verwendeten Booklet presentation-/response-complete ON setzen!
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
    loginTestTaker('Bklt_Config-5', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
  });

  it('OFF (default): backward', () => {
    loginTestTaker('Bklt_Config-5', '123');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe1');
  });

  it('ON: forward', () => {
    loginTestTaker('Bklt_Config-6', '123');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
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
    cy.contains('Aufgabe2');
  });

  it('ON: backward', () => {
    loginTestTaker('Bklt_Config-6', '123');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    //wait for response complete
    cy.wait(2000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.contains('Aufgabe2');
    cy.get('[data-cy="unit-navigation-backward"]')
      .click();
    cy.contains('Aufgabe darf nicht verlassen werden')
      .should('not.exist');
    cy.contains('Aufgabe1');
  });

  it('ALWAYS: forward', () => {
    loginTestTaker('Bklt_Config-7', '123');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
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
      .contains('Aufgabe2');
  });

  it('ALWAYS: backward', () => {
    loginTestTaker('Bklt_Config-7', '123');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
    //wait for response complete
    cy.wait(2000);
    cy.get('[data-cy="page-navigation-forward"]')
      .click();
    //wait for presentation-complete
    cy.wait(2000);
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    getFromIframe('iframe.unitHost')
      .find('[data-cy="TestController-radio1-Aufg1"]')
      .click()
      .should('be.checked');
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
      .contains('Aufgabe1');
  });
});

