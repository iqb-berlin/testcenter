describe('Login page tests', () => {
    it('Visits the homepage', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.contains('IQB-Testcenter')
        .should('exist')
      cy.contains('Anmeldename')
        .should('exist')
    })

    it('Signs in a user with login code and logout', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test')
        .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('user123')
      cy.get('#login')
        .click()
        .wait(5)
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/code-input')      
      })
      cy.get('.mat-form-field-infix')
        .type('yyy')
        .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
        .click()
      cy.contains('Neu anmelden')
        .click()
      cy.location().should((loc) => {
         expect(loc.href).to.eq('http://localhost:4200/#/r/login/')      
       })
    })

    it('Signs in a user with wrong login code and logout', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test')
        .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('user123')
      cy.get('#login')
        .click()
        .wait(5)
        cy.location().should((loc) => {
          expect(loc.href).to.eq('http://localhost:4200/#/r/code-input')      
        })
      cy.get('.mat-form-field-infix')
        .type('ttt')
        .get('mat-card.mat-card:nth-child(1) > mat-card-actions:nth-child(4) > button:nth-child(1)')
        .click()
      cy.contains('Der Code ist leider nicht gültig. Bitte noch einmal versuchen')
        .should('exist')
      cy.contains('Neu anmelden')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/login/')      
      })  
    })

    it('Signs in a user and logout', () => { 
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test-demo')
        .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('user123')
      cy.get('#login')
        .click()
        .wait(5)
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/test-starter')      
      })
      cy.contains('Neu anmelden')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/login/')      
      })  
    })
    
    it('Signs in an admin and logout', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('super')
        .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('user123')
      cy.contains('Weiter als Admin')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/admin-starter')      
      })
      cy.contains('Neu anmelden')
        .click() 
    })

    it('Signs in a user without password', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test-no-pw')
      cy.contains('Weiter')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/test-starter')     
      })
      cy.contains('Neu anmelden')
      .click()
    })

    it('Try to sign in with wrong credentials', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test')
        .get('mat-form-field.mat-form-field:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('wrongpassword')
      cy.get('#login')
        .click()
      cy.contains('Anmeldedaten sind nicht gültig. Bitte noch einmal versuchen!')
        .should('exist')
    })
    
    it('Try to sign in with expired credentials', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test-expired')
      cy.contains('Weiter')
        .click()
      cy.contains('Anmeldedaten sind abgelaufen')
        .should('exist')
     
    })

    it('Try to sign in with not activated login credentials', () => {
      cy.visit('http://localhost:4200/#/login/')
      cy.get('mat-form-field.mat-form-field:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')
        .type('test-future')
      cy.contains('Weiter')
        .click()
      cy.contains('Anmeldung abgelehnt. Anmeldedaten sind noch nicht freigeben.')
        .should('exist')
    })

    it('Should get to legal disclosure and return to login page', () => {
      cy.visit('http://localhost:4200')
      cy.contains('Impressum/Datenschutz')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/legal-notice')     
      })
      cy.contains('zurück zur Startseite')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/login/')     
      })
    })

    it('Should get to System Check and return to login page', () => {
      cy.visit('http://localhost:4200')
      cy.contains('System-Check')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/check-starter')     
      })
      cy.contains('zurück zur Startseite')
        .click()
      cy.location().should((loc) => {
        expect(loc.href).to.eq('http://localhost:4200/#/r/login/')     
      })        
    })
      
  })
  
  
