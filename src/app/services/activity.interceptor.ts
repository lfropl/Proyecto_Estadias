import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InactivityService } from './inactivity.service';
import { SessionService } from './session.service';

@Injectable()
export class ActivityInterceptor implements HttpInterceptor {
  private readonly inactivityService = inject(InactivityService);
  private readonly sessionService = inject(SessionService);
  private readonly platformId = inject(PLATFORM_ID);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isPlatformBrowser(this.platformId)) {
      this.inactivityService.resetInactivityTimer();
      this.sessionService.refreshSession();
    }

    const sessionToken = this.sessionService.getSessionToken();
    if (sessionToken && req.url.includes('api')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${sessionToken.token}`,
        },
      });
    }

    return next.handle(req);
  }
}
