'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">iqb-testcenter documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' : 'data-target="#xs-controllers-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' :
                                            'id="xs-controllers-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' }>
                                            <li class="link">
                                                <a href="controllers/CommandController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommandController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/MonitorController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MonitorController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/SystemController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/TestSessionController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestSessionController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/TesteeController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TesteeController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' : 'data-target="#xs-injectables-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' :
                                        'id="xs-injectables-links-module-AppModule-c19ac25e2c6d6f497556a9dea0941947208b9d9e98d0b99d2798c5a002ca507a5a97fbaddc2068b9ad52fc3a073f9b88b2b2d12406dd687ecf4faeea2b827dce"' }>
                                        <li class="link">
                                            <a href="injectables/TestSessionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestSessionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TesteeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TesteeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ErrorHandler.html" data-type="entity-link" >ErrorHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebsocketGateway.html" data-type="entity-link" >WebsocketGateway</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Command.html" data-type="entity-link" >Command</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Monitor.html" data-type="entity-link" >Monitor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Testee.html" data-type="entity-link" >Testee</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});