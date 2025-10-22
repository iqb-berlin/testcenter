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

describe('check DenyNavigationOnIncomplete', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      resetBackendData();
    });

  describe('response-/presentation-complete = OFF', { testIsolation: false }, () => {
    before(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      probeBackendApi();
      loginTestTaker('NavRestrVal1', '123', mode);
    });

    it('click logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

   it('navigation forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
     cy.get('[data-cy="unit-title"]')
       .contains('Aufgabe2');
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
    });

    it('navigation backward', () => {
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
    });
  });

  describe('response-/presentation-complete = ON ', { testIsolation: false }, () => {
    before(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
      probeBackendApi();
      loginTestTaker('NavRestrVal2', '123', mode);
    });

    it('presentation-complete click Logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('response-complete click Logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

   it('presentation-complete navigation forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
     cy.get('[data-cy="dialog-content"]')
       .should('not.contain', 'abgespielt');
     cy.get('[data-cy="dialog-confirm"]')
       .click();
    });

    it('response-complete navigation forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2');
    });

    it('response-complete navigation backward', () => {
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

    it('presentation-complete navigation backward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2');
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

  });

  describe('response-/presentation-complete = ALWAYS ', { testIsolation: false }, () => {
    before(() => {
      disableSimplePlayersInternalDebounce();
      cy.clearLocalStorage();
      cy.clearCookies();
      probeBackendApi();
      loginTestTaker('NavRestrVal3', '123', mode);
    });

    it('presentation-complete click Logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('response-complete click Logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('presentation-complete navigation forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .should('not.contain', 'abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('responses-complete navigation forward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2');
    });

    it('presentation-complete navigation backward', () => {
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .should('not.contain', 'abgespielt');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
    });

    it('response-complete navigation backward', () => {
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="dialog-content"]')
        .contains('bearbeitet');
      cy.get('[data-cy="dialog-confirm"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });
  });
});

