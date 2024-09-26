import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ObjectListComponent } from './object-list/object-list.component';
import { ProtocolComponent } from './protocol/protocol.component';

const routes: Routes = [
  { path: 'objects', component: ObjectListComponent },
  { path: 'protocol', component: ProtocolComponent },
  { path: '', redirectTo: '/objects', pathMatch: 'full' } // Стартова сторінка
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
