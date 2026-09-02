import {
  cleanUp,
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendTestData,
  visitLoginPage
} from '../utils';

describe('check response & presentation from booklet-config', { testIsolation: false }, () => {

  before(() => {
    cleanUp();
    resetBackendTestData();
    probeBackendApi();
  });

  describe(' DenyNavigationOnIncomplete and booklet-config must be independent from each other.', { testIsolation: false }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-23', '123');
    });

    it('presentation/response-complete have to be OFF in booklet-config', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
      //wait
      cy.wait(1000);
    });

    it('presentation/response-complete have to be ON in testlet', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt')
        .and('contain', 'bearbeitet');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
       .contains('Aufgabe1');
      cy.get('[data-cy="unit-navigation-backward"]')
       .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt')
        .and('contain', 'bearbeitet');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
       .contains('Aufgabe1');
    });
  });

  describe('response & presentation = OFF', { testIsolation: true }, () => {

    beforeEach(() => {
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-24', '123');
    });

    it('presentation/response-complete: forward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
    });

   it('presentation/response-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="dialog-cancel"]')
        .click();
    });

    it('presentation/response-complete: forward/backward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });
  });

  describe('response & presentation = ON ', { testIsolation: true }, () => {

    beforeEach(() => {
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      loginTestTaker('Test_Ctrl-25', '123');
    });

    it('presentation-complete: forward in unit-menu', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      getFromIframe('iframe.unitHost')
        .find('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      //wait for response complete
      cy.wait(1000);
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt')
        .and('not.contain', 'bearbeitet');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt')
        .and('not.contain', 'bearbeitet');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: forward/backward', () => {
      getFromIframe('iframe.unitHost')
        .find('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      //wait for response complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt')
        .and('not.contain', 'bearbeitet');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
    });

    it('responses-complete: forward/backward', () => {
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click()
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'bearbeitet')
        .and('not.contain', 'abgespielt');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('iframe.unitHost')
        .find('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      //wait for response complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
    });
  });

  describe('response & presentation = ALWAYS ', { testIsolation: true }, () => {

    beforeEach(() => {
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
    });

    it('presentation-complete: forward/backward in unit-menu', () => {
      loginTestTaker('Test_Ctrl-26a', '123');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      //wait for presentation complete
      cy.wait(1000);
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(1000);
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2');
      //wait for presentation-complete
      cy.wait(1000);
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt');
    });

    it('presentation-complete: logo', () => {
      loginTestTaker('Test_Ctrl-26a', '123');
      cy.get('[data-cy="logo"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'abgespielt');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('responses-complete: forward/backward', () => {
      loginTestTaker('Test_Ctrl-26b', '123');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      //wait for presentation-complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'bearbeitet');
      cy.get('[data-cy="close-deny-navigation-message"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      getFromIframe('iframe.unitHost')
        .find('[data-cy="TestController-radio1-Aufg1"]')
        .click()
        .should('be.checked');
      //wait for response complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2');
      //wait for presentation complete
      cy.wait(1000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.get('[data-cy="deny-navigation-message"]')
        .should('contain', 'bearbeitet');
    });
  });
});


