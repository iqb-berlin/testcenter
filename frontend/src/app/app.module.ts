import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApplicationModule, ErrorHandler, NgModule } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialog, MatDialogModule
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BackendService } from './backend.service';
import { AuthInterceptor } from './auth.interceptor';
import { AppRootComponent } from './app-root/app-root.component';
import { SysCheckStarterComponent } from './app-root/sys-check-starter/sys-check-starter.component';
import { LoginComponent } from './app-root/login/login.component';
import { CodeInputComponent } from './app-root/code-input/code-input.component';
import { RouteDispatcherComponent } from './app-root/route-dispatcher/route-dispatcher.component';
import { StatusCardComponent } from './app-root/status-card/status-card.component';
import { LegalNoticeComponent } from './app-root/legal-notice/legal-notice.component';
import { RetryInterceptor } from './retry.interceptor';
import { AppErrorHandler } from './app.error-handler';
import { ErrorInterceptor } from './error.interceptor';
import { StarterComponent } from './app-root/starter/starter.component';
import { TestModeInterceptor } from './test-mode.interceptor';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MatExpansionModule } from '@angular/material/expansion';
import { HeaderComponent } from './app-root/header/header.component';

@NgModule({ declarations: [
        AppComponent,
        AppRootComponent,
        SysCheckStarterComponent,
        LoginComponent,
        CodeInputComponent,
        RouteDispatcherComponent,
        StatusCardComponent,
        LegalNoticeComponent,
        StarterComponent
    ],
    bootstrap: [AppComponent], imports: [ApplicationModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRadioModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,
    SharedModule,
    CdkAccordionModule,
    MatExpansionModule, HeaderComponent], providers: [
        BackendService,
        MatDialog,
        {
            provide: ErrorHandler,
            useClass: AppErrorHandler
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: RetryInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TestModeInterceptor,
            multi: true
        },
        {
            provide: LocationStrategy,
            useClass: HashLocationStrategy
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
