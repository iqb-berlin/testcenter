import {
  insertCredentials, resetBackendData, visitLoginPage, loginMonitor
} from '../utils';

describe('Check Login Possibilities', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    resetBackendData();
  });

  beforeEach(() => {
    visitLoginPage();
    loginMonitor('test-group-monitor-2', 'user123');
  });

  it('should be possible to start a group monitor', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.contains('test/xxx');
    cy.contains('test/yyy');
  });

  // Funktion der Schalter muss geprüft werden, wenn GM-Tests ausgebaut sind
  it('should be visible all test takers control buttons in the first group-monitor', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.get('[data-cy="GM_control_all_tests"]');
    cy.get('[data-cy="GM_jump_button"]');
    cy.get('[data-cy="GM_lock_button"]');
    cy.get('[data-cy="GM_forward_button"]');
    cy.get('[data-cy="GM_pause_button"]');
    cy.get('[data-cy="GM_end_button"]');
  });

  // Funktion der Schalter muss geprüft werden, wenn GM-Tests ausgebaut sind
  it('should be possible to control separated TT ', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.get('[data-cy="GM_control_all_tests"]')
      .click();
    cy.get('[data-cy="GM-tt-checkbox"]');
  });
});
