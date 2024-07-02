import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppRootComponent } from './app-root/app-root.component';
import { LoginComponent } from './app-root/login/login.component';
import { SysCheckStarterComponent } from './app-root/sys-check-starter/sys-check-starter.component';
import { CodeInputComponent } from './app-root/code-input/code-input.component';
import {
  AdminComponentActivateGuard, AdminOrSuperAdminComponentActivateGuard,
  CodeInputComponentActivateGuard,
  DirectLoginActivateGuard, GroupMonitorActivateGuard,
  RouteDispatcherActivateGuard, StarterActivateGuard, SuperAdminComponentActivateGuard, TestComponentActivateGuard
} from './app-route-guards';
import { RouteDispatcherComponent } from './app-root/route-dispatcher/route-dispatcher.component';
import { LegalNoticeComponent } from './app-root/legal-notice/legal-notice.component';
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
        path: 'login/:returnTo',
        component: LoginComponent
      },
      {
        path: 'check-starter',
        component: SysCheckStarterComponent
      },
      {
        path: 'route-dispatcher',
        component: RouteDispatcherComponent,
        canActivate: [RouteDispatcherActivateGuard]
      },
      {
        path: 'code-input',
        component: CodeInputComponent,
        canActivate: [CodeInputComponentActivateGuard]
      },
      {
        path: 'starter',
        component: StarterComponent,
        canActivate: [StarterActivateGuard]
      }
    ]
  },
  {
    path: 'legal-notice',
    component: LegalNoticeComponent
  },
  {
    path: 'check',
    loadChildren: () => import('./sys-check/sys-check.module').then(module => module.SysCheckModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./workspace-admin/workspace.module').then(module => module.WorkspaceModule),
    canActivate: [AdminComponentActivateGuard]
  },
  {
    path: 'superadmin',
    loadChildren: () => import('./superadmin/superadmin.module').then(module => module.SuperadminModule),
    canActivate: [SuperAdminComponentActivateGuard]
  },
  {
    path: 'gm',
    loadChildren: () => import('./group-monitor/group-monitor.module').then(module => module.GroupMonitorModule),
    canActivate: [GroupMonitorActivateGuard]
  },
  {
    path: 'am',
    loadChildren: () => import('./attachment-manager/attachment-manager.module')
      .then(module => module.AttachmentManagerModule)
    // canActivate: [GroupMonitorActivateGuard]
  },
  {
    path: 't',
    loadChildren: () => import('./test-controller/test-controller.module').then(module => module.TestControllerModule),
    canActivate: [TestComponentActivateGuard],
    data: <AppModuleSettings>{
      httpRetryPolicy: 'test',
      disableGlobalErrorDisplay: true // because test-controller module has its own error display
    }
  },
  {
    path: '**',
    component: RouteDispatcherComponent,
    canActivate: [DirectLoginActivateGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
  providers: [RouteDispatcherActivateGuard, DirectLoginActivateGuard,
    CodeInputComponentActivateGuard, AdminComponentActivateGuard,
    SuperAdminComponentActivateGuard, TestComponentActivateGuard,
    AdminOrSuperAdminComponentActivateGuard
  ]
})
export class AppRoutingModule { }
