import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { VistaGeneral } from './vista-general/vista-general';
import { Registro } from './registro/registro';
import { authGuard, guestGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'vista-general', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'registro-servicios', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'gestion-flota', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'recursos-humanos', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'facturacion', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'nominas', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'cuentas', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'cobranza', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'mantenimiento', component: VistaGeneral, canActivate: [authGuard] },
  { path: 'registro', component: Registro, canActivate: [guestGuard] },
  { path: '**', redirectTo: 'login' }
];