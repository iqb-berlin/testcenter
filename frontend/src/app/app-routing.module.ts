import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmptyComponent } from '@app/app-root/page-not-found/empty.component';
import { AppRootComponent } from './app-root/app-root.component';
import { LoginComponent } from './app-root/login/login.component';
import { AdminLoginComponent } from './app-root/login/admin-login/admin-login.component';
import { SysCheckStarterComponent } from './app-root/sys-check-starter/sys-check-starter.component';
import { CodeLoginComponent } from './app-root/code-login/code-login.component';
import {
  codeInputGuard, createClaimGuard, directLoginGuard, routeDispatcherGuard, starterGuard
} from './app-route-guards';
import { PageNotFoundComponent } from './app-root/page-not-found/page-not-found.component';
import { GenericInfoPageComponent } from './app-root/generic-info-page/generic-info-page.component';
import { AppModuleSettings } from './app.interfaces';
import { StarterComponent } from './app-root/starter/starter.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'r/route-dispatcher',
    pathMatch: 'full'
  },
  {
    path: 'r',
    component: AppRootComponent,
    children: [
      {
        path: '',
        redirectTo: 'route-dispatcher',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent,
        pathMatch: 'full'
      },
      {
        path: 'admin-login',
        component: AdminLoginComponent,
        pathMatch: 'full'
      },
      {
        path: 'login/:returnTo',
        component: LoginComponent
      },
      {
        path: 'check-starter',
        component: SysCheckStarterComponent
      },
      {
        path: 'route-dispatcher',
        component: EmptyComponent,
        canActivate: [routeDispatcherGuard]
      },
      {
        path: 'code-input',
        component: CodeLoginComponent,
        canActivate: [codeInputGuard]
      },
      {
        path: 'starter',
        component: StarterComponent,
        canActivate: [starterGuard]
      }
    ]
  },
  {
    path: 'legal-notice',
    component: GenericInfoPageComponent,
    data: {
      title: 'Rechtliches',
      contentKey: 'trustedLegalNoticeHtml'
    }
  },
  {
    path: 'privacy',
    component: GenericInfoPageComponent,
    data: {
      title: 'Datenschutz',
      contentKey: 'trustedPrivacyNotice'
    }
  },
  {
    path: 'accessibility',
    component: GenericInfoPageComponent,
    data: {
      title: 'Barrierefreiheit',
      contentKey: 'trustedAccessibilityNotice'
    }
  },
  {
    path: 'check',
    loadChildren: () => import('./sys-check/sys-check.module').then(module => module.SysCheckModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./workspace-admin/workspace.module').then(module => module.WorkspaceModule),
    canActivate: [createClaimGuard('workspaceAdmin')]
  },
  {
    path: 'superadmin',
    loadChildren: () => import('./superadmin/superadmin.module').then(module => module.SuperadminModule),
    canActivate: [createClaimGuard('superAdmin')]
  },
  {
    path: 'gm',
    loadChildren: () => import('./group-monitor/group-monitor.module').then(module => module.GroupMonitorModule),
    canActivate: [createClaimGuard('testGroupMonitor')]
  },
  {
    path: 'sm',
    loadChildren: () => import('./study-monitor/study-monitor.module').then(module => module.StudyMonitorModule),
    canActivate: [createClaimGuard('studyMonitor')]
  },
  {
    path: 'am',
    loadChildren: () => import('./attachment-manager/attachment-manager.module')
      .then(module => module.AttachmentManagerModule)
    // canActivate: [createClaimGuard('testGroupMonitor')]
  },
  {
    path: 't',
    loadChildren: () => import('./test-controller/test-controller.module').then(module => module.TestControllerModule),
    canActivate: [createClaimGuard('test')],
    data: {
      httpRetryPolicy: 'test'
    } satisfies AppModuleSettings
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    canActivate: [directLoginGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    canceledNavigationResolution: 'computed'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
