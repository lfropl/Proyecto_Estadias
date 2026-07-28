import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlotaService, OperadorLocal } from '../flota-service';
import { ToastComponent } from '../components/toast/toast';

@Component({
  selector: 'app-recursos-humanos',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './recursos-humanos.html',
  styleUrls: ['./recursos-humanos.scss'],
})
export class RecursosHumanos implements OnInit {
  rol: 'Operador' | 'Administrativo' | 'Monitoreo' | 'Mantenimiento' = 'Operador';
  nombre = ''; apellidoPaterno = ''; apellidoMaterno = '';
  folioAptoMedico = ''; vencimientoAptoMedico = '';
  rfc = ''; curp = ''; nss = ''; infonavit = ''; fechaIngreso = '';
  salarioDiario: number | null = null;
  tipoContrato: 'base' | 'eventual' | 'honorarios' = 'base';
  folioLicencia = ''; vencimientoLicencia = '';
  estatus: 'activo' | 'baja' = 'activo';
  guardando = false;
  toastMsg = ''; toastTipo: 'ok' | 'error' = 'ok'; toastMostrar = false;
  modoEdicion = false; operadorEnEdicion: any = null;
  operadores: any[] = [];
  modalEliminarAbierto = false;
  operadorAEliminar: any = null;

  private readonly flotaService = inject(FlotaService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.refrescar();
    this.cdr.markForCheck();
  }

  private mostrarToast(msg: string, tipo: 'ok' | 'error') {
    this.toastMsg = msg; this.toastTipo = tipo;
    this.toastMostrar = false;
    setTimeout(() => this.toastMostrar = true, 10);
  }

  async guardarOperador(): Promise<void> {
    if (this.guardando) return;
    if (!this.nombre.trim() || !this.apellidoPaterno.trim() || !this.apellidoMaterno.trim()) {
      this.mostrarToast('Completa nombre y apellidos.', 'error'); return;
    }
    if (!this.rfc.trim()) { this.mostrarToast('El RFC es obligatorio.', 'error'); return; }
    if (!this.curp.trim()) { this.mostrarToast('La CURP es obligatoria.', 'error'); return; }
    if (!this.nss.trim()) { this.mostrarToast('El NSS (IMSS) es obligatorio.', 'error'); return; }
    if (!this.fechaIngreso) { this.mostrarToast('La fecha de ingreso es obligatoria.', 'error'); return; }
    if (!this.salarioDiario || this.salarioDiario <= 0) {
      this.mostrarToast('El salario diario debe ser mayor a 0.', 'error'); return;
    }

    if (this.estatus === 'baja') {
      const rfcBusqueda = this.rfc.trim().toUpperCase();
      const empleadoExistente = this.operadores.find((op) => op.rfc === rfcBusqueda);
      if (!empleadoExistente) {
        this.mostrarToast('No se encontró el empleado con ese RFC para dar de baja.', 'error'); return;
      }
      this.guardando = true;
      await this.flotaService.eliminarOperador(empleadoExistente.id);
      await this.refrescar(); this.resetFormulario();
      this.mostrarToast('Empleado dado de baja con éxito.', 'ok');
      this.guardando = false; return;
    }

    const esChofer = this.rol === 'Operador';
    if (esChofer && (!this.folioAptoMedico.trim() || !this.vencimientoAptoMedico.trim() || !this.folioLicencia.trim() || !this.vencimientoLicencia)) {
      this.mostrarToast('Los operadores requieren folios y fechas de vencimiento médicas y de licencia.', 'error'); return;
    }

    this.guardando = true;
    const esOp = this.rol === 'Operador';
    const resultado = await this.flotaService.registrarOperador({
      nombre: this.nombre.trim(), apellidoPaterno: this.apellidoPaterno.trim(),
      apellidoMaterno: this.apellidoMaterno.trim(), rfc: this.rfc.trim().toUpperCase(),
      curp: this.curp.trim().toUpperCase(), nss: this.nss.trim(),
      infonavit: this.infonavit.trim().toUpperCase() || undefined, fechaIngreso: this.fechaIngreso,
      salarioDiario: this.salarioDiario, tipoContrato: this.tipoContrato,
      rol: this.rol, estatus: this.estatus,
      folioAptoMedico: esOp ? this.folioAptoMedico.trim() : '',
      vencimientoAptoMedico: esOp ? this.vencimientoAptoMedico : '',
      folioLicencia: esOp ? this.folioLicencia.trim() : '',
      vencimientoLicencia: esOp ? this.vencimientoLicencia : '',
    } as any);
    if (!resultado.success) { this.mostrarToast(resultado.error || 'No se pudo guardar.', 'error'); this.guardando = false; return; }
    await this.refrescar(); this.resetFormulario();
    this.mostrarToast('Empleado guardado en recursos humanos con éxito.', 'ok');
    this.guardando = false;
  }

  confirmarEliminarOperador(op: any) {
    this.operadorAEliminar = op; this.modalEliminarAbierto = true;
  }
  cerrarModalEliminar() {
    this.modalEliminarAbierto = false; this.operadorAEliminar = null;
  }
  async ejecutarEliminarOperador() {
    if (!this.operadorAEliminar) return;
    await this.flotaService.eliminarOperador(this.operadorAEliminar.id);
    await this.refrescar();
    this.mostrarToast(`${this.operadorAEliminar.nombre} ${this.operadorAEliminar.apellidoPaterno} eliminado.`, 'ok');
    this.cerrarModalEliminar();
  }

  abrirEdicionOperador(operador: any): void {
    this.modoEdicion = true; this.operadorEnEdicion = operador;
    this.rol = operador.rol || 'Operador'; this.nombre = operador.nombre;
    this.apellidoPaterno = operador.apellidoPaterno; this.apellidoMaterno = operador.apellidoMaterno;
    this.rfc = operador.rfc; this.curp = operador.curp || ''; this.nss = operador.nss || '';
    this.infonavit = operador.infonavit || ''; this.fechaIngreso = operador.fechaIngreso || '';
    this.salarioDiario = operador.salarioDiario || null; this.tipoContrato = operador.tipoContrato || 'base';
    this.folioAptoMedico = operador.folioAptoMedico || ''; this.vencimientoAptoMedico = operador.vencimientoAptoMedico || '';
    this.folioLicencia = operador.folioLicencia || ''; this.vencimientoLicencia = operador.vencimientoLicencia || '';
    this.estatus = operador.estatus || 'activo'; this.cdr.markForCheck();
  }

  async guardarEdicionOperador(): Promise<void> {
    if (this.guardando || !this.operadorEnEdicion) return;
    if (!this.nombre.trim() || !this.apellidoPaterno.trim() || !this.apellidoMaterno.trim() || !this.rfc.trim()) {
      this.mostrarToast('Completa los campos básicos obligatorios.', 'error'); return;
    }
    if (!this.curp.trim()) { this.mostrarToast('La CURP es obligatoria.', 'error'); return; }
    if (!this.nss.trim()) { this.mostrarToast('El NSS (IMSS) es obligatorio.', 'error'); return; }
    if (this.rol === 'Operador' && (!this.folioAptoMedico.trim() || !this.vencimientoAptoMedico || !this.folioLicencia.trim() || !this.vencimientoLicencia)) {
      this.mostrarToast('Completa las licencias y datos médicos del operador.', 'error'); return;
    }
    this.guardando = true;
    const esOp = this.rol === 'Operador';
    const actualizado: any = { ...this.operadorEnEdicion, nombre: this.nombre.trim(),
      apellidoPaterno: this.apellidoPaterno.trim(), apellidoMaterno: this.apellidoMaterno.trim(),
      rfc: this.rfc.trim().toUpperCase(), curp: this.curp.trim().toUpperCase(),
      nss: this.nss.trim(), infonavit: this.infonavit.trim().toUpperCase() || undefined,
      fechaIngreso: this.fechaIngreso, salarioDiario: this.salarioDiario,
      tipoContrato: this.tipoContrato, rol: this.rol, estatus: this.estatus,
      folioAptoMedico: esOp ? this.folioAptoMedico.trim() : '',
      vencimientoAptoMedico: esOp ? this.vencimientoAptoMedico : '',
      folioLicencia: esOp ? this.folioLicencia.trim() : '',
      vencimientoLicencia: esOp ? this.vencimientoLicencia : '',
    };
    await this.flotaService.actualizarOperador(actualizado);
    this.mostrarToast('Personal actualizado.', 'ok');
    this.cancelarEdicion(); await this.refrescar(); this.cdr.markForCheck();
    this.guardando = false;
  }

  cancelarEdicion(): void { this.modoEdicion = false; this.operadorEnEdicion = null; this.resetFormulario(); this.cdr.markForCheck(); }
  estadoVencimiento(fecha?: string): string { const dias = this.diasPara(fecha); if (dias === null) return 'Sin fecha'; if (dias < 0) return 'Vencido'; if (dias <= 30) return `Próximo (${dias} día(s))`; return `Vigente (${dias} día(s))`; }
  esAlertaVencimiento(fecha?: string): boolean { const dias = this.diasPara(fecha); return dias !== null && dias <= 30; }
  formatearMoneda(valor: number | null | undefined): string { if (valor == null) return '—'; return `$${Number(valor).toFixed(2)}`; }

  private resetFormulario(): void {
    this.rol = 'Operador'; this.nombre = ''; this.apellidoPaterno = ''; this.apellidoMaterno = '';
    this.folioAptoMedico = ''; this.vencimientoAptoMedico = ''; this.rfc = ''; this.curp = ''; this.nss = '';
    this.infonavit = ''; this.fechaIngreso = ''; this.salarioDiario = null; this.tipoContrato = 'base';
    this.folioLicencia = ''; this.vencimientoLicencia = ''; this.estatus = 'activo';
  }

  private async refrescar(): Promise<void> {
    this.operadores = await this.flotaService.obtenerOperadores();
    this.cdr.markForCheck();
  }

  private diasPara(fecha?: string): number | null {
    if (!fecha) return null;
    const target = new Date(`${fecha}T00:00:00`); const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.floor((target.getTime() - inicioHoy.getTime()) / (1000 * 60 * 60 * 24));
  }
}