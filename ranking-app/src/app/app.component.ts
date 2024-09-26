import { Component, OnInit } from '@angular/core';
import { StateService } from './state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private stateService: StateService) {}

  ngOnInit() {
    // Завантажуємо протокол з localStorage при першому завантаженні додатку
    this.stateService.loadProtocolFromStorage();
  }
}
