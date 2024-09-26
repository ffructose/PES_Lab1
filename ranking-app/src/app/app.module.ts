import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ObjectListComponent } from './object-list/object-list.component';
import { ProtocolComponent } from './protocol/protocol.component';

@NgModule({
  declarations: [
    AppComponent,
    ObjectListComponent,
    ProtocolComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
