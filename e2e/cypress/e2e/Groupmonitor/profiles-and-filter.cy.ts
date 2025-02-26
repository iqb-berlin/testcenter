import {
  loginMonitor, resetBackendData, visitLoginPage
} from '../utils';

describe('Group-Monitor User', () => {
  before(() => {
    resetBackendData();
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  beforeEach(() => {
    visitLoginPage();
    loginMonitor('test-group-monitor-2', 'user123');
  });

  it('should be displayed a group-monitor with 2 profiles for selection ', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .contains('Alles zeigen');
    cy.get('[data-cy="GM-sample_group-1"]')
      .contains('Superklein');
  });

  it('should be set the view that configured in the small profile', () => {
    cy.get('[data-cy="GM-sample_group-1"]')
      .click();
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_activity_button"]')
      .click();
    cy.get('[data-cy="GM_view_checked_small"]')
      .click();
  });

  it('should be only visible the configured columns in small profile', () => {
    cy.get('[data-cy="GM-sample_group-1"]')
      .click();
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_columns_button"]')
      .click();
    cy.get('[data-cy="GM_columns_checked_group"]')
      .should('not.exist');
    cy.get('[data-cy="GM_columns_checked_booklet"]')
      .should('not.exist');
    cy.get('[data-cy="GM_columns_checked_block"]')
      .should('not.exist');
    cy.get('[data-cy="GM_columns_checked_unit"]')
      .should('not.exist');
    // The menu must be closed because all other elements are hidden and cypress can no longer find them.
    cy.get('[data-cy="GM_column_group_button"]')
      .click();
  });

  it('should be possible to set the filter from small-profile', () => {
    cy.get('[data-cy="GM-sample_group-1"]')
      .click();
    cy.contains('test/xxx')
      .should('not.exist');
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_filter_button"]')
      .click();
    cy.contains('Reduced Booklet')
      .click();
    cy.contains('test/xxx');
  });

  it('should be set the view that configured in the full profile', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_activity_button"]')
      .click();
    cy.get('[data-cy="GM_view_checked_full"]')
      .click();
  });

  it('should be only visible the configured columns in full profile', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_columns_button"]')
      .click();
    cy.get('[data-cy="GM_columns_checked_group"]');
    cy.get('[data-cy="GM_columns_checked_booklet"]');
    cy.get('[data-cy="GM_columns_checked_block"]');
    cy.get('[data-cy="GM_columns_checked_unit"]');
    cy.get('[data-cy="GM_columns_state_button-0"]')
      .contains('Bonusmaterial');
    cy.get('[data-cy="GM_columns_state_button-1"]')
      .contains('Schwierigkeitsstufe');
    cy.get('[data-cy="GM_columns_checked_state-0"]');
    cy.get('[data-cy="GM_columns_checked_state-1"]');
    // The menu must be closed because all other elements are hidden and cypress can no longer find them.
    cy.get('[data-cy="GM_column_group_button"]')
      .click();
  });

  it('should not be visible the filter from small-profile', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_filter_button"]')
      .click();
    cy.contains('Reduced Booklet')
      .should('not.exist');
    // The menu must be closed because all other elements are hidden and cypress can no longer find them.
    cy.get('[data-cy="GM_filter_option_button-0"]')
      .click();
  });

  it('should be visible to greate a new  filter', () => {
    cy.get('[data-cy="GM-sample_group-0"]')
      .click();
    cy.get('[data-cy="GM_setting_button"]')
      .click({ force: true });
    cy.get('[data-cy="GM_filter_button"]')
      .click();
    cy.get('[data-cy="GM_add_filter_button"]')
      .click();
    cy.get('[data-cy="GM_filtersetting_field"]')
      .click();
    cy.contains('Booklettitel')
      .click();
    cy.wait(1000);
    cy.get('[data-cy="comment-diag-value"]')
      .click()
      .type('Sample booklet');
    cy.get('[data-cy="comment-diag-title"]')
      .click();
    cy.get('[data-cy="comment-diag-submit"]')
      .click();
    cy.contains('Sample booklet')
      .should('not.exist');
  });
});
