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
                                            'data-target="#components-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' : 'data-target="#xs-components-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' :
                                            'id="xs-components-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' }>
                                            <li class="link">
                                                <a href="components/AdminStarterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminStarterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AppRootComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppRootComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CodeInputComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CodeInputComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LegalNoticeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LegalNoticeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MonitorStarterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MonitorStarterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RouteDispatcherComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RouteDispatcherComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/StatusCardComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StatusCardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SysCheckStarterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SysCheckStarterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestStarterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestStarterComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' : 'data-target="#xs-injectables-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' :
                                        'id="xs-injectables-links-module-AppModule-907cca4995a7e6fa6bf1c6caaa7a607cdbdfdcc4e5602e3491c9a259bed247ed48c97dcdb0c0d28c4fb70af40d622234b7923295a221a7e0ac9b09088c64bead"' }>
                                        <li class="link">
                                            <a href="injectables/BackendService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BackendService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/GroupMonitorModule.html" data-type="entity-link" >GroupMonitorModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' : 'data-target="#xs-components-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' :
                                            'id="xs-components-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' }>
                                            <li class="link">
                                                <a href="components/GroupMonitorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupMonitorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestSessionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestSessionComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' : 'data-target="#xs-injectables-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' :
                                        'id="xs-injectables-links-module-GroupMonitorModule-dbbf7f516c4388fc583e11ad7c09cc481880c8cc184a0a86779e81a57a0e256116f7f024ac47d761b654cfcaefb22e8a26596a08594ab7ee46cea35ef72cd4a2"' }>
                                        <li class="link">
                                            <a href="injectables/BackendService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BackendService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BookletService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BookletService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TestSessionManager.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestSessionManager</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/GroupMonitorRoutingModule.html" data-type="entity-link" >GroupMonitorRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link" >SharedModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' : 'data-target="#xs-components-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' :
                                            'id="xs-components-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' }>
                                            <li class="link">
                                                <a href="components/AlertComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AlertComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ConfirmDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConfirmDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MessageDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MessageDialogComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' : 'data-target="#xs-pipes-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' :
                                            'id="xs-pipes-links-module-SharedModule-1fedd59a50416a89a09da0642ad72d461d9a7ab2de6925bf755bb70de3b257c2ab8e7c78d4907d5d2f87d56d44b6d5d409e818061db9c26c8bc199fd739f754b"' }>
                                            <li class="link">
                                                <a href="pipes/BytesPipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BytesPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/CustomtextPipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CustomtextPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SuperadminModule.html" data-type="entity-link" >SuperadminModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' : 'data-target="#xs-components-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' :
                                            'id="xs-components-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' }>
                                            <li class="link">
                                                <a href="components/AppConfigComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppConfigComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditCustomTextComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EditCustomTextComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditCustomTextsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EditCustomTextsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditworkspaceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EditworkspaceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NewpasswordComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewpasswordComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NewuserComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewuserComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NewworkspaceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewworkspaceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SettingsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SettingsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SuperadminComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SuperadminComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SuperadminPasswordRequestComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SuperadminPasswordRequestComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UsersComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspacesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspacesComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' : 'data-target="#xs-injectables-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' :
                                        'id="xs-injectables-links-module-SuperadminModule-874a0c3a0126fa9f96d7b7e237172813a69a0177854eafe050f5eef1fb92f7181e7d48ef5af704d17815e048402bcdb904ede5a4dbeac5b6843ab0f2f3a8ff6c"' }>
                                        <li class="link">
                                            <a href="injectables/BackendService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BackendService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SuperadminRoutingModule.html" data-type="entity-link" >SuperadminRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SysCheckModule.html" data-type="entity-link" >SysCheckModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' : 'data-target="#xs-components-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' :
                                            'id="xs-components-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' }>
                                            <li class="link">
                                                <a href="components/NetworkCheckComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NetworkCheckComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/QuestionnaireComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >QuestionnaireComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ReportComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReportComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SaveReportComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SaveReportComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SysCheckComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SysCheckComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TcSpeedChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TcSpeedChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UnitCheckComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UnitCheckComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WelcomeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WelcomeComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' : 'data-target="#xs-injectables-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' :
                                        'id="xs-injectables-links-module-SysCheckModule-be0a6adb86f6110f9dd591b0ef8a2d861812899fcd6fe866ddfb2bbe31bc6101ca13cb0ef3bdc6b61dad6159f5ab6e5a9cc6301559d90d76d2dd8c1017716eb1"' }>
                                        <li class="link">
                                            <a href="injectables/BackendService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BackendService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SysCheckDataService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SysCheckDataService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SysCheckRoutingModule.html" data-type="entity-link" >SysCheckRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TestControllerModule.html" data-type="entity-link" >TestControllerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TestControllerModule-5161af79b3e002442ee56c4bf0ba7ab2b48808a98152f364ebeb0b1d73df3ccae06d9cc4ab7adf6bc3aea8acba1afca7cb69421c338e0cfcab0f25c6ea5cb7c4"' : 'data-target="#xs-components-links-module-TestControllerModule-5161af79b3e002442ee56c4bf0ba7ab2b48808a98152f364ebeb0b1d73df3ccae06d9cc4ab7adf6bc3aea8acba1afca7cb69421c338e0cfcab0f25c6ea5cb7c4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TestControllerModule-5161af79b3e002442ee56c4bf0ba7ab2b48808a98152f364ebeb0b1d73df3ccae06d9cc4ab7adf6bc3aea8acba1afca7cb69421c338e0cfcab0f25c6ea5cb7c4"' :
                                            'id="xs-components-links-module-TestControllerModule-5161af79b3e002442ee56c4bf0ba7ab2b48808a98152f364ebeb0b1d73df3ccae06d9cc4ab7adf6bc3aea8acba1afca7cb69421c338e0cfcab0f25c6ea5cb7c4"' }>
                                            <li class="link">
                                                <a href="components/ReviewDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReviewDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestControllerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestControllerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestStatusComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TestStatusComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UnitMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UnitMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UnithostComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UnithostComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TestControllerRoutingModule.html" data-type="entity-link" >TestControllerRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/WorkspaceModule.html" data-type="entity-link" >WorkspaceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' : 'data-target="#xs-components-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' :
                                            'id="xs-components-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' }>
                                            <li class="link">
                                                <a href="components/FilesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IqbFilesUploadComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IqbFilesUploadComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IqbFilesUploadQueueComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IqbFilesUploadQueueComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ResultsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ResultsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SyscheckComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SyscheckComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' : 'data-target="#xs-directives-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' :
                                        'id="xs-directives-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' }>
                                        <li class="link">
                                            <a href="directives/IqbFilesUploadInputForDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IqbFilesUploadInputForDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' : 'data-target="#xs-injectables-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' :
                                        'id="xs-injectables-links-module-WorkspaceModule-e1c7d6b4941845e973e73566a88d06c1d2edc03e113827957379778ee58af5741a265e3e641d33332c43b5f141be9c234b4935b5cdb8f1bfa64318c54870c964"' }>
                                        <li class="link">
                                            <a href="injectables/BackendService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BackendService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/WorkspaceDataService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceDataService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/WorkspaceRoutingModule.html" data-type="entity-link" >WorkspaceRoutingModule</a>
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
                                <a href="classes/ApiError.html" data-type="entity-link" >ApiError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AppConfig.html" data-type="entity-link" >AppConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/BookletConfig.html" data-type="entity-link" >BookletConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/BookletUtil.html" data-type="entity-link" >BookletUtil</a>
                            </li>
                            <li class="link">
                                <a href="classes/EnvironmentData.html" data-type="entity-link" >EnvironmentData</a>
                            </li>
                            <li class="link">
                                <a href="classes/LocalStorage.html" data-type="entity-link" >LocalStorage</a>
                            </li>
                            <li class="link">
                                <a href="classes/MaxTimerData.html" data-type="entity-link" >MaxTimerData</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockBackendService.html" data-type="entity-link" >MockBackendService</a>
                            </li>
                            <li class="link">
                                <a href="classes/NavigationLeaveRestrictions.html" data-type="entity-link" >NavigationLeaveRestrictions</a>
                            </li>
                            <li class="link">
                                <a href="classes/Testlet.html" data-type="entity-link" >Testlet</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestletContentElement.html" data-type="entity-link" >TestletContentElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestMode.html" data-type="entity-link" >TestMode</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestSessionUtil.html" data-type="entity-link" >TestSessionUtil</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnitControllerData.html" data-type="entity-link" >UnitControllerData</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnitDef.html" data-type="entity-link" >UnitDef</a>
                            </li>
                            <li class="link">
                                <a href="classes/Watcher.html" data-type="entity-link" >Watcher</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebsocketService.html" data-type="entity-link" >WebsocketService</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/BackendService-5.html" data-type="entity-link" >BackendService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommandService.html" data-type="entity-link" >CommandService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CustomtextService.html" data-type="entity-link" >CustomtextService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MainDataService.html" data-type="entity-link" >MainDataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TestControllerService.html" data-type="entity-link" >TestControllerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TestLoaderService.html" data-type="entity-link" >TestLoaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WebsocketBackendService.html" data-type="entity-link" >WebsocketBackendService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interceptors-links"' :
                            'data-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/AuthInterceptor.html" data-type="entity-link" >AuthInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AdminComponentActivateGuard.html" data-type="entity-link" >AdminComponentActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/AdminOrSuperAdminComponentActivateGuard.html" data-type="entity-link" >AdminOrSuperAdminComponentActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/CodeInputComponentActivateGuard.html" data-type="entity-link" >CodeInputComponentActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/DirectLoginActivateGuard.html" data-type="entity-link" >DirectLoginActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/GroupMonitorActivateGuard.html" data-type="entity-link" >GroupMonitorActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/RouteDispatcherActivateGuard.html" data-type="entity-link" >RouteDispatcherActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/SuperAdminComponentActivateGuard.html" data-type="entity-link" >SuperAdminComponentActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/SysCheckChildCanActivateGuard.html" data-type="entity-link" >SysCheckChildCanActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TestComponentActivateGuard.html" data-type="entity-link" >TestComponentActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TestControllerDeactivateGuard.html" data-type="entity-link" >TestControllerDeactivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/TestControllerErrorPausedActivateGuard.html" data-type="entity-link" >TestControllerErrorPausedActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/UnitActivateGuard.html" data-type="entity-link" >UnitActivateGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/UnitDeactivateGuard.html" data-type="entity-link" >UnitDeactivateGuard</a>
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
                                <a href="interfaces/AccessObject.html" data-type="entity-link" >AccessObject</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AccessType.html" data-type="entity-link" >AccessType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppError.html" data-type="entity-link" >AppError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppSettingsObject.html" data-type="entity-link" >AppSettingsObject</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthData.html" data-type="entity-link" >AuthData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Booklet.html" data-type="entity-link" >Booklet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BookletData.html" data-type="entity-link" >BookletData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BookletError.html" data-type="entity-link" >BookletError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BookletMetadata.html" data-type="entity-link" >BookletMetadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CheckConfig.html" data-type="entity-link" >CheckConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CheckingOptions.html" data-type="entity-link" >CheckingOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Command.html" data-type="entity-link" >Command</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommandResponse.html" data-type="entity-link" >CommandResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfirmDialogData.html" data-type="entity-link" >ConfirmDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomText.html" data-type="entity-link" >CustomText</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomTextData.html" data-type="entity-link" >CustomTextData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomTextData-1.html" data-type="entity-link" >CustomTextData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomTextDataGroup.html" data-type="entity-link" >CustomTextDataGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomTextDefs.html" data-type="entity-link" >CustomTextDefs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetectedNetworkInformation.html" data-type="entity-link" >DetectedNetworkInformation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileDeletionReport.html" data-type="entity-link" >FileDeletionReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileStats.html" data-type="entity-link" >FileStats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormDefEntry.html" data-type="entity-link" >FormDefEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GotoCommandData.html" data-type="entity-link" >GotoCommandData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupData.html" data-type="entity-link" >GroupData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IconData.html" data-type="entity-link" >IconData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IdAndName.html" data-type="entity-link" >IdAndName</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IdLabelSelectedData.html" data-type="entity-link" >IdLabelSelectedData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IdRoleData.html" data-type="entity-link" >IdRoleData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IQBFile.html" data-type="entity-link" >IQBFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KeyValuePairNumber.html" data-type="entity-link" >KeyValuePairNumber</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KeyValuePairs.html" data-type="entity-link" >KeyValuePairs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KeyValuePairString.html" data-type="entity-link" >KeyValuePairString</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadedFile.html" data-type="entity-link" >LoadedFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadingProgress.html" data-type="entity-link" >LoadingProgress</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LogData.html" data-type="entity-link" >LogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageDialogData.html" data-type="entity-link" >MessageDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NameOnly.html" data-type="entity-link" >NameOnly</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NetworkCheckStatus.html" data-type="entity-link" >NetworkCheckStatus</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NetworkRating.html" data-type="entity-link" >NetworkRating</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NetworkRequestTestResult.html" data-type="entity-link" >NetworkRequestTestResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PageData.html" data-type="entity-link" >PageData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PageData-1.html" data-type="entity-link" >PageData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PendingUnitData.html" data-type="entity-link" >PendingUnitData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportEntry.html" data-type="entity-link" >ReportEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Restrictions.html" data-type="entity-link" >Restrictions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResultData.html" data-type="entity-link" >ResultData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReviewData.html" data-type="entity-link" >ReviewData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReviewDialogData.html" data-type="entity-link" >ReviewDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Selected.html" data-type="entity-link" >Selected</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ServerTime.html" data-type="entity-link" >ServerTime</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SpeedParameters.html" data-type="entity-link" >SpeedParameters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StateReportEntry.html" data-type="entity-link" >StateReportEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StepDef.html" data-type="entity-link" >StepDef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SysCheckInfo.html" data-type="entity-link" >SysCheckInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SysCheckReport.html" data-type="entity-link" >SysCheckReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SysCheckStatistics.html" data-type="entity-link" >SysCheckStatistics</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SysConfig.html" data-type="entity-link" >SysConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaggedString.html" data-type="entity-link" >TaggedString</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TcSpeedChartSettings.html" data-type="entity-link" >TcSpeedChartSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestData.html" data-type="entity-link" >TestData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Testlet.html" data-type="entity-link" >Testlet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestSession.html" data-type="entity-link" >TestSession</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestSessionFilter.html" data-type="entity-link" >TestSessionFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestSessionSetStats.html" data-type="entity-link" >TestSessionSetStats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestViewDisplayOptions.html" data-type="entity-link" >TestViewDisplayOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UIMessage.html" data-type="entity-link" >UIMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Unit.html" data-type="entity-link" >Unit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnitAndPlayerContainer.html" data-type="entity-link" >UnitAndPlayerContainer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnitContext.html" data-type="entity-link" >UnitContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnitLogData.html" data-type="entity-link" >UnitLogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnitNaviButtonData.html" data-type="entity-link" >UnitNaviButtonData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnitResponse.html" data-type="entity-link" >UnitResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnitStateData.html" data-type="entity-link" >UnitStateData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UploadReport.html" data-type="entity-link" >UploadReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UploadResponse.html" data-type="entity-link" >UploadResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserData.html" data-type="entity-link" >UserData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Verona2PlayerConfig.html" data-type="entity-link" >Verona2PlayerConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Verona3PlayerConfig.html" data-type="entity-link" >Verona3PlayerConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Verona4PlayerConfig.html" data-type="entity-link" >Verona4PlayerConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WatcherLogEntry.html" data-type="entity-link" >WatcherLogEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WorkspaceData.html" data-type="entity-link" >WorkspaceData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WsMessage.html" data-type="entity-link" >WsMessage</a>
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
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
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
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
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