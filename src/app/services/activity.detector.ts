import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { InactivityService } from './inactivity.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityDetector {
  private readonly inactivityService = inject(InactivityService);
  private readonly platformId = inject(PLATFORM_ID);

  detectUserActivity(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, () => {
        this.inactivityService.resetInactivityTimer();
      });
    });
  }

  stopDetectingActivity(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.inactivityService.stopInactivityTimer();
  }
}
