import {
  backwardsTo, cleanUp,
  disableSimplePlayersInternalDebounce,
  expectUnitMenuToBe,
  forwardTo,
  getFromIframe,
  loginTestTaker,
  logoutTestTakerHot,
  probeBackendApi,
  resetBackendData, visitLoginPage
} from '../utils';

describe('check adaptive functionality', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
    visitLoginPage();
  });

  beforeEach(disableSimplePlayersInternalDebounce);

  it('start adaptive booklet with predefined states', () => {
    loginTestTaker('test', 'user123', 'code-input');
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
    cy.wait(1000);
    forwardTo('Ⓑ Advanced Unit');
    expectUnitMenuToBe(['decision-unit', 'advanced-unit']);
  });

  it('start adaptive booklet with predefined states', () => {
    logoutTestTakerHot();
    visitLoginPage();
    loginTestTaker('test-review', 'user123', 'starter');
    cy.get('[data-cy="booklet-BOOKLET.SAMPLE-2#bonus:yes"]')
      .click();
    expectUnitMenuToBe(['decision-unit', 'beginner-unit', 'bonus-unit']);
  });

  it('show options to select the booklet states and overwrite calculated state', () => {
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
