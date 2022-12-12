import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AttachmentManagerComponent } from '../components/attachment-manager/attachment-manager.component';
import { CaptureImageComponent } from '../components/capture-image/capture-image.component';
import { AttachmentOverviewComponent } from '../components/attachment-overview/attachment-overview.component';

const routes: Routes = [
  {
    path: ':group-name',
    component: AttachmentManagerComponent,
    children: [
      {
        path: '',
        redirectTo: 'attachment-overview',
        pathMatch: 'full'
      },
      {
        path: 'capture-image',
        component: CaptureImageComponent
      },
      {
        path: 'attachment-overview',
        component: AttachmentOverviewComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttachmentManagerRoutingModule { }
