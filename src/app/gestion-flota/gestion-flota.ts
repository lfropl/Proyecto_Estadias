import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlotaService, OperadorLocal, TipoCaja, VehiculoLocal, VehiculoTipo } from '../flota-service';
import { ToastComponent } from '../components/toast/toast';

@Component({
  selector: 'app-gestion-flota',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './gestion-flota.html',
  styleUrls: ['./gestion-flota.scss'],
})
export class GestionFlota {
  numeroEconomico = ''; numeroVin = ''; placas = '';
  tipo: VehiculoTipo | '' = ''; tipoCaja: TipoCaja | '' = '';
  vencimientoSeguro = ''; aseguradora = ''; polizaSeguro = '';
  cajaConSeguro = false; folioVerificacion = ''; vencimientoVerificacion = '';
  nombre = ''; apellidoPaterno = ''; apellidoMaterno = '';
  folioAptoMedico = ''; vencimientoAptoMedico = ''; rfc = ''; folioLicencia = ''; vencimientoLicencia = '';
  guardando = false;
  toastMsg = ''; toastTipo: 'ok' | 'error' = 'ok'; toastMostrar = false;
  modoEdicion = false; vehiculoEnEdicion: any = null; operadorEnEdicion: OperadorLocal | null = null;
  vehiculos: any[] = []; operadores: OperadorLocal[] = [];
  notificacionesCerradas = new Set<string>();
  modalEliminarVehiculoAbierto = false; vehiculoAEliminar: any = null;
  modalEliminarOperadorAbierto = false; operadorAEliminar: OperadorLocal | null = null;

  get unidades(): any[] { return this.vehiculos.filter((v: any) => v.tipo !== 'caja'); }
  get cajas(): any[] { return this.vehiculos.filter((v: any) => v.tipo === 'caja'); }

  get notificacionesActivas(): { clave: string; mensaje: string }[] {
    return [...this.alertasLicencias, ...this.alertasAptosMedicos, ...this.alertasSeguros]
      .filter((alerta) => !this.notificacionesCerradas.has(alerta.clave));
  }

  get alertasSeguros(): { clave: string; mensaje: string }[] {
    return this.vehiculos.map((u) => {
      const dias = this.diasPara(u.vencimientoSeguro);
      if (dias === null || dias > 30) return null;
      if (dias < 0) return { clave: `seguro-${u.id}`, mensaje: `Seguro vencido de ${u.numeroEconomico}.` };
      return { clave: `seguro-${u.id}`, mensaje: `Seguro de ${u.numeroEconomico} vence en ${dias} día(s).` };
    }).filter((a): a is { clave: string; mensaje: string } => !!a);
  }

  get alertasLicencias(): { clave: string; mensaje: string }[] {
    return this.operadores.map((o) => {
      const dias = this.diasPara(o.vencimientoLicencia);
      if (dias === null || dias > 30) return null;
      const nombreCompleto = `${o.nombre} ${o.apellidoPaterno}`.trim();
      if (dias < 0) return { clave: `lic-${o.id}`, mensaje: `Licencia vencida de ${nombreCompleto}.` };
      return { clave: `lic-${o.id}`, mensaje: `Licencia de ${nombreCompleto} vence en ${dias} día(s).` };
    }).filter((a): a is { clave: string; mensaje: string } => !!a);
  }

  get alertasAptosMedicos(): { clave: string; mensaje: string }[] {
    return this.operadores.map((o) => {
      const dias = this.diasPara(o.vencimientoAptoMedico);
      if (dias === null || dias > 30) return null;
      const nombreCompleto = `${o.nombre} ${o.apellidoPaterno}`.trim();
      if (dias < 0) return { clave: `apto-${o.id}`, mensaje: `Apto médico vencido de ${nombreCompleto}.` };
      return { clave: `apto-${o.id}`, mensaje: `Apto médico de ${nombreCompleto} vence en ${dias} día(s).` };
    }).filter((a): a is { clave: string; mensaje: string } => !!a);
  }

  readonly tipos: { id: VehiculoTipo; label: string }[] = [
    { id: 'tracto', label: 'Tracto' }, { id: 'caja', label: 'Caja (53 pies)' },
    { id: 'camioneta', label: 'Camioneta 3.5T' }, { id: 'van', label: 'Van' },
    { id: 'rabon', label: 'Rabón' }, { id: 'torton', label: 'Torton' },
  ];
  readonly tiposCaja: { id: TipoCaja; label: string }[] = [
    { id: 'thermo', label: 'Thermo' }, { id: 'seca', label: 'Seca' },
  ];

  private readonly flotaService = inject(FlotaService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() { this.refrescar(); }

  onTipoChange(): void { if (this.tipo !== 'caja') { this.tipoCaja = ''; this.cajaConSeguro = false; } }

  private mostrarToast(msg: string, tipo: 'ok' | 'error') {
    this.toastMsg = msg; this.toastTipo = tipo; this.toastMostrar = false;
    setTimeout(() => this.toastMostrar = true, 10);
  }

  async guardar(): Promise<void> {
    if (this.guardando) return; this.guardando = true;
    if (!this.numeroEconomico.trim() || !this.placas.trim() || !this.numeroVin.trim() || !this.tipo) {
      this.mostrarToast('Completa todos los campos obligatorios del vehículo, incluyendo el VIN', 'error'); this.guardando = false; return;
    }
    const res = await this.flotaService.registrarVehiculo({
      numeroEconomico: this.numeroEconomico, placas: this.placas.trim().toUpperCase(),
      numeroVin: this.numeroVin.trim().toUpperCase(), tipo: this.tipo,
      ...(this.tipo === 'caja' ? { tipoCaja: this.tipoCaja as TipoCaja } : {}),
      vencimientoSeguro: this.vencimientoSeguro || undefined, aseguradora: this.aseguradora || undefined,
      polizaSeguro: this.polizaSeguro || undefined, folioVerificacion: this.folioVerificacion || undefined,
      vencimientoVerificacion: this.vencimientoVerificacion || undefined,
    } as any);
    if (!res.success) { this.mostrarToast(res.error || 'No se pudo guardar.', 'error'); this.guardando = false; return; }
    this.mostrarToast('Vehículo guardado con éxito.', 'ok');
    this.numeroEconomico = ''; this.numeroVin = ''; this.placas = ''; this.tipo = ''; this.tipoCaja = '';
    this.vencimientoSeguro = ''; this.aseguradora = ''; this.polizaSeguro = ''; this.cajaConSeguro = false;
    this.folioVerificacion = ''; this.vencimientoVerificacion = '';
    await this.refrescar(); this.cdr.markForCheck(); this.guardando = false;
  }

  async guardarOperador(): Promise<void> {
    if (this.guardando) return; this.guardando = true;
    const res = await this.flotaService.registrarOperador({
      nombre: this.nombre, apellidoPaterno: this.apellidoPaterno, apellidoMaterno: this.apellidoMaterno,
      folioAptoMedico: this.folioAptoMedico, vencimientoAptoMedico: this.vencimientoAptoMedico,
      rfc: this.rfc, folioLicencia: this.folioLicencia, vencimientoLicencia: this.vencimientoLicencia,
    });
    if (!res.success) { this.mostrarToast(res.error || 'No se pudo guardar el operador.', 'error'); this.guardando = false; return; }
    this.mostrarToast('Operador guardado.', 'ok');
    this.nombre = ''; this.apellidoPaterno = ''; this.apellidoMaterno = ''; this.folioAptoMedico = '';
    this.vencimientoAptoMedico = ''; this.rfc = ''; this.folioLicencia = ''; this.vencimientoLicencia = '';
    await this.refrescar(); this.cdr.markForCheck(); this.guardando = false;
  }

  // ─── Confirmación para eliminar vehículo ──────────
  confirmarEliminarVehiculo(v: any) {
    this.vehiculoAEliminar = v; this.modalEliminarVehiculoAbierto = true;
  }
  cerrarModalEliminarVehiculo() { this.modalEliminarVehiculoAbierto = false; this.vehiculoAEliminar = null; }
  async ejecutarEliminarVehiculo() {
    if (!this.vehiculoAEliminar) return;
    await this.flotaService.eliminarVehiculo(this.vehiculoAEliminar.id);
    await this.refrescar(); this.cdr.markForCheck();
    this.mostrarToast(`${this.vehiculoAEliminar.numeroEconomico} eliminado.`, 'ok');
    this.cerrarModalEliminarVehiculo();
  }

  // ─── Confirmación para eliminar operador ─────────
  confirmarEliminarOperador(op: OperadorLocal) {
    this.operadorAEliminar = op; this.modalEliminarOperadorAbierto = true;
  }
  cerrarModalEliminarOperador() { this.modalEliminarOperadorAbierto = false; this.operadorAEliminar = null; }
  async ejecutarEliminarOperador() {
    if (!this.operadorAEliminar) return;
    await this.flotaService.eliminarOperador(this.operadorAEliminar.id);
    await this.refrescar(); this.cdr.markForCheck();
    this.mostrarToast(`${this.operadorAEliminar.nombre} eliminado.`, 'ok');
    this.cerrarModalEliminarOperador();
  }

  cerrarNotificacion(clave: string): void { this.notificacionesCerradas.add(clave); this.cdr.markForCheck(); }

  abrirEdicionVehiculo(vehiculo: any): void { this.modoEdicion = true; this.vehiculoEnEdicion = vehiculo; this.cdr.markForCheck(); }
  abrirEdicionOperador(operador: OperadorLocal): void { this.modoEdicion = true; this.operadorEnEdicion = operador; this.cdr.markForCheck(); }

  async guardarEdicionVehiculo(): Promise<void> {
    if (this.guardando || !this.vehiculoEnEdicion) return; this.guardando = true;
    const actualizado: any = { ...this.vehiculoEnEdicion, numeroEconomico: this.numeroEconomico,
      placas: this.placas.trim().toUpperCase(), numeroVin: this.numeroVin.trim().toUpperCase(),
      tipo: this.tipo as VehiculoTipo, tipoCaja: this.tipo === 'caja' ? (this.tipoCaja as TipoCaja) : undefined,
      vencimientoSeguro: this.vencimientoSeguro, aseguradora: this.aseguradora, polizaSeguro: this.polizaSeguro,
      folioVerificacion: this.folioVerificacion, vencimientoVerificacion: this.vencimientoVerificacion };
    await this.flotaService.actualizarVehiculo(actualizado);
    this.mostrarToast('Vehículo actualizado.', 'ok'); this.cancelarEdicion(); await this.refrescar(); this.cdr.markForCheck(); this.guardando = false;
  }

  async guardarEdicionOperador(): Promise<void> {
    if (this.guardando || !this.operadorEnEdicion) return; this.guardando = true;
    const actualizado: OperadorLocal = { ...this.operadorEnEdicion, nombre: this.nombre.trim(),
      apellidoPaterno: this.apellidoPaterno.trim(), apellidoMaterno: this.apellidoMaterno.trim(),
      folioAptoMedico: this.folioAptoMedico.trim(), vencimientoAptoMedico: this.vencimientoAptoMedico,
      rfc: this.rfc.trim().toUpperCase(), folioLicencia: this.folioLicencia.trim().toUpperCase(),
      vencimientoLicencia: this.vencimientoLicencia };
    await this.flotaService.actualizarOperador(actualizado);
    this.mostrarToast('Operador actualizado.', 'ok'); this.cancelarEdicion(); await this.refrescar(); this.cdr.markForCheck(); this.guardando = false;
  }

  cancelarEdicion(): void { this.modoEdicion = false; this.vehiculoEnEdicion = null; this.operadorEnEdicion = null; this.cdr.markForCheck(); }
  estadoVencimiento(fecha?: string): string { const dias = this.diasPara(fecha); if (dias === null) return 'Sin fecha'; if (dias < 0) return 'Vencido'; if (dias <= 30) return `Próximo (${dias} día(s))`; return `Vigente (${dias} día(s))`; }
  esAlertaVencimiento(fecha?: string): boolean { const dias = this.diasPara(fecha); return dias !== null && dias <= 30; }

  private async refrescar(): Promise<void> {
    this.vehiculos = await this.flotaService.obtenerVehiculos();
    this.operadores = await this.flotaService.obtenerOperadores();
  }

  private diasPara(fecha?: string): number | null {
    if (!fecha) return null;
    const target = new Date(`${fecha}T00:00:00`); const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return Math.floor((target.getTime() - inicioHoy.getTime()) / (1000 * 60 * 60 * 24));
  }
}