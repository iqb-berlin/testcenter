import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AttachmentManagerComponent } from './components/attachment-manager/attachment-manager.component';

const routes: Routes = [
  { path: ':group-name', component: AttachmentManagerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttachmentManagerRoutingModule { }
