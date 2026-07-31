import {
  backwardsTo,
  cleanUp,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  getFromIframe,
  twoStepLogin,
  probeBackendApi,
  resetBackendData,
  visitLoginPage,
  clickCardButton, loginTestTaker
} from '../utils';

describe('check adaptive functionality', () => {
  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
  });

  beforeEach(() => {
    disableSimplePlayersInternalDebounce();
    visitLoginPage();
  })

  it('start adaptive booklet with predefined states', () => {
    loginTestTaker('Adap-1', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Decision Unit');
    cy.get('[data-cy="unit-navigation-forward"]')
      .click();
    cy.get('[data-cy="unit-title"]')
      .contains('Ⓐ Beginner Unit');
  });

  it('adapt on the basis of values', () => {
    loginTestTaker('Adap-1', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Decision Unit');
    getFromIframe('iframe.unitHost')
      .find('#var3')
      .type('3');
    getFromIframe('iframe.unitHost')
      .find('#var4')
      .type('3');
   forwardTo('Ⓒ Professional Unit');
  });

  it('adapt on the basis of results of the autocoder', () => {
    loginTestTaker('Adap-1', '123');
    cy.get('[data-cy="unit-title"]')
      .contains('Decision Unit');
    getFromIframe('iframe.unitHost')
      .find('#var3')
      .type('3');
    getFromIframe('iframe.unitHost')
      .find('#var4')
      .type('3');
    forwardTo('Ⓒ Professional Unit');
    backwardsTo('Decision Unit');
    getFromIframe('iframe.unitHost')
      .find('#var1')
      .type('a');
    getFromIframe('iframe.unitHost')
      .find('#var2')
      .type('anything');
    getFromIframe('iframe.unitHost')
      .find('#var3')
      .clear();
    getFromIframe('iframe.unitHost')
      .find('#var4')
      .clear();
    cy.wait(1000);
    forwardTo('Ⓑ Advanced Unit');
  });

  it('start adaptive booklet with predefined states in review-mode', () => {
    twoStepLogin('Adap-2', '123');
    clickCardButton('booklet-CY-BKLT_ADAP-1#bonus:yes');
    cy.get('[data-cy="unit-title"]')
      .contains('Decision Unit');
    forwardTo('Ⓐ Beginner Unit');
    forwardTo('Ⓧ Bonus Unit');
  });

  it('Add booklet state selection in review-mode (overrides calculated state)', () => {
    twoStepLogin('Adap-2', '123');
    clickCardButton('booklet-CY-BKLT_ADAP-1#bonus:yes');
    cy.get('[data-cy="unit-menu"]')
      .click();
    cy.get('[data-cy="unit-menu-unitbutton-Ⓧ Bonus Unit"]')
    cy.get('mat-select[data-cy="select-booklet-state:bonus"]')
      .click()
      .then(() => cy.get('mat-option[data-cy="select-booklet-state:bonus:no"]').click());
    cy.get('[data-cy="unit-menu-unitbutton-Ⓧ Bonus Unit"]')
      .should('not.exist');
    cy.get('[data-cy="unit-menu-unitbutton-Ⓐ Beginner Unit"]')
    cy.get('mat-select[data-cy="select-booklet-state:level"]')
      .click()
      .then(() => cy.get('mat-option[data-cy="select-booklet-state:level:advanced"]').click());
    cy.get('[data-cy="unit-menu-unitbutton-Ⓑ Advanced Unit"]')
  });
});
