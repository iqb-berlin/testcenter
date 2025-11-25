import Chainable = Cypress.Chainable;

export const userData = {
  SuperAdminName: 'super',
  SuperAdminPassword: 'user123',

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
    const startPage = url.endsWith('starter') ? Cypress.config().baseUrl : `${Cypress.config().baseUrl}/#/r/login/`;
    cy.visit(`${startPage}?testMode=true`).wait(1000); // wait(10) makes the navigation more stable (seems hacky)
    cy.url().should('include', '/#/r/login');
    cy.get('[data-cy="login-admin"]').should('be.visible');
    // Prüfe testMode und setzen, wenn nötig
    cy.url().then(currentUrl => {
      if (!currentUrl.includes('testMode=true')) {
        cy.log('⚠️ Test-Mode wurde nicht gesetzt!');
        cy.window().then(win => {
          const hasQuery = currentUrl.includes('?');
          const separator = hasQuery ? '&' : '?';
          win.location.href = `${currentUrl}${separator}testMode=true`;
        });
        // Warte bis URL aktualisiert ist
        cy.url().should('include', 'testMode=true');
        cy.get('[data-cy="login-admin"]').should('be.visible');
      }
    });
  });

export const visitLoginPageWithProdDb = (): Chainable => cy.url()
  .then(url => {
    const startPage = url.endsWith('starter') ? Cypress.config().baseUrl : `${Cypress.config().baseUrl}/#/r/login/`;
    cy.visit(`${startPage}`).wait(1000); // wait(10) makes the navigation more stable (seems hacky)
  });

export const probeBackendApi = (): Chainable => cy.url()
  .then(url => {
    cy.intercept({ url: new RegExp(`${Cypress.env('urls').backend}/(system/config|sys-check-mode)`) })
      .as('waitForConfig');
    cy.reload();
    visitLoginPage();
    cy.wait('@waitForConfig', { timeout: 30000 });
  });

export const resetBackendData = (): void => {
  cy.request({
    url: `${Cypress.env('urls').backend}/version`,
    headers: { TestMode: 'prepare-integration' }
  })
    .its('status').should('eq', 200);
  cy.request({
    url: `${Cypress.env('urls').backend}/flush-broadcasting-service`,
    headers: { TestMode: 'integration' }
  })
    .its('status').should('eq', 200);
};

export const disableSimplePlayersInternalDebounce = (): void => {
  modifyPlayer([{
    replace: 'const overridePlayerSettings = (location.search);',
    with: 'const overridePlayerSettings = "?debounceStateMessages=0&debounceKeyboardEvents=0"'
  }]);
};

export const modifyPlayer = (rules: { replace: string | RegExp, with: string }[]): void => {
  cy.intercept(
    {
      url: new RegExp(
        `${Cypress.env('urls').fileService}/file/static:group:[^\\/]+/ws_1/Resource/verona-player-simple-6.0.html`
      )
    },
    req => {
      req.headers.TestMode = 'integration';
      req.reply(res => {
        rules.forEach(rule => {
          res.body = res.body.replace(rule.replace, rule.with);
        });
      });
    }
  );
};

export const insertCredentials = (username: string, password = ''): void => {
  cy.get('[formcontrolname="name"]')
    .should(`be.visible`)
    .clear()
    .type(username);
  if (password) {
    cy.get('[formcontrolname="pw"]')
      .should(`be.visible`)
      .clear()
      .type(password);
  }
};

export const logoutAdmin = (): Chainable => cy.url()
  .then(url => {
    if (url !== `${Cypress.config().baseUrl}/#/r/login/`) {
      cy.get('[data-cy="logo"]')
        .click();
      cy.url()
        .should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
      cy.get('[data-cy="logout"]')
        .click();
      visitLoginPage();
    }
    cy.get('[data-cy="login-admin"]').should('be.visible');
  });

export const logoutTestTaker = (fileType: 'hot' | 'demo'): Chainable =>
  cy.url().then(url => {
    if (url === 'about:blank') {
      cy.log('Page could not be loaded. Try again.');
      return visitLoginPage().then(() => logoutTestTaker(fileType));
    }

    const baseUrl = Cypress.config().baseUrl;
    const backendUrl = Cypress.env('urls').backend;
    const isOnStarterPage = url === `${baseUrl}/#/r/starter`;

    if (!isOnStarterPage) {
      cy.get('[data-cy="logo"]').click();

      if (fileType === 'hot') {
        cy.log('end test');
        cy.intercept('GET', `${backendUrl}/session`).as('waitForGetSession');
        cy.get('[data-cy="endTest-1"]').click();
        cy.url().should('eq', `${baseUrl}/#/r/starter`);
        cy.wait('@waitForGetSession');
      }
    }

    cy.intercept('DELETE', `${backendUrl}/session`).as('waitForDeleteSession');
    cy.get('[data-cy="logout"]').click();
    cy.wait('@waitForDeleteSession');

    return visitLoginPage();
  });

export const logoutTestTakerBkltConfig = (
  fileType: 'hot_BkltConfigDefault' | 'hot_BkltConfigValue1'
): Chainable =>
  cy.url().then(url => {
    if (url === 'about:blank') {
      cy.log('Page could not be loaded. Try again.');
      return visitLoginPage().then(() => logoutTestTakerBkltConfig(fileType));
    }

    const baseUrl = Cypress.config().baseUrl;
    const backendUrl = Cypress.env('urls').backend;
    const isOnStarterPage = url === `${baseUrl}/#/r/starter`;

    if (!isOnStarterPage) {
      if (fileType === 'hot_BkltConfigValue1') {
        getFromIframe('[data-cy="TestController-radio1-Aufg1"]').click();
        getFromIframe('[data-cy="next-unit-page"]').click();
      }

      cy.get('[data-cy="logo"]').click();
      cy.get('[data-cy="dialog-cancel"]').click();

      cy.intercept('GET', `${backendUrl}/session`).as('waitForGetSession');
      cy.get('[data-cy="endTest-1"]').click();
      cy.url().should('eq', `${baseUrl}/#/r/starter`);
      cy.wait('@waitForGetSession');
    }

    cy.intercept('DELETE', `${backendUrl}/session`).as('waitForDeleteSession');
    cy.get('[data-cy="logout"]').click();
    cy.wait('@waitForDeleteSession');

    return cy.url().should('eq', `${baseUrl}/#/r/login/`);
  });

export const openSampleWorkspace = (workspace: number): void => {
  cy.get(`[data-cy="workspace-${workspace}"]`)
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/${workspace}/files`);
};

export const openSampleWorkspace2 = (): void => {
  cy.get('[data-cy="workspace-2"]')
    .click();
  cy.url()
    .should('eq', `${Cypress.config().baseUrl}/#/admin/2/files`);
};

export const loginSuperAdmin = (): void => {
  // wait for login site
  cy.get('[data-cy="login-admin"]').should('be.visible');
  insertCredentials(userData.SuperAdminName, userData.SuperAdminPassword);
  cy.intercept({ url: `${Cypress.env('urls').backend}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  cy.get('[data-cy="card-login-name"]')
    .contains(userData.SuperAdminName);
};

export const loginWorkspaceAdmin = (username: string, password: string): void => {
  // wait for login site
  cy.get('[data-cy="login-admin"]').should('be.visible');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session/admin` }).as('waitForPutSession');
  cy.intercept({ url: `${Cypress.env('urls').backend}/session` }).as('waitForGetSession');
  insertCredentials(username, password);
  cy.get('[data-cy="login-admin"]')
    .click();
  cy.wait(['@waitForPutSession', '@waitForGetSession']);
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  cy.get('[data-cy="card-login-name"]')
    .contains(username);
};

export const loginTestTaker =
  (name: string, password: string, expectedView: 'test' | 'test-hot' | 'starter' | 'code-input' | 'sys-check' = 'starter'): void => {
    // wait for login site
    cy.get('[data-cy="login-admin"]').should('be.visible');
    insertCredentials(name, password);
    if (expectedView === 'test-hot') {
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/state`)).as('testState');
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/unit/[^/]+/state`)).as('unitState');
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/log`)).as('testLog');
      cy.intercept(new RegExp(`${Cypress.env('urls').backend}/test/\\d+/commands`)).as('commands');
    }
    cy.get('[data-cy="login-user"]')
      .click();

    // eslint-disable-next-line default-case
    switch (expectedView) {
      case 'test-hot':
        cy.wait(['@commands']);
      // eslint-disable-next-line no-fallthrough
      case 'test':
        cy.url().should('contain', `${Cypress.config().baseUrl}/#/t/`);
        break;
      case 'starter':
        cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
        cy.contains(name);
        break;
      case 'code-input':
        cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/code-input`);
        break;
      case 'sys-check':
        cy.url().should('contain', `${Cypress.config().baseUrl}/#/check`);
        break;
    }
  };

export const loginMonitor =
  (name: string, password: string): void => {
    insertCredentials(name, password);

    cy.get('[data-cy="login-user"]')
      .click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/#/r/starter`);
  };

export const clickSuperadminSettings = (): void => {
  cy.get('[data-cy="goto-superadmin-settings"]')
    .click();
  cy.url().should('eq', `${Cypress.config().baseUrl}/#/superadmin/users`);
};

export const addWorkspaceAdmin = (username: string, password: string): void => {
  cy.get('[data-cy="superadmin-tabs:users"]')
    .click();
  cy.get('[data-cy="add-user"]')
    .click();
  cy.get('[formcontrolname="name"]')
    .type(username);
  cy.get('[formcontrolname="pw"]')
    // password < 7 characters
    .type('123456')
    .get('[type="submit"]')
    .should('be.disabled');
  cy.get('[formcontrolname="pw"]')
    .clear()
    .type(password);
  cy.intercept('PUT', `${Cypress.env('urls').backend}/user`).as('waitForNewUser');
  cy.get('[type="submit"]')
    .click();
  cy.wait('@waitForNewUser');
};

export const uploadFileFromFixtureToWorkspace = (fileName: string, workspace: number): void => {
  loginSuperAdmin();
  openSampleWorkspace(workspace);
  cy.get('[data-cy="upload-file-select"]')
    .selectFile(`${Cypress.config('fixturesFolder')}/${fileName}`, { force: true });
  logoutAdmin();
};

export const deleteFilesSampleWorkspace = (): void => {
  cy.get('[data-cy="files-checkAll-Testtakers"]')
    .click();
  cy.get('[data-cy="files-checkAll-Booklet"]')
    .click();
  cy.get('[data-cy="files-checkAll-SysCheck"]')
    .click();
  cy.get('[data-cy="files-checkAll-Resource"]')
    .click();
  cy.get('[data-cy="files-checkAll-Unit"]')
    .click();
  cy.get('[data-cy="delete-files"]')
    .click();
  cy.get('[data-cy="dialog-title"]')
    .contains('Löschen von Dateien');
  cy.get('[data-cy="dialog-confirm"]')
    .contains('Löschen')
    .click();
  cy.contains('erfolgreich gelöscht.');
  cy.contains('Teilnehmerlisten')
    .should('not.exist');
  cy.contains('Testhefte')
    .should('not.exist');
  cy.contains('System-Check-Definitionen')
    .should('not.exist');
  cy.contains('Ressourcen')
    .should('not.exist');
};

export const deleteTesttakersFiles = (workspace: number): void => {
  if (workspace === 1) {
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
    cy.get('[data-cy="files-checkbox-CY_TEST_LOGINS.XML"]')
      .click();
  }
  if (workspace === 2) {
    cy.get('[data-cy="files-checkbox-SAMPLE_TESTTAKERS.XML"]')
      .click();
  }
  cy.get('[data-cy="delete-files"]')
    .click();
  cy.get('[data-cy="dialog-title"]')
    .contains('Löschen von Dateien');
  cy.get('[data-cy="dialog-confirm"]')
    .contains('Löschen')
    .click();
  cy.contains('erfolgreich gelöscht.');
  cy.contains('erfolgreich gelöscht.', { timeout: 10000 })
    .should('not.exist');
};

export const useTestDBSetDate = (timestamp: string): void => {
  cy.intercept(new RegExp(`${Cypress.env('urls').backend}/.*`), req => {
    req.headers.TestClock = timestamp;
    req.headers.TestMode = 'integration';
  }).as('testClock');
};

export const getResultFileRows = (fileType: 'responses' | 'reviews' | 'logs'): Chainable<Array<string>> => {
  const regex = /[\\]/g;

  const splitCSVFile = str => str.split('\n')
    .map(row => row.replaceAll(regex, ''));

  if (fileType === 'responses') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-responses.csv`)
      .then(splitCSVFile);
  }
  if (fileType === 'reviews') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-reviews.csv`)
      .then(splitCSVFile);
  }
  return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-logs.csv`)
    .then(splitCSVFile);
};

export const convertResultsSeperatedArrays = (fileType: 'responses' | 'reviews' | 'logs'): Chainable<Array<Array<string>>> => {
  const splitCsvID = str => str.split('\n')
    .map(row => row.split(';').map(cell => cell.replace(/^"/, '').replace(/"$/, '')));

  if (fileType === 'responses') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-responses.csv`)
      .then(splitCsvID);
  }
  if (fileType === 'reviews') {
    return cy.readFile(`${Cypress.config('downloadsFolder')}/iqb-testcenter-reviews.csv`)
      .then(splitCsvID);
  }
  throw new Error(`Unknown filetype: ${fileType}`);
};

export const getFromIframe = (selector: string): Chainable<JQuery<HTMLElement>> => {
  cy.get('iframe')
    .its('0.contentDocument.body')
    .as('iframeBody')
    .should('be.visible');
  return cy.get('@iframeBody')
    .find(selector);
};

export const forwardTo = (expectedLabel: string): void => {
  cy.get('[data-cy="unit-navigation-forward"]')
    .click();
  cy.get('[data-cy="unit-title"]')
    .contains(new RegExp(`^${expectedLabel}$`));
};

export const backwardsTo = (expectedLabel: string): void => {
  cy.get('[data-cy="unit-navigation-backward"]')
    .click();
  cy.get('[data-cy="unit-title"]')
    .contains(new RegExp(`^${expectedLabel}$`));
};

export const gotoPage = (pageIndex: number): void => {
  cy.get(`[data-cy="page-navigation-${pageIndex}"]`)
    .click();
  cy.get(`[data-cy="page-navigation-${pageIndex}"]`)
    .should('have.class', 'selected-value');
};

export const readBlockTime = () => {
  return cy.get('[data-cy="time-value"]')
    .invoke('text')
    .then(currTimeStr => {
      const currBlockTimeStr = currTimeStr.replace(/0:/, '');
      return +currBlockTimeStr;
    });
};

export const selectFromDropdown = (dropdownLabel: string, optionName: string): void => {
  cy.contains('mat-form-field', dropdownLabel).find('mat-select').click();
  cy.get('.cdk-overlay-container').contains(optionName).click();
};

export const reload = () => cy.url()
  .then(url => cy.visit(url.includes('?testMode=true') ? url : `${url}?testMode=true`));

export const expectUnitMenuToBe = (expectations: string[]) => cy.get('[data-cy*="unit-nav-item"]')
  .each((item, index) => cy.wrap(item).should('have.attr', 'data-cy', `unit-nav-item:${expectations[index]}`));

