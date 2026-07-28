import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { apiFetch } from '../api-helper';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-page">
      <div class="setup-card">
        <h1>⚙️ Configuración Inicial</h1>
        <p>No hay usuarios registrados. Crea la cuenta de administrador principal.</p>

        @if (errorMsg) { <div class="alert alert-error">{{ errorMsg }}</div> }
        @if (exitoMsg) { <div class="alert alert-ok">{{ exitoMsg }}</div> }

        <form (submit)="$event.preventDefault(); crearAdmin()">
          <label>Nombre</label>
          <input type="text" [(ngModel)]="nombre" name="nombre" placeholder="Admin" required />

          <label>Apellido</label>
          <input type="text" [(ngModel)]="apellido" name="apellido" placeholder="Principal" required />

          <label>Correo electrónico</label>
          <input type="email" [(ngModel)]="email" name="email" placeholder="admin@tuempresa.com" required />

          <label>Contraseña</label>
          <input type="password" [(ngModel)]="password" name="password" placeholder="••••••" required />

          <button type="submit" [disabled]="cargando">
            {{ cargando ? 'Creando...' : 'Crear Administrador' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .setup-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      font-family: system-ui, sans-serif;
    }
    .setup-card {
      background: #1e293b;
      padding: 2rem 2.5rem;
      border-radius: 16px;
      width: 400px;
      color: #e2e8f0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { color: #94a3b8; margin-bottom: 1.5rem; font-size: 0.9rem; }
    label { display: block; margin: 0.75rem 0 0.25rem; font-size: 0.85rem; color: #cbd5e1; }
    input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid #334155;
      border-radius: 8px;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 0.95rem;
      outline: none;
      box-sizing: border-box;
    }
    input:focus { border-color: #6366f1; }
    button {
      margin-top: 1.5rem;
      width: 100%;
      padding: 0.7rem;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert { padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
    .alert-error { background: #7f1d1d; color: #fca5a5; }
    .alert-ok { background: #14532d; color: #86efac; }
  `],
})
export class SetupComponent {
  private readonly router = inject(Router);
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  errorMsg = '';
  exitoMsg = '';
  cargando = false;

  async crearAdmin() {
    this.errorMsg = '';
    this.exitoMsg = '';
    if (!this.nombre.trim() || !this.apellido.trim() || !this.email.trim() || !this.password) {
      this.errorMsg = 'Completa todos los campos.'; return;
    }

    this.cargando = true;
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: this.email.trim(),
          password: this.password,
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          puesto: 'Administrador',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.errorMsg = err.message || 'Error al crear el administrador.';
        this.cargando = false;
        return;
      }
      this.exitoMsg = '✅ Administrador creado. Redirigiendo al login...';
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch {
      this.errorMsg = 'Error de conexión con el servidor.';
      this.cargando = false;
    }
  }
}