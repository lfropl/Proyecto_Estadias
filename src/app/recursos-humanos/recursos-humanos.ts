import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlotaService, OperadorLocal } from '../flota-service';

@Component({
  selector: 'app-recursos-humanos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recursos-humanos.html',
  styleUrls: ['./recursos-humanos.scss'],
})
export class RecursosHumanos {
  nombre = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  folioAptoMedico = '';
  vencimientoAptoMedico = '';
  rfc = '';
  folioLicencia = '';
  vencimientoLicencia = '';
  estatus: 'activo' | 'baja' = 'activo';

  errorMsg = '';
  exitoMsg = '';

  // Edición
  modoEdicion = false;
  operadorEnEdicion: OperadorLocal | null = null;

  operadores: OperadorLocal[] = [];

  private readonly flotaService = inject(FlotaService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.refrescar();
  }

  guardarOperador(): void {
    this.errorMsg = '';
    this.exitoMsg = '';

    if (this.estatus === 'baja') {
      const rfcBusqueda = this.rfc.trim().toUpperCase();
      const licenciaBusqueda = this.folioLicencia.trim().toUpperCase();
      if (!rfcBusqueda && !licenciaBusqueda) {
        this.errorMsg = 'Para dar de baja, captura RFC o folio de licencia.';
        return;
      }
      const operadorExistente = this.operadores.find(
        (op) => (rfcBusqueda && op.rfc === rfcBusqueda) || (licenciaBusqueda && op.folioLicencia === licenciaBusqueda)
      );
      if (!operadorExistente) {
        this.errorMsg = 'No se encontró operador para dar de baja.';
        return;
      }
      this.flotaService.eliminarOperador(operadorExistente.id);
      this.refrescar();
      this.resetFormulario();
      this.exitoMsg = 'Operador dado de baja y eliminado completamente.';
      return;
    }

    if (
      !this.nombre.trim() ||
      !this.apellidoPaterno.trim() ||
      !this.apellidoMaterno.trim() ||
      !this.folioAptoMedico.trim() ||
      !this.vencimientoAptoMedico ||
      !this.rfc.trim() ||
      !this.folioLicencia.trim() ||
      !this.vencimientoLicencia
    ) {
      this.errorMsg = 'Completa todos los campos del operador.';
      return;
    }

    const resultado = this.flotaService.registrarOperador({
      nombre: this.nombre.trim(),
      apellidoPaterno: this.apellidoPaterno.trim(),
      apellidoMaterno: this.apellidoMaterno.trim(),
      folioAptoMedico: this.folioAptoMedico.trim(),
      vencimientoAptoMedico: this.vencimientoAptoMedico,
      rfc: this.rfc.trim().toUpperCase(),
      folioLicencia: this.folioLicencia.trim().toUpperCase(),
      vencimientoLicencia: this.vencimientoLicencia,
    });
    if (!resultado.success) {
      this.errorMsg = resultado.error || 'No se pudo guardar.';
      return;
    }
    this.refrescar();
    this.resetFormulario();
    this.exitoMsg = 'Operador guardado en RH.';
  }

  eliminarOperador(id: string): void {
    this.flotaService.eliminarOperador(id);
    this.refrescar();
  }

  abrirEdicionOperador(operador: OperadorLocal): void {
    this.modoEdicion = true;
    this.operadorEnEdicion = operador;
    this.nombre = operador.nombre;
    this.apellidoPaterno = operador.apellidoPaterno;
    this.apellidoMaterno = operador.apellidoMaterno;
    this.folioAptoMedico = operador.folioAptoMedico;
    this.vencimientoAptoMedico = operador.vencimientoAptoMedico || '';
    this.rfc = operador.rfc;
    this.folioLicencia = operador.folioLicencia;
    this.vencimientoLicencia = operador.vencimientoLicencia;
    this.cdr.markForCheck();
  }

  guardarEdicionOperador(): void {
    if (!this.operadorEnEdicion) return;

    this.errorMsg = '';
    this.exitoMsg = '';

    if (
      !this.nombre.trim() ||
      !this.apellidoPaterno.trim() ||
      !this.apellidoMaterno.trim() ||
      !this.folioAptoMedico.trim() ||
      !this.vencimientoAptoMedico ||
      !this.rfc.trim() ||
      !this.folioLicencia.trim() ||
      !this.vencimientoLicencia
    ) {
      this.errorMsg = 'Completa todos los campos del operador.';
      this.cdr.markForCheck();
      return;
    }

    const actualizado: OperadorLocal = {
      ...this.operadorEnEdicion,
      nombre: this.nombre.trim(),
      apellidoPaterno: this.apellidoPaterno.trim(),
      apellidoMaterno: this.apellidoMaterno.trim(),
      folioAptoMedico: this.folioAptoMedico.trim(),
      vencimientoAptoMedico: this.vencimientoAptoMedico,
      rfc: this.rfc.trim().toUpperCase(),
      folioLicencia: this.folioLicencia.trim().toUpperCase(),
      vencimientoLicencia: this.vencimientoLicencia,
    };

    this.flotaService.actualizarOperador(actualizado);
    this.exitoMsg = 'Operador actualizado.';
    this.cancelarEdicion();
    this.refrescar();
    this.cdr.markForCheck();
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.operadorEnEdicion = null;
    this.resetFormulario();
    this.cdr.markForCheck();
  }

  estadoVencimiento(fecha?: string): string {
    const dias = this.diasPara(fecha);
    if (dias === null) return 'Sin fecha';
    if (dias < 0) return 'Vencido';
    if (dias <= 30) return `Proximo (${dias} dia(s))`;
    return `Vigente (${dias} dia(s))`;
  }

  esAlertaVencimiento(fecha?: string): boolean {
    const dias = this.diasPara(fecha);
    return dias !== null && dias <= 30;
  }

  private resetFormulario(): void {
    this.nombre = '';
    this.apellidoPaterno = '';
    this.apellidoMaterno = '';
    this.folioAptoMedico = '';
    this.vencimientoAptoMedico = '';
    this.rfc = '';
    this.folioLicencia = '';
    this.vencimientoLicencia = '';
    this.estatus = 'activo';
  }

  private refrescar(): void {
    this.operadores = this.flotaService.obtenerOperadores();
  }

  private diasPara(fecha?: string): number | null {
    if (!fecha) return null;
    const target = new Date(`${fecha}T00:00:00`);
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const diff = target.getTime() - inicioHoy.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
