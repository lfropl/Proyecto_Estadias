import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClienteLocal, ClientesService } from '../clientes-service';
import { ToastComponent } from '../components/toast/toast';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
})
export class Clientes {
  private readonly clientesService = inject(ClientesService);
  private readonly cdr = inject(ChangeDetectorRef);

  clientes: ClienteLocal[] = [];
  guardando = false;
  toastMsg = ''; toastTipo: 'ok' | 'error' = 'ok'; toastMostrar = false;

  modalAbierto = false;
  editando = false;
  clienteId = '';
  nombre = ''; rfc = ''; direccionFiscal = '';
  modalEliminarAbierto = false;
  clienteAEliminar: ClienteLocal | null = null;

  constructor() {
    this.clientesService.clientes$.subscribe(clientes => {
      this.clientes = clientes;
      this.cdr.markForCheck();
    });
  }

  private async cargarClientes(): Promise<void> {
    await this.clientesService.obtenerClientes();
  }

  private mostrarToast(msg: string, tipo: 'ok' | 'error') {
    this.toastMsg = msg; this.toastTipo = tipo;
    this.toastMostrar = false;
    setTimeout(() => this.toastMostrar = true, 10);
  }

  abrirModalNuevo(): void {
    this.editando = false; this.clienteId = '';
    this.nombre = ''; this.rfc = ''; this.direccionFiscal = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(c: ClienteLocal): void {
    this.editando = true; this.clienteId = c.id;
    this.nombre = c.nombre; this.rfc = c.rfc || ''; this.direccionFiscal = c.direccionFiscal || '';
    this.modalAbierto = true;
  }

  cerrarModal(): void { this.modalAbierto = false; }

  async guardarCliente(): Promise<void> {
    if (this.guardando) return;
    if (!this.nombre.trim()) {
      this.mostrarToast('El nombre del cliente es obligatorio.', 'error'); return;
    }
    this.guardando = true;
    try {
      if (this.editando) {
        await this.clientesService.actualizarCliente(this.clienteId, {
          nombre: this.nombre.trim(), rfc: this.rfc.trim() || undefined,
          direccionFiscal: this.direccionFiscal.trim() || undefined,
        });
        this.mostrarToast('Cliente actualizado.', 'ok');
      } else {
        await this.clientesService.agregarCliente({
          nombre: this.nombre.trim(), rfc: this.rfc.trim() || undefined,
          direccionFiscal: this.direccionFiscal.trim() || undefined,
        });
        this.mostrarToast('Cliente agregado.', 'ok');
      }
      this.cerrarModal();
      await this.cargarClientes();
    } catch { this.mostrarToast('Error al guardar.', 'error'); }
    this.guardando = false;
  }

  confirmarEliminar(c: ClienteLocal): void {
    this.clienteAEliminar = c; this.modalEliminarAbierto = true;
  }

  cerrarModalEliminar(): void {
    this.modalEliminarAbierto = false; this.clienteAEliminar = null;
  }

  async ejecutarEliminar(): Promise<void> {
    if (this.guardando || !this.clienteAEliminar) return;
    this.guardando = true;
    try {
      await this.clientesService.eliminarCliente(this.clienteAEliminar.id);
      await this.cargarClientes();
      this.mostrarToast(`Cliente "${this.clienteAEliminar.nombre}" eliminado.`, 'ok');
    } catch { this.mostrarToast('Error al eliminar.', 'error'); }
    this.guardando = false;
    this.cerrarModalEliminar();
  }

  trackById(_: number, c: ClienteLocal): string { return c.id; }
}