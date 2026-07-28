import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { SessionService } from './services/session.service';
import { apiFetch, guardarToken, eliminarToken } from './api-helper';

export interface UsuarioLocal {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  puesto: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  readonly authError$ = new BehaviorSubject<string>('');
  private readonly sesionKey = 'usuario_sesion_estadias';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionService = inject(SessionService);

  async login(username: string, password: string): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      this.authError$.next('Disponible solo en navegador.');
      return false;
    }

    const u = username?.trim().toLowerCase() ?? '';
    const p = password ?? '';

    if (!u || !p) {
      this.authError$.next('Usuario y contraseña son obligatorios.');
      return false;
    }

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: u, password: p }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        this.authError$.next(error.message || 'Correo o contraseña incorrectos.');
        return false;
      }

      const usuario = await response.json();
      this.authError$.next('');
      // Guardar token JWT
      if (usuario.token) {
        guardarToken(usuario.token);
        delete usuario.token;
      }
      localStorage.setItem(this.sesionKey, JSON.stringify(usuario));
      this.sessionService.createSession(usuario.id);
      return true;
    } catch {
      this.authError$.next('Error de conexión con el servidor.');
      return false;
    }
  }

  cerrarSesion(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.sesionKey);
    eliminarToken();
    this.sessionService.destroySession();
  }

  haySesionActiva(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const raw = localStorage.getItem(this.sesionKey);
    if (!raw) return false;
    try {
      const sesion = JSON.parse(raw);
      return !!sesion?.email;
    } catch {
      return false;
    }
  }

  obtenerSesionActiva(): UsuarioLocal | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(this.sesionKey);
    if (!raw) return null;
    try {
      const sesion = JSON.parse(raw);
      if (!sesion?.email) return null;
      return sesion;
    } catch {
      return null;
    }
  }
}
