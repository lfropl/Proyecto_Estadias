import { Component, signal, ErrorHandler, Injectable } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';

/**
 * Centralized error handler so any uncaught error is logged in a single place.
 * This is the natural extension point for sending errors to a monitoring
 * service (Sentry, etc.) in the future.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error('Global Error Handler:', error);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
})
export class App {
  protected readonly title = signal('proyecto-Estadias');
}
