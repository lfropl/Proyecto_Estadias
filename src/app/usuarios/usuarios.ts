import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiFetch } from '../api-helper';
import { ToastComponent } from '../components/toast/toast';

interface UsuarioLocal {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  puesto: string | null;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
    <section class="usr-shell">
      <h2>Gestión de Usuarios</h2>
      <p class="usr-sub">Solo los administradores pueden crear y eliminar usuarios.</p>

      <app-toast [mensaje]="toastMsg" [tipo]="toastTipo" [mostrar]="toastMostrar"></app-toast>

      <!-- Formulario -->
      <div class="usr-form">
        <h3>Registrar nuevo usuario</h3>
        <div class="usr-row">
          <input type="text" placeholder="Nombre" [(ngModel)]="nuevo.nombre" [disabled]="guardando" />
          <input type="text" placeholder="Apellido" [(ngModel)]="nuevo.apellido" [disabled]="guardando" />
        </div>
        <div class="usr-row">
          <input type="email" placeholder="Correo" [(ngModel)]="nuevo.email" [disabled]="guardando" />
          <select [(ngModel)]="nuevo.puesto" [disabled]="guardando">
            <option value="">Selecciona puesto</option>
            <option value="Administrador">Administrador</option>
            <option value="Operaciones">Operaciones</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
        </div>
        <div class="usr-row">
          <input type="password" placeholder="Contraseña" [(ngModel)]="nuevo.password" [disabled]="guardando" />
          <button (click)="crearUsuario()" [disabled]="guardando">
            {{ guardando ? 'Guardando...' : 'Crear' }}
          </button>
        </div>
      </div>

      <!-- Tabla de usuarios -->
      @if (usuarios.length) {
        <h3>Usuarios registrados</h3>
        <table class="usr-table">
          <thead><tr><th>Correo</th><th>Nombre</th><th>Puesto</th><th></th></tr></thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <tr>
                <td>{{ u.email }}</td>
                <td>{{ u.nombre }} {{ u.apellido }}</td>
                <td>{{ u.puesto || '—' }}</td>
                <td class="usr-actions">
                  <button class="btn-edit" (click)="abrirEdicion(u)" [disabled]="guardando">✎</button>
                  @if (u.email !== sesion?.email) {
                    <button class="btn-del" (click)="confirmarEliminar(u)" [disabled]="guardando">✕</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <!-- Modal de edición -->
      @if (modalEdicionAbierto && usuarioEditando) {
        <div class="modal-backdrop" (click)="cerrarModalEdicion()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>Editar: {{ usuarioEditando.email }}</h3>
            <label>Nombre</label>
            <input type="text" [(ngModel)]="editForm.nombre" [disabled]="guardando" />
            <label>Apellido</label>
            <input type="text" [(ngModel)]="editForm.apellido" [disabled]="guardando" />
            <label>Correo</label>
            <input type="email" [(ngModel)]="editForm.email" [disabled]="guardando" />
            <label>Puesto</label>
            <select [(ngModel)]="editForm.puesto" [disabled]="guardando">
              <option value="">Selecciona puesto</option>
              <option value="Administrador">Administrador</option>
              <option value="Operaciones">Operaciones</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
            <label>Nueva contraseña (dejar vacío para no cambiar)</label>
            <input type="password" [(ngModel)]="editForm.password" placeholder="••••••" [disabled]="guardando" />
            <div class="modal-actions">
              <button class="btn-cancel" (click)="cerrarModalEdicion()" [disabled]="guardando">Cancelar</button>
              <button class="btn-save" (click)="guardarEdicion()" [disabled]="guardando">
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de confirmación eliminar -->
      @if (modalEliminarAbierto && usuarioAEliminar) {
        <div class="modal-backdrop" (click)="cerrarModalEliminar()">
          <div class="modal-card modal-confirm" (click)="$event.stopPropagation()">
            <p>¿Eliminar a <strong>{{ usuarioAEliminar.email }}</strong>?</p>
            <p class="modal-warn">Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="cerrarModalEliminar()" [disabled]="guardando">Cancelar</button>
              <button class="btn-danger" (click)="ejecutarEliminar()" [disabled]="guardando">
                {{ guardando ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .usr-shell { padding: 1.5rem; }
    h2 { margin: 0 0 0.25rem; font-size: 1.3rem; }
    .usr-sub { color: #64748b; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .usr-form {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1.25rem; margin-bottom: 1.5rem;
    }
    .usr-form h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .usr-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    .usr-row input, .usr-row select {
      flex: 1; padding: 0.5rem 0.65rem; border: 1px solid #cbd5e1;
      border-radius: 8px; font-size: 0.85rem; outline: none;
    }
    .usr-row input:focus, .usr-row select:focus { border-color: #2563eb; }
    .usr-row button {
      padding: 0.5rem 1.25rem; background: #2563eb; color: white;
      border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
    }
    .usr-row button:disabled { opacity: 0.5; cursor: not-allowed; }
    .usr-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .usr-table th { text-align: left; padding: 0.5rem; border-bottom: 2px solid #e2e8f0; color: #475569; }
    .usr-table td { padding: 0.5rem; border-bottom: 1px solid #f1f5f9; }
    .usr-actions { display: flex; gap: 0.4rem; justify-content: flex-end; }
    .btn-edit { background: transparent; border: 1px solid #94a3b8; color: #475569; border-radius: 6px; padding: 0.25rem 0.55rem; cursor: pointer; font-size: 0.9rem; }
    .btn-edit:hover:not(:disabled) { background: #e2e8f0; }
    .btn-edit:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-del { background: transparent; border: 1px solid #dc2626; color: #dc2626; border-radius: 6px; padding: 0.25rem 0.55rem; cursor: pointer; font-size: 0.9rem; }
    .btn-del:hover:not(:disabled) { background: #fef2f2; }
    .btn-del:disabled { opacity: 0.4; cursor: not-allowed; }
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.7); display: flex;
      align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: white; border-radius: 16px; padding: 1.5rem 2rem;
      width: 420px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
    }
    .modal-card h3 { margin: 0 0 1rem; font-size: 1.1rem; }
    .modal-card label { display: block; margin: 0.6rem 0 0.2rem; font-size: 0.85rem; color: #475569; }
    .modal-card input, .modal-card select {
      width: 100%; padding: 0.5rem 0.65rem; border: 1px solid #cbd5e1;
      border-radius: 8px; font-size: 0.85rem; outline: none; box-sizing: border-box;
    }
    .modal-card input:focus, .modal-card select:focus { border-color: #2563eb; }
    .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.25rem; }
    .btn-cancel { padding: 0.5rem 1rem; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-save { padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger { padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal-confirm p { margin: 0 0 0.5rem; font-size: 0.95rem; }
    .modal-warn { color: #dc2626; font-size: 0.85rem; }
  `],
})
export class Usuarios implements OnInit {
  usuarios: UsuarioLocal[] = [];
  sesion: UsuarioLocal | null = null;
  guardando = false;
  nuevo = { nombre: '', apellido: '', email: '', puesto: '', password: '' };
  toastMsg = '';
  toastTipo: 'ok' | 'error' = 'ok';
  toastMostrar = false;

  modalEdicionAbierto = false;
  usuarioEditando: UsuarioLocal | null = null;
  editForm = { nombre: '', apellido: '', email: '', puesto: '', password: '' };
  modalEliminarAbierto = false;
  usuarioAEliminar: UsuarioLocal | null = null;

  async ngOnInit() {
    this.sesion = JSON.parse(localStorage.getItem('usuario_sesion_estadias') || 'null');
    await this.cargar();
  }

  async cargar() {
    try {
      const res = await apiFetch('/api/usuarios');
      this.usuarios = await res.json();
    } catch { this.usuarios = []; }
  }

  private mostrarToast(msg: string, tipo: 'ok' | 'error') {
    this.toastMsg = msg;
    this.toastTipo = tipo;
    this.toastMostrar = false;
    setTimeout(() => this.toastMostrar = true, 10);
  }

  async crearUsuario() {
    if (this.guardando) return;
    const { nombre, apellido, email, puesto, password } = this.nuevo;
    if (!nombre || !apellido || !email || !password) {
      this.mostrarToast('Completa todos los campos.', 'error'); return;
    }
    this.guardando = true;
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, nombre: nombre.trim(), apellido: apellido.trim(), puesto: puesto.trim() || 'Usuario' }),
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); this.mostrarToast(err.message || 'Error al crear usuario', 'error'); this.guardando = false; return; }
      this.mostrarToast('Usuario creado correctamente', 'ok');
      this.nuevo = { nombre: '', apellido: '', email: '', puesto: '', password: '' };
      await this.cargar();
    } catch { this.mostrarToast('Error de conexión', 'error'); }
    this.guardando = false;
  }

  abrirEdicion(u: UsuarioLocal) {
    this.usuarioEditando = u;
    this.editForm = { nombre: u.nombre, apellido: u.apellido, email: u.email, puesto: u.puesto || '', password: '' };
    this.modalEdicionAbierto = true;
  }

  cerrarModalEdicion() {
    this.modalEdicionAbierto = false;
    this.usuarioEditando = null;
  }

  async guardarEdicion() {
    if (this.guardando || !this.usuarioEditando) return;
    this.guardando = true;
    const body: any = {};
    if (this.editForm.nombre.trim()) body.nombre = this.editForm.nombre.trim();
    if (this.editForm.apellido.trim()) body.apellido = this.editForm.apellido.trim();
    if (this.editForm.email.trim()) body.email = this.editForm.email.trim();
    if (this.editForm.puesto.trim()) body.puesto = this.editForm.puesto.trim();
    if (this.editForm.password) body.password = this.editForm.password;

    try {
      const res = await apiFetch(`/api/usuarios/${this.usuarioEditando.id}`, { method: 'PUT', body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(()=>({})); this.mostrarToast(err.message || 'Error al actualizar', 'error'); this.guardando = false; return; }
      const updated = await res.json();
      const idx = this.usuarios.findIndex(u => u.id === updated.id);
      if (idx !== -1) this.usuarios[idx] = updated;
      this.mostrarToast('Usuario actualizado', 'ok');
      this.cerrarModalEdicion();
    } catch { this.mostrarToast('Error de conexión', 'error'); }
    this.guardando = false;
  }

  confirmarEliminar(u: UsuarioLocal) {
    this.usuarioAEliminar = u;
    this.modalEliminarAbierto = true;
  }

  cerrarModalEliminar() {
    this.modalEliminarAbierto = false;
    this.usuarioAEliminar = null;
  }

  async ejecutarEliminar() {
    if (this.guardando || !this.usuarioAEliminar) return;
    this.guardando = true;
    try {
      await apiFetch(`/api/usuarios/${this.usuarioAEliminar.id}`, { method: 'DELETE' });
      this.usuarios = this.usuarios.filter(u => u.id !== this.usuarioAEliminar!.id);
      this.mostrarToast(`${this.usuarioAEliminar.email} eliminado`, 'ok');
    } catch { this.mostrarToast('Error al eliminar', 'error'); }
    this.guardando = false;
    this.cerrarModalEliminar();
  }
}