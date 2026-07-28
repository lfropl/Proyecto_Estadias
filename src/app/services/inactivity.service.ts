import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {
  private readonly INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutos
  private inactivityTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly inactivityWarning$ = new Subject<void>();

  startInactivityTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.clearInactivityTimer();

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.INACTIVITY_TIME);
  }

  resetInactivityTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.startInactivityTimer();
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }

  private handleInactivity(): void {
    localStorage.removeItem('usuario_sesion_estadias');
    this.inactivityWarning$.next();
    this.router.navigate(['/login']);
  }

  stopInactivityTimer(): void {
    this.clearInactivityTimer();
  }
}
