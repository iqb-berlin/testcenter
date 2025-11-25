/* How its work: https://iqb-berlin.github.io/tba-info/intro/install/e2e.html section: Booklet-Config: */

import {
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

const mode = 'test-hot';

describe('check LockAfterLeaving: confirm: true & scope = unit', { testIsolation: true }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
    loginTestTaker('RestrLockAfterLeave1', '123', mode);
  });

  it('leave unit: display a warning message', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .contains('Aufgabe verlassen?');
  });

  it('leave unit: lock unit', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-cancel"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.get('[data-cy="unit-navigation-backward"]')
      .should('have.attr', 'aria-disabled', 'true');
  });
});

describe('check LockAfterLeaving: confirm: false & scope = testlet', { testIsolation: true }, () => {
  before(() => {
    disableSimplePlayersInternalDebounce();
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
    loginTestTaker('RestrLockAfterLeave2', '123', mode);
  });

  it('leave testlet: display no warning message', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
      cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="dialog-title"]')
      .should('not.exist');
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
  });

  it('leave testlet: lock testlet', () => {
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe2');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Endseite');
    cy.get('[data-cy="unit-navigation-backward"]')
      .should('have.attr', 'aria-disabled', 'true');
  });
});