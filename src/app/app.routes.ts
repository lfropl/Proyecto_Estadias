import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';

/**
 * Application routes.
 *
 * Feature components are lazy-loaded with `loadComponent` so each view ships in
 * its own chunk. This keeps the initial bundle small and makes the app easier
 * to scale as new sections are added.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'vista-general',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'registro-servicios',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'gestion-flota',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'recursos-humanos',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'facturacion',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'nominas',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'cuentas',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'cobranza',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  {
    path: 'mantenimiento',
    canActivate: [authGuard],
    loadComponent: () => import('./vista-general/vista-general').then((m) => m.VistaGeneral),
  },
  { path: '**', redirectTo: 'login' },
];
