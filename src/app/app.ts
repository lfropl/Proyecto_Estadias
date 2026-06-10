import { Component, signal, ErrorHandler, Injectable, Injector, OnInit } from '@angular/core';
import {
  IonApp,
  IonRouterOutlet
} from '@ionic/angular/standalone';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    console.error('Global Error Handler:', error);
  }
}

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]
})
export class App implements OnInit {
  protected readonly title = signal('proyecto-Estadias');

  ngOnInit(): void {
    console.log('App initialized');
  }
}
