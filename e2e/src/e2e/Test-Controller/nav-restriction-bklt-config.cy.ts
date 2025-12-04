import {
  cleanUp,
  disableSimplePlayersInternalDebounce,
  getFromIframe,
  loginTestTaker,
  probeBackendApi,
  resetBackendData,
  visitLoginPage
} from '../utils';

describe('check response & presentation from booklet-config', { testIsolation: false }, () => {

  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
  });

  describe(' DenyNavigationOnIncomplete and booklet-config must be independent from each other.', { testIsolation: false }, () => {
    before(() => {
      cleanUp();
      visitLoginPage();
      loginTestTaker('Test_Ctrl-23', '123');
    });

    beforeEach(disableSimplePlayersInternalDebounce);

   it('presentation/response-complete have to be OFF in booklet-config', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1');
    });

   it('presentation/response-complete have to be ON in testlet', () => {
     cy.get('[data-cy="unit-navigation-forward"]')
        .click();
     cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
       .find('[data-cy="dialog-confirm"]')
       .click();
     cy.get('[data-cy="unit-title"]')
       .contains('Aufgabe1');
     cy.get('[data-cy="unit-navigation-backward"]')
       .click();
     cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
       .find('[data-cy="dialog-confirm"]')
       .click();
     cy.get('[data-cy="unit-title"]')
       .contains('Aufgabe1');
    });
  });

  describe('response & presentation = OFF', { testIsolation: true }, () => {

    beforeEach(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker('Test_Ctrl-24', '123');
    });

    it('presentation/response-complete: forward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
    });

    it('presentation/response-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="endTest-1"]');
    });

    it('presentation/response-complete: forward/backward', () => {
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });
  });

  describe('response & presentation = ON ', { testIsolation: true }, () => {

    beforeEach(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker('Test_Ctrl-25', '123');
    });

    it('presentation-complete: forward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: forward/backward', () => {
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
        .contains('Aufgabe1')
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
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
    });

    it('responses-complete: forward/backward', () => {
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click()
      cy.contains('mat-dialog-container', 'bearbeitet')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
    });
  });

  describe('response & presentation = ALWAYS ', { testIsolation: true }, () => {

    beforeEach(() => {
      disableSimplePlayersInternalDebounce();
      visitLoginPage();
      loginTestTaker('Test_Ctrl-26', '123');
    });

    it('presentation-complete: forward/backward in unit-menu', () => {
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(2000);
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe2"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="unit-menu"]')
        .click();
      cy.get('[data-cy="unit-menu-unitbutton-Aufgabe1"]')
        .click();
      cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
    });

    it('presentation-complete: logo', () => {
      cy.get('[data-cy="logo"]')
        .click();
      cy.contains('mat-dialog-container', 'Aufgabe darf nicht verlassen werden')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('presentation-complete: forward/backward', () => {
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
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
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
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation-complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });

    it('responses-complete: forward/backward', () => {
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-forward"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="page-navigation-forward"]')
        .click();
      //wait for presentation complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('mat-dialog-container', 'bearbeitet')
        .find('[data-cy="dialog-confirm"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe2')
      cy.get('[data-cy="page-navigation-backward"]')
        .click();
      getFromIframe('[data-cy="TestController-radio1-Aufg1"]')
        .click();
      //wait for response complete
      cy.wait(2000);
      cy.get('[data-cy="unit-navigation-backward"]')
        .click();
      cy.contains('Aufgabe darf nicht verlassen werden')
        .should('not.exist');
      cy.get('[data-cy="unit-title"]')
        .contains('Aufgabe1')
    });
  });
});


