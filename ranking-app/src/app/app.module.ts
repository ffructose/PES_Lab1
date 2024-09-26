import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ObjectListComponent } from './object-list/object-list.component';
import { ProtocolComponent } from './protocol/protocol.component';
import { AppRoutingModule } from './app-routing.module'; // Імпорт маршрутизації

@NgModule({
  declarations: [
    AppComponent,
    ObjectListComponent,
    ProtocolComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule  // Підключаємо маршрутизацію
  ],
  providers: [],
  bootstrap: [AppComponent]  // Основний компонент додатка
})
export class AppModule { }
