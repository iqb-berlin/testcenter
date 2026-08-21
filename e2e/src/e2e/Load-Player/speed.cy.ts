import {
  cleanUp,
  clickCardButton,
  disableSimplePlayersInternalDebounce,
  getFromIframe, loginMonitor,
  logout,
  probeBackendApi,
  resetBackendData,
  twoStepLogin,
  visitLoginPage
} from '../utils';

// TODO speed-player test noch deaktiviert, da zu lange für headless Lauf. Kann aber experimentell zum lokalen Testen genutzt werden.
/*
Was macht der Test aktuell?
Experimentell zum lokalen Testen des Speedtest-Players: Durchläuft mehrere Testlets mit einer vestimmten Anzahl Speedtestaufgaben.
*/

describe('run a booklet', { testIsolation: false }, () => {
  before(() => {
    cleanUp();
    resetBackendData();
    probeBackendApi();
  });

  const waitTime = 1000;

  // Muss Anzahl der Speedtestunits im Testlet entsprechen. Aktuell sind hier 7 Aufgaben angelegt.
  const TOTAL_UNITS = 7;

  const units = Array.from({ length: TOTAL_UNITS }, (_, i) => {
    const questNum = i + 1;
    return {
      id: `unit-${questNum}`,
      title: `Frage ${questNum}`,
      button: `math-input-button-${i % 10}`,
      hasContinue: questNum !== TOTAL_UNITS
    };
  });

  describe('Test Zahlen und Bild Speedtest', { testIsolation: false }, () => {
    before(() => {
      visitLoginPage();
      disableSimplePlayersInternalDebounce();
      twoStepLogin('speed-1', '123');
    });

    it('go to time-block with speed units', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Unit-1');
      getFromIframe('iframe.unitHost').within(() => {
        cy.get('[data-cy="question-text"]')
          .contains('Instruktionen');
        cy.get('[data-cy="answer-button-0"]')
          .click();
      });
    });

    units.forEach(({ id, title, button, hasContinue }) => {
      it('speed-' + id, () => {
        cy.get('[data-cy="unit-title"]')
          .contains('Unit-2');
        cy.wait(waitTime);
        getFromIframe('iframe.unitHost').within(() => {
          // prüft namen der Speedtest-Aufgabe
          cy.get('[data-cy="image-question-text"]')
            .contains(title);
          cy.get(`[data-cy="${button}"]`)
            .click();
          cy.get('[data-cy="unit-next-button"]')
            .click();
        });
      });
    });

    it('leave time block', () => {
      cy.get('[data-cy="dialog-cancel"]')
        .click();
    });

    it('go to time-block with speed units', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Unit-3');
      getFromIframe('iframe.unitHost').within(() => {
        cy.get('[data-cy="question-text"]')
          .contains('Instruktionen');
        cy.get('[data-cy="answer-button-1"]')
          .click();
      });
    });

    units.forEach(({ id, title, button, hasContinue }) => {
      it('speed-' + id, () => {
        cy.get('[data-cy="unit-title"]')
          .contains('Unit-4');
        cy.wait(waitTime);
        getFromIframe('iframe.unitHost').within(() => {
          // prüft namen der Speedtest-Aufgabe
          cy.get('[data-cy="image-question-text"]')
            .contains(title);
          cy.get(`[data-cy="${button}"]`)
            .click();
          cy.get('[data-cy="unit-next-button"]')
            .click();
        });
      });
    });

    it('leave time block', () => {
      cy.get('[data-cy="dialog-cancel"]')
        .click();
    });

    it('go to time-block with speed units', () => {
      cy.get('[data-cy="unit-title"]')
        .contains('Unit-5');
      getFromIframe('iframe.unitHost').within(() => {
        cy.get('[data-cy="question-text"]')
          .contains('Instruktionen');
        cy.get('[data-cy="answer-button-1"]')
          .click();
      });
    });

    units.forEach(({ id, title, button, hasContinue }) => {
      it('speed-' + id, () => {
        cy.get('[data-cy="unit-title"]')
          .contains('Unit-6');
        cy.wait(waitTime);
        getFromIframe('iframe.unitHost').within(() => {
          // prüft namen der Speedtest-Aufgabe
          cy.get('[data-cy="image-question-text"]')
            .contains(title);
          cy.get(`[data-cy="${button}"]`)
            .click();
          cy.get('[data-cy="unit-next-button"]')
            .click();
        });
      });
    });

    it('check last unit is reached', () => {
      cy.get('[data-cy="dialog-cancel"]')
        .click();
      cy.get('[data-cy="unit-title"]')
        .contains('Unit-7');
    });
  });
});



