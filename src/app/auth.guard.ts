import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login-service';
import { SessionService } from './services/session.service';
import { InactivityService } from './services/inactivity.service';
import { ActivityDetector } from './services/activity.detector';

export const authGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const sessionService = inject(SessionService);
  const inactivityService = inject(InactivityService);
  const activityDetector = inject(ActivityDetector);
  const router = inject(Router);

  if (loginService.haySesionActiva() && sessionService.isSessionValid()) {
    inactivityService.startInactivityTimer();
    activityDetector.detectUserActivity();
    return true;
  }

  sessionService.destroySession();
  loginService.cerrarSesion();
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (loginService.haySesionActiva()) {
    return router.createUrlTree(['/vista-general']);
  }
  return true;
};
