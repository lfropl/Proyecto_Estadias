import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlotaService, VehiculoLocal } from '../flota-service';
import { MantenimientoRecord, MantenimientoService } from '../mantenimiento-service';
import { ToastComponent } from '../components/toast/toast';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './mantenimiento.html',
  styleUrl: './mantenimiento.scss',
})
export class Mantenimiento {
  private readonly flotaService = inject(FlotaService);
  private readonly mantenimientoService = inject(MantenimientoService);
  private readonly cdr = inject(ChangeDetectorRef);

  vehiculos: VehiculoLocal[] = [];
  registros: MantenimientoRecord[] = [];
  guardando = false;
  toastMsg = ''; toastTipo: 'ok' | 'error' = 'ok'; toastMostrar = false;

  modalAbierto = false;
  fecha = ''; unidadId = ''; descripcion = ''; costo: number | null = null;

  modalEliminarAbierto = false;
  registroAEliminar: MantenimientoRecord | null = null;

  constructor() { this.cargarDatos(); }

  private async cargarDatos(): Promise<void> {
    this.vehiculos = await this.flotaService.obtenerVehiculos();
    this.registros = await this.mantenimientoService.obtenerRegistros();
    this.cdr.markForCheck();
  }

  private mostrarToast(msg: string, tipo: 'ok' | 'error') {
    this.toastMsg = msg; this.toastTipo = tipo;
    this.toastMostrar = false;
    setTimeout(() => this.toastMostrar = true, 10);
  }

  trackById(_: number, r: MantenimientoRecord): string { return r.id; }
  trackByVehiculo(_: number, v: VehiculoLocal): string { return v.id; }

  abrirModalNuevo(): void {
    this.fecha = new Date().toISOString().split('T')[0];
    this.unidadId = ''; this.descripcion = ''; this.costo = null;
    this.modalAbierto = true;
  }

  cerrarModal(): void { this.modalAbierto = false; }

  async guardarRegistro(): Promise<void> {
    if (this.guardando) return;
    if (!this.fecha) { this.mostrarToast('Selecciona la fecha.', 'error'); return; }
    if (!this.unidadId) { this.mostrarToast('Selecciona la unidad.', 'error'); return; }
    if (!this.descripcion.trim()) { this.mostrarToast('Describe el trabajo realizado.', 'error'); return; }
    if (!this.costo || this.costo <= 0) { this.mostrarToast('El costo debe ser mayor a 0.', 'error'); return; }

    this.guardando = true;
    const unidad = this.vehiculos.find((v) => v.id === this.unidadId);
    const unidadNombre = unidad ? `${unidad.numeroEconomico} (${unidad.tipo})` : this.unidadId;

    const resultado = await this.mantenimientoService.agregarRegistro({
      fecha: this.fecha, unidadId: this.unidadId, unidadNombre,
      descripcion: this.descripcion.trim(), costo: this.costo,
    });
    if (!resultado.success) { this.mostrarToast(resultado.error || 'Error al guardar.', 'error'); this.guardando = false; return; }
    this.registros = await this.mantenimientoService.obtenerRegistros();
    this.mostrarToast('Registro de mantenimiento guardado.', 'ok');
    this.cerrarModal(); this.cdr.markForCheck();
    this.guardando = false;
  }

  confirmarEliminar(r: MantenimientoRecord): void {
    this.registroAEliminar = r; this.modalEliminarAbierto = true;
  }

  cerrarModalEliminar(): void {
    this.modalEliminarAbierto = false; this.registroAEliminar = null;
  }

  async ejecutarEliminar(): Promise<void> {
    if (this.guardando || !this.registroAEliminar) return;
    this.guardando = true;
    await this.mantenimientoService.eliminarRegistro(this.registroAEliminar.id);
    this.registros = await this.mantenimientoService.obtenerRegistros();
    this.mostrarToast('Registro eliminado.', 'ok');
    this.guardando = false;
    this.cerrarModalEliminar(); this.cdr.markForCheck();
  }

  totalGastos(): number { return this.registros.reduce((sum, r) => sum + r.costo, 0); }
  formatearMoneda(valor: number): string { return `$${valor.toFixed(2)}`; }
}