import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { SessionService } from './services/session.service';

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
  private readonly usuariosKey = 'usuarios_locales_estadias_json';
  private readonly sesionKey = 'usuario_sesion_estadias';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionService = inject(SessionService);
  private readonly demoUser: UsuarioLocal = {
    id: 'demo_admin',
    nombre: 'Demo',
    apellido: 'Admin',
    correo: 'admin@demo.com',
    puesto: 'Administrador',
    password: '123456',
  };

  login(username: string, password: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      this.authError$.next('Disponible solo en navegador.');
      return false;
    }
    const u = username?.trim().toLowerCase() ?? '';
    const p = password ?? '';

    if (!u || !p) {
      this.authError$.next('Usuario y contrasena son obligatorios.');
      return false;
    }

    const usuarios = this.leerUsuarios();
    const encontrado = usuarios.find((item) => item.correo.toLowerCase() === u && item.password === p);
    if (!encontrado) {
      this.authError$.next('Correo o contrasena incorrectos.');
      return false;
    }

    this.authError$.next('');
    localStorage.setItem(this.sesionKey, JSON.stringify(encontrado));
    this.sessionService.createSession(encontrado.id);
    return true;
  }

  cerrarSesion(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.sesionKey);
    this.sessionService.destroySession();
  }

  haySesionActiva(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const raw = localStorage.getItem(this.sesionKey);
    if (!raw) return false;
    try {
      const sesion = JSON.parse(raw) as UsuarioLocal;
      return !!sesion?.correo;
    } catch {
      return false;
    }
  }

  obtenerSesionActiva(): UsuarioLocal | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(this.sesionKey);
    if (!raw) return null;
    try {
      const sesion = JSON.parse(raw) as UsuarioLocal;
      if (!sesion?.correo) return null;
      return sesion;
    } catch {
      return null;
    }
  }

  private leerUsuarios(): UsuarioLocal[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.usuariosKey);
    if (!raw) {
      localStorage.setItem(this.usuariosKey, JSON.stringify([this.demoUser]));
      return [this.demoUser];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.setItem(this.usuariosKey, JSON.stringify([this.demoUser]));
        return [this.demoUser];
      }
      const usuarios = parsed as UsuarioLocal[];
      const existeDemo = usuarios.some((u) => u.correo.toLowerCase() === this.demoUser.correo);
      if (!existeDemo) {
        const actualizados = [...usuarios, this.demoUser];
        localStorage.setItem(this.usuariosKey, JSON.stringify(actualizados));
        return actualizados;
      }
      return usuarios;
    } catch {
      localStorage.setItem(this.usuariosKey, JSON.stringify([this.demoUser]));
      return [this.demoUser];
    }
  }
}
