describe('Test User functionalities', () => {
  
  it('Should start a sample booklet and click through the unit tabs', () => {
    cy.visit('http://localhost:4200/#/login/');
    cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input')
      .clear()
      .type('test')
      .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
      .type('user123');
    cy.contains('Weiter')
      .click()
      .wait(1000);
    cy.get('.mat-form-field-infix')
      .type('xxx')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
    cy.get('a.mat-primary:nth-child(1) > span:nth-child(1) > div:nth-child(1)')
      .click();
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/1/u/1');      
    })
    cy.get('div.unit-nav-item:nth-child(2) > mat-list-option:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
      .click();
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/1/u/2');      
    });
    cy.get('div.unit-nav-item:nth-child(3) > mat-list-option:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
      .click();
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/1/u/3');      
    });
    cy.get('div.unit-nav-item:nth-child(1) > mat-list-option:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
      .click();
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/1/u/1');      
    });
    cy.get('.mat-tooltip-trigger').eq(0)
        .click();
    cy.get('button.mat-focus-indicator:nth-child(1) > span:nth-child(1)')
      .click();
    cy.contains('Neu anmelden')
      .click();
  })
  
  it('Should navigate inside the iframe using the arrow buttons', () => {
    cy.visit('http://localhost:4200/#/login/')
    cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input')
      .clear()
      .type('test')
      .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
      .type('user123')
    cy.contains('Weiter')
      .click()
      .wait(1000)
    cy.get('.mat-form-field-infix')
      .type('xxx')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click()
    cy.get('a.mat-focus-indicator:nth-child(2) > span:nth-child(1) > div:nth-child(1)')
      .click()
    cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/t/2/u/1')      
    })
    cy.frameLoaded('.unitHost');
    cy.wait(1000);
    cy.iframe('.unitHost').find('#next-unit')
      .click()
      .wait(500);
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/2/u/2');      
    });
    cy.iframe('.unitHost').find('#last-unit')
      .click()
      .wait(500);
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/2/u/3');      
    });
    cy.iframe('.unitHost').find('#prev-unit')
      .click()
      .wait(500);
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/2/u/2');     
    });
    cy.iframe('.unitHost').find('#first-unit')
      .click()
      .wait(500);
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/2/u/1');      
    });
    cy.iframe('.unitHost').find('#end-unit')
    .click()
    .wait(500);
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/r/test-starter');      
    });
    cy.contains('Neu anmelden')
      .click();
  })

  it('Should navigate inside a unit using the navigation buttons', () => {
    cy.visit('http://localhost:4200/#/login/')
    cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input')
      .clear()
      .type('test')
      .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
      .type('user123');
    cy.contains('Weiter')
      .click()
      .wait(1000);
    cy.get('.mat-form-field-infix')
      .type('xxx')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
    cy.get('a.mat-primary:nth-child(1) > span:nth-child(1) > div:nth-child(1)')
      .click();
    cy.frameLoaded('.unitHost');
    cy.iframe('.unitHost')
      .find('#unit > fieldset:nth-child(3) > legend:nth-child(1)')
      .should('be.inViewport');
    cy.get('#page-navigation > div button').eq(2)
      .click()
      .wait(500);
    cy.iframe('.unitHost')
      .find('#unit > fieldset:nth-child(4) > legend:nth-child(1)')
      .scrollIntoView()
      .should('be.inViewport');
    cy.get('#page-navigation > div button span').eq(3)
      .click()
    cy.iframe('.unitHost')
      .find('#unit > fieldset:nth-child(5) > legend:nth-child(1)')
      .scrollIntoView()
      .should('be.inViewport');
    cy.get('#page-navigation > div button span').eq(4)
      .click()
      .wait(500);
    cy.iframe('.unitHost')
      .find('#unit > fieldset:nth-child(6) > legend:nth-child(1)')
      .scrollIntoView()
      .should('be.inViewport');
    cy.iframe('.unitHost').find('#end-unit')
      .click()
      .wait(500);
    cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/test-starter');      
      });
    cy.contains('Neu anmelden')
        .click();
  })

  it('Should unlock a locked unit', () => {
    cy.visit('http://localhost:4200/#/login/')
    cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > input')
      .clear()
      .type('test')
      .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
      .type('user123');
    cy.contains('Weiter')
      .click()
      .wait(500);
    cy.get('.mat-form-field-infix > input')
      .type('xxx')
      .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
      .click();
    cy.get('a.mat-primary:nth-child(1) > span:nth-child(1) > div:nth-child(1)')
      .click();
    cy.get('div.unit-nav-item:nth-child(2) > mat-list-option:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
      .click();
    cy.contains('Aufgabenblock ist noch gesperrt')
      .should('exist');
    cy.get('.mat-form-field-infix > input')
      .type('SAMPLE');
    cy.contains('OK')
      .click();
    cy.frameLoaded('.unitHost');
    cy.iframe('.unitHost')
      .contains('Sample Unit calling external File')
      .should('exist');
    cy.iframe('.unitHost')
      .find('#next-unit')
      .click();
    cy.get('button.mat-raised-button:nth-child(1) > span:nth-child(1)')
      .click()
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/1/u/3');      
    });
    cy.get('div.unit-nav-item:nth-child(2) > mat-list-option:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
      .click();
    cy.contains('Aufgabenzeit ist abgelaufen')
      .should('exist');
    cy.get('a.mat-tooltip-trigger:nth-child(1)')
      .click();
    cy.location().should((loc) => {
      expect(loc.href).to.eq('http://localhost:4200/#/t/1/u/1');      
    });
    cy.get('.mat-tooltip-trigger').eq(0)
      .click();
    cy.get('button.mat-focus-indicator:nth-child(1) > span:nth-child(1)')
      .click();
    cy.contains('Neu anmelden')
      .click();
  })
})