import {
  cleanUp,
  disableSimplePlayersInternalDebounce,
  forwardTo,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('check calculator position in booklet', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
    visitLoginPage();
    disableSimplePlayersInternalDebounce();
    loginTestTaker('Wdgt-1', '123');
  });

  it('first unit: there is no calculator', () => {
    cy.get('[data-cy="unit-title"]')
      .contains('Aufgabe 1');
    cy.get('[data-cy="toolbar-widget"]')
      .should('not.exist');
  });

  it('second unit: there is a calculator inherited from testlet', () => {
    forwardTo('Aufgabe 2');
    cy.get('[data-cy="toolbar-widget"]')
      .should('exist');
  });

  it('third unit: there is a calculator', () => {
    forwardTo('Aufgabe 3');
    cy.get('[data-cy="toolbar-widget"]')
      .should('exist');
  });

  it('fourth unit: there is no calculator', () => {
    forwardTo('Aufgabe 4');
    cy.get('[data-cy="toolbar-widget"]')
      .should('not.exist');
  });

});
