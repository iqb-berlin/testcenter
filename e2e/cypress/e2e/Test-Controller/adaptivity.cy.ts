import {
  backwardsTo,
  disableSimplePlayersInternalDebounce,
  expectUnitMenuToBe, forwardTo, getFromIframe,
  loginTestTaker,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('Adaptive Testcontroller', { testIsolation: false }, () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    visitLoginPage();
    loginTestTaker('test', 'user123', 'code-input');
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should start adaptive booklet with predefined states', () => {
    cy.get('[formcontrolname="code"]')
      .type('xxx');
    cy.get('[data-cy="continue"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-2"]')
      .click();
    expectUnitMenuToBe(['decision-unit', 'beginner-unit']);
  });

  it('adapt on the basis of values', () => {
    getFromIframe('#var3')
      .type('3');
    getFromIframe('#var4')
      .type('3');
    forwardTo('Ⓒ Professional Unit');
    expectUnitMenuToBe(['decision-unit', 'professional-unit']);
  });

  it('adapt on the basis of results of the autocoder', () => {
    backwardsTo('Decision Unit');
    getFromIframe('#var1')
      .type('a');
    getFromIframe('#var2')
      .type('anything');
    getFromIframe('#var3')
      .clear();
    getFromIframe('#var4')
      .clear();
    forwardTo('Ⓑ Advanced Unit');
    expectUnitMenuToBe(['decision-unit', 'advanced-unit']);
  });
});

describe.only('Adaptive Testcontroller in reviewMode', { testIsolation: false }, () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
    visitLoginPage();
    loginTestTaker('test-review', 'user123', 'starter');
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('should start adaptive booklet with predefined states', () => {
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-2#bonus:yes"]')
      .click();
    expectUnitMenuToBe(['decision-unit', 'beginner-unit', 'bonus-unit']);
  });

  it('should show options to select the booklet states and overwrite calculated state', () => {
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('mat-select[data-cy="select-booklet-state:bonus"]')
      .click()
      .then(() => cy.get('mat-option[data-cy="select-booklet-state:bonus:no"]').click());
    expectUnitMenuToBe(['decision-unit', 'beginner-unit']);
    cy.get('mat-select[data-cy="select-booklet-state:level"]')
      .click()
      .then(() => cy.get('mat-option[data-cy="select-booklet-state:level:advanced"]').click());
    expectUnitMenuToBe(['decision-unit', 'advanced-unit']);
  });
});