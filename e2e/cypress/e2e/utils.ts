import Chainable = Cypress.Chainable;

export const userData = {
  SuperAdminName: 'super',
  SuperAdminPassword: 'user123',
  WorkspaceAdminName: 'workspace_admin',
  WorkspaceAdminPassword: 'anotherPassword'
};

export const credentialsControllerTest = {
  // Restriction Time: Declared in Sampledata/CY_BKL_Mode_Demo.xml
  DemoRestrTime: 60000
};

export const deleteDownloadsFolder = (): void => {
  const downloadsFolder = Cypress.config('downloadsFolder');
  cy.task('deleteFolder', downloadsFolder);
};

export const visitLoginPage = (): Chainable => cy.url()
  .then(url => {
    if (url !== `${Cypress.config().baseUrl}/#/r/login/`) {
      cy.intercept({ url: new RegExp(`${Cypress.env('urls').backend}/(system/config|sys-checks)`) }).as('waitForConfig');
      cy.visit(url.endsWith('starter') ? Cypress.config().baseUrl : `${Cypress.config().baseUrl}/#/r/login/`);
      cy.wait('@waitForConfig');
    }
  });

export const resetBackendData = (): void => {
  cy.request({
    url: `${Cypress.env('urls').backend}/version`,
    headers: { TestMode: 'prepare-integration' }
  })
    .its('status').should('eq', 200);
};

export const insertCredentials = (username: string, password = ''): void => {
  cy.get('[formcontrolname="name"]')
    .should('exist')
    .clear()
    .type(username);
  if (password) {
    cy.get('[formcontrolname="pw"]')
      .clear()
      .type(password);
  }
};

export const logoutAdmin = (): Chainable => cy.url()
  .then(url => {
    if (url !== `${Cypress.config().baseUrl}/#/r/login/`) {
      cy.get('[data-cy="logo"]')
        .should('exist')
        .click();
      cy.url()
        .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
      cy.get('[data-cy="logout"]')
        .click();
      cy.url()
        .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
    }
  });

export const logoutTestTaker = (fileType: 'hot' | 'demo'): Chainable => cy.url()
  .then(url => {
    // if booklet is started
    if (url !== `${Cypress.config().baseUrl}/#/r/starter`) {
      // we don't know which calls the testcontroller have left (unit state, test state etc.) so waiting for a time
      // seems to be the least bad solution
      cy.wait(2000);
      cy.get('[data-cy="logo"]')
        .should('exist')
        .click();
      if (fileType === 'hot') {
        cy.contains(/^Der Test ist aktiv.$/);
        cy.get('[data-cy="resumeTest-1"]')
          .should('exist');
        cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
        cy.get('[data-cy="endTest-1"]')
          .should('exist')
          .click();
        cy.url()
          .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
        cy.wait('@waitForGetSession');
        cy.get('[data-cy="logout"]')
          .should('exist')
          .click();
        cy.url()
          .should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
      } else if (fileType === 'demo') {
        cy.get('[data-cy="logout"]')
          .should('exist')
          .click();
      }
    } else {
      cy.get('[data-cy="logout"]')
        .should('exist')
        .click();
    }
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/login/`);
  });

export const openSampleWorkspace1 = (): void => {
  cy.get('[data-cy="workspace-1"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/1/files`);
};

export const openSampleWorkspace2 = (): void => {
  cy.get('[data-cy="workspace-2"]')
    .should('exist')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/2/files`);
};

export const loginSuperAdmin = (): void => {
  insertCredentials(userData.SuperAdminName, userData.SuperAdminPassword);
  cy.intercept({ url: `${Cypress.env('urls').backend}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .should('exist')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  cy.contains(userData.SuperAdminName)
    .should('exist');
};

export const loginWorkspaceAdmin = (): void => {
  insertCredentials(userData.WorkspaceAdminName, userData.WorkspaceAdminPassword);
  cy.intercept({ url: `${Cypress.env('urls').backend}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .should('exist')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  cy.contains(userData.WorkspaceAdminName)
    .should('exist');
};

export const loginTestTaker =
  (name: string, password: string, expectedView: 'test' | 'test-hot' | 'starter' | 'code-input' = 'starter'): void => {
    insertCredentials(name, password);
    if (expectedView === 'test-hot') {
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/state`)).as('testState');
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/unit/[^/]+/state`)).as('unitState');
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/log`)).as('testLog');
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/commands`)).as('commands');
    }
    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();

    // eslint-disable-next-line default-case
    switch (expectedView) {
      case 'test-hot':
        cy.wait(['@testState', '@unitState', '@testLog', '@commands']);
      // eslint-disable-next-line no-fallthrough
      case 'test':
        cy.url().should('contain', `${Cypress.config().baseUrl}/#/t/`);
        break;
      case 'starter':
        cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
        cy.contains(name)
          .should('exist');
        break;
      case 'code-input':
        cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
    }
  };

export const loginStudyMonitor =
  (name: string, password: string): void => {
    insertCredentials(name, password);

    cy.get('[data-cy="login-user"]')
      .should('exist')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  };

export const clickSuperadmin = (): void => {
  cy.contains('Systemverwaltung')
    .should('exist')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`);
};

export const addWorkspaceAdmin = (username: string, password: string): void => {
  cy.get('[data-cy="superadmin-tabs:users"]')
    .should('exist')
    .click();
  cy.get('[data-cy="add-user"]')
    .click();
  cy.get('[formcontrolname="name"]')
    .should('exist')
    .type(username);
  cy.get('[formcontrolname="pw"]')
    .should('exist')
    // password < 7 characters
    .type('123456')
    .get('[type="submit"]')
    .should('be.disabled');
  cy.get('[formcontrolname="pw"]')
    .clear()
    .type(password)
    .get('[type="submit"]')
    .should('be.enabled')
    .click();
  cy.contains(username)
    .should('exist');
};

export const deleteFilesSampleWorkspace = (): void => {
  cy.get('[data-cy="files-checkAll-Testtakers"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-Booklet"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-SysCheck"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-Resource"]')
    .should('exist')
    .click();
  cy.get('[data-cy="files-checkAll-Unit"]')
    .should('exist')
    .click();
  cy.get('[data-cy="delete-files"]')
    .should('exist')
    .click();
  cy.get('[data-cy="dialog-title"]')
    .should('exist')
    .contains('Löschen von Dateien');
  cy.get('[data-cy="dialog-confirm"]')
    .should('exist')
    .contains('Löschen')
    .click();
  cy.contains('erfolgreich gelöscht.')
    .should('exist');
  cy.contains('Teilnehmerlisten')
    .should('not.exist');
  cy.contains('Testhefte')
    .should('not.exist');
  cy.contains('System-Check-Definitionen')
    .should('not.exist');
  cy.contains('Ressourcen')
    .should('not.exist');
};

export const deleteTesttakersFiles = (): void => {
  cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
    .click();
  cy.get('[data-cy="delete-files"]')
    .click();
  cy.get('[data-cy="dialog-title"]')
    .should('exist')
    .contains('Löschen von Dateien');
  cy.get('[data-cy="dialog-confirm"]')
    .should('exist')
    .contains('Löschen')
    .click();
  cy.contains('1 Dateien erfolgreich gelöscht.')
    .should('exist');
  cy.contains('1 Dateien erfolgreich gelöscht.', { timeout: 10000 })
    .should('not.exist');
  cy.get('[data-cy="SAMPLE_TESTTAKERS.XML"]')
    .should('not.exist');
};

export const useTestDB = () : void => {
  cy.intercept(new RegExp(`(${Cypress.env('urls').backend}|${Cypress.env('urls').fileService})/.*`), req => {
    req.headers.TestMode = 'integration';
  }).as('testMode');
};

export const useTestDBSetDate = (timestamp: string) : void => {
  cy.intercept(new RegExp(`${Cypress.env('urls').backend}/.*`), req => {
    req.headers.TestClock = timestamp;
  }).as('testClock');
};

export const convertResultsLoginRows = (fileType: 'responses' | 'reviews' | 'logs'): Chainable<Array<Array<string>>> => {
  const regex = /[\\]/g;

  const splitCSVLogin = str => str.split('\n')
    .map(row => row.replaceAll(regex, ''));

  if (fileType === 'responses') {
    return cy.readFile('cypress/downloads/iqb-testcenter-responses.csv')
      .then(splitCSVLogin);
  }
  if (fileType === 'reviews') {
    return cy.readFile('cypress/downloads/iqb-testcenter-reviews.csv')
      .then(splitCSVLogin);
  }
  return cy.readFile('cypress/downloads/iqb-testcenter-logs.csv')
    .then(splitCSVLogin);
};

export const convertResultsSeperatedArrays = (fileType: 'responses' | 'reviews' | 'logs'): Chainable<Array<Array<string>>> => {
  const splitCsvID = str => str.split('\n')
    .map(row => row.split(';').map(cell => cell.replace(/^"/, '').replace(/"$/, '')));

  if (fileType === 'responses') {
    return cy.readFile('cypress/downloads/iqb-testcenter-responses.csv')
      .should('exist')
      .then(splitCsvID);
  }
  if (fileType === 'reviews') {
    return cy.readFile('cypress/downloads/iqb-testcenter-reviews.csv')
      .should('exist')
      .then(splitCsvID);
  }
  throw new Error(`Unknown filetype: ${fileType}`);
};

export const getFromIframe = (selector: string): Chainable<JQuery<HTMLElement>> => cy.get('iframe')
  .its('0.contentDocument.body')
  .should('be.visible')
  .then(cy.wrap)
  .find(selector);

export const forwardTo = (expectedLabel: string): void => {
  cy.get('[data-cy="unit-navigation-forward"]')
    .click();
  cy.get('[data-cy="unit-title"]')
    .should('exist')
    .contains(new RegExp(`^${expectedLabel}$`))
    .should('exist');
};

export const backwardsTo = (expectedLabel: string): void => {
  cy.get('[data-cy="unit-navigation-backward"]')
    .click();
  cy.get('[data-cy="unit-title"]')
    .should('exist')
    .contains(new RegExp(`^${expectedLabel}$`))
    .should('exist');
};

export const readBlockTime = (): Promise <number> => new Promise(resolve => {
  cy.get('[data-cy="time-value"]')
    .then(currTime => {
      const currBlockTimeStr = currTime.text().replace(/0:/, '');
      const currBlockTimeNumber = +currBlockTimeStr;
      resolve(currBlockTimeNumber);
    });
});

export const selectFromDropdown = (dropdownLabel: string, optionName: string): void => {
  cy.contains('mat-form-field', dropdownLabel).find('mat-select').click();
  cy.get('.cdk-overlay-container').contains(optionName).click();
};
