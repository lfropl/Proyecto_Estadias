import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FlotaService,
  OperadorLocal,
  TipoCaja,
  VehiculoLocal,
  VehiculoTipo,
} from '../flota-service';

@Component({
  selector: 'app-gestion-flota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-flota.html',
  styleUrls: ['./gestion-flota.scss'],
})
export class GestionFlota {
  numeroEconomico = '';
  placas = '';
  tipo: VehiculoTipo | '' = '';
  tipoCaja: TipoCaja | '' = '';
  vencimientoSeguro = '';
  aseguradora = '';
  polizaSeguro = '';
  cajaConSeguro = false;
  folioVerificacion = '';
  vencimientoVerificacion = '';

  nombre = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  folioAptoMedico = '';
  vencimientoAptoMedico = '';
  rfc = '';
  folioLicencia = '';
  vencimientoLicencia = '';

  errorMsg = '';
  exitoMsg = '';

  // Edición
  modoEdicion = false;
  vehiculoEnEdicion: VehiculoLocal | null = null;
  operadorEnEdicion: OperadorLocal | null = null;

  vehiculos: VehiculoLocal[] = [];
  operadores: OperadorLocal[] = [];
  get unidades(): VehiculoLocal[] {
    return this.vehiculos.filter((v) => v.tipo !== 'caja');
  }

  get cajas(): VehiculoLocal[] {
    return this.vehiculos.filter((v) => v.tipo === 'caja');
  }

  get alertasSeguros(): { clave: string; mensaje: string }[] {
    return this.vehiculos
      .map((u) => {
        const dias = this.diasPara(u.vencimientoSeguro);
        if (dias === null || dias > 30) return null;
        const detallePoliza = u.polizaSeguro ? ` Póliza: ${u.polizaSeguro}.` : '';
        if (dias < 0) {
          return {
            clave: `seguro-${u.id}`,
            mensaje: `Seguro vencido de ${u.numeroEconomico}.${detallePoliza}`,
          };
        }
        return {
          clave: `seguro-${u.id}`,
          mensaje: `Seguro de ${u.numeroEconomico} vence en ${dias} día(s).${detallePoliza}`,
        };
      })
      .filter((a): a is { clave: string; mensaje: string } => !!a);
  }

  get alertasLicencias(): { clave: string; mensaje: string }[] {
    return this.operadores
      .map((o) => {
        const dias = this.diasPara(o.vencimientoLicencia);
        if (dias === null || dias > 30) return null;
        const nombreCompleto = `${o.nombre} ${o.apellidoPaterno}`.trim();
        if (dias < 0) {
          return {
            clave: `lic-${o.id}`,
            mensaje: `Licencia vencida de ${nombreCompleto}.`,
          };
        }
        return {
          clave: `lic-${o.id}`,
          mensaje: `Licencia de ${nombreCompleto} vence en ${dias} día(s).`,
        };
      })
      .filter((a): a is { clave: string; mensaje: string } => !!a);
  }

  get alertasAptosMedicos(): { clave: string; mensaje: string }[] {
    return this.operadores
      .map((o) => {
        const dias = this.diasPara(o.vencimientoAptoMedico);
        if (dias === null || dias > 30) return null;
        const nombreCompleto = `${o.nombre} ${o.apellidoPaterno}`.trim();
        if (dias < 0) {
          return {
            clave: `apto-${o.id}`,
            mensaje: `Apto médico vencido de ${nombreCompleto}.`,
          };
        }
        return {
          clave: `apto-${o.id}`,
          mensaje: `Apto médico de ${nombreCompleto} vence en ${dias} día(s).`,
        };
      })
      .filter((a): a is { clave: string; mensaje: string } => !!a);
  }

  notificacionesCerradas = new Set<string>();

  get notificacionesActivas(): { clave: string; mensaje: string }[] {
    return [...this.alertasLicencias, ...this.alertasAptosMedicos, ...this.alertasSeguros].filter(
      (alerta) => !this.notificacionesCerradas.has(alerta.clave),
    );
  }

  readonly tipos: { id: VehiculoTipo; label: string }[] = [
    { id: 'tracto', label: 'Tracto' },
    { id: 'caja', label: 'Caja (53 pies)' },
    { id: 'camioneta', label: 'Camioneta 3.5T' },
    { id: 'van', label: 'Van' },
    { id: 'rabon', label: 'Rabón' },
    { id: 'torton', label: 'Torton' },
  ];

  readonly tiposCaja: { id: TipoCaja; label: string }[] = [
    { id: 'thermo', label: 'Thermo' },
    { id: 'seca', label: 'Seca' },
  ];

  private readonly flotaService = inject(FlotaService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.refrescar();
  }

  onTipoChange(): void {
    if (this.tipo !== 'caja') {
      this.tipoCaja = '';
      this.cajaConSeguro = false;
    }
  }

  guardar(): void {
    this.errorMsg = '';
    this.exitoMsg = '';

    if (!this.numeroEconomico.trim() || !this.placas.trim() || !this.tipo) {
      this.errorMsg = 'Completa # económico, placas y tipo.';
      this.cdr.markForCheck();
      return;
    }
    if (this.tipo === 'caja' && !this.tipoCaja) {
      this.errorMsg = 'Selecciona el tipo de caja.';
      this.cdr.markForCheck();
      return;
    }
    if (this.tipo === 'caja' && this.cajaConSeguro && !this.vencimientoSeguro) {
      this.errorMsg = 'Indica el vencimiento del seguro de la caja.';
      this.cdr.markForCheck();
      return;
    }

    const res = this.flotaService.registrarVehiculo({
      numeroEconomico: this.numeroEconomico,
      placas: this.placas,
      tipo: this.tipo,
      ...(this.tipo === 'caja' ? { tipoCaja: this.tipoCaja as TipoCaja } : {}),
      ...(this.vencimientoSeguro ? { vencimientoSeguro: this.vencimientoSeguro } : {}),
      ...(this.aseguradora ? { aseguradora: this.aseguradora } : {}),
      ...(this.polizaSeguro ? { polizaSeguro: this.polizaSeguro } : {}),
      ...(this.folioVerificacion ? { folioVerificacion: this.folioVerificacion } : {}),
      ...(this.vencimientoVerificacion
        ? { vencimientoVerificacion: this.vencimientoVerificacion }
        : {}),
    });

    if (!res.success) {
      this.errorMsg = res.error || 'No se pudo guardar.';
      this.cdr.markForCheck();
      return;
    }

    this.exitoMsg = 'Vehículo guardado.';
    this.numeroEconomico = '';
    this.placas = '';
    this.tipo = '';
    this.tipoCaja = '';
    this.vencimientoSeguro = '';
    this.aseguradora = '';
    this.polizaSeguro = '';
    this.cajaConSeguro = false;
    this.folioVerificacion = '';
    this.vencimientoVerificacion = '';
    this.refrescar();
    this.cdr.markForCheck();
  }

  guardarOperador(): void {
    this.errorMsg = '';
    this.exitoMsg = '';

    const res = this.flotaService.registrarOperador({
      nombre: this.nombre,
      apellidoPaterno: this.apellidoPaterno,
      apellidoMaterno: this.apellidoMaterno,
      folioAptoMedico: this.folioAptoMedico,
      vencimientoAptoMedico: this.vencimientoAptoMedico,
      rfc: this.rfc,
      folioLicencia: this.folioLicencia,
      vencimientoLicencia: this.vencimientoLicencia,
    });

    if (!res.success) {
      this.errorMsg = res.error || 'No se pudo guardar el operador.';
      this.cdr.markForCheck();
      return;
    }

    this.exitoMsg = 'Operador guardado.';
    this.nombre = '';
    this.apellidoPaterno = '';
    this.apellidoMaterno = '';
    this.folioAptoMedico = '';
    this.vencimientoAptoMedico = '';
    this.rfc = '';
    this.folioLicencia = '';
    this.vencimientoLicencia = '';
    this.refrescar();
    this.cdr.markForCheck();
  }

  eliminar(id: string): void {
    this.flotaService.eliminarVehiculo(id);
    this.refrescar();
    this.cdr.markForCheck();
  }

  eliminarOperador(id: string): void {
    this.flotaService.eliminarOperador(id);
    this.refrescar();
    this.cdr.markForCheck();
  }

  cerrarNotificacion(clave: string): void {
    this.notificacionesCerradas.add(clave);
    this.cdr.markForCheck();
  }

  abrirEdicionVehiculo(vehiculo: VehiculoLocal): void {
    this.modoEdicion = true;
    this.vehiculoEnEdicion = vehiculo;
    this.numeroEconomico = vehiculo.numeroEconomico;
    this.placas = vehiculo.placas;
    this.tipo = vehiculo.tipo;
    this.tipoCaja = vehiculo.tipoCaja || '';
    this.vencimientoSeguro = vehiculo.vencimientoSeguro || '';
    this.aseguradora = vehiculo.aseguradora || '';
    this.polizaSeguro = vehiculo.polizaSeguro || '';
    this.folioVerificacion = vehiculo.folioVerificacion || '';
    this.vencimientoVerificacion = vehiculo.vencimientoVerificacion || '';
    this.cdr.markForCheck();
  }

  guardarEdicionVehiculo(): void {
    if (!this.vehiculoEnEdicion) return;

    this.errorMsg = '';
    this.exitoMsg = '';

    if (!this.numeroEconomico.trim() || !this.placas.trim() || !this.tipo) {
      this.errorMsg = 'Completa # económico, placas y tipo.';
      this.cdr.markForCheck();
      return;
    }

    const actualizado: VehiculoLocal = {
      ...this.vehiculoEnEdicion,
      numeroEconomico: this.numeroEconomico,
      placas: this.placas,
      tipo: this.tipo as VehiculoTipo,
      tipoCaja: this.tipo === 'caja' ? (this.tipoCaja as TipoCaja) : undefined,
      vencimientoSeguro: this.vencimientoSeguro,
      aseguradora: this.aseguradora,
      polizaSeguro: this.polizaSeguro,
      folioVerificacion: this.folioVerificacion,
      vencimientoVerificacion: this.vencimientoVerificacion,
    };

    this.flotaService.actualizarVehiculo(actualizado);
    this.exitoMsg = 'Vehículo actualizado.';
    this.cancelarEdicion();
    this.refrescar();
    this.cdr.markForCheck();
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
    this.vehiculoEnEdicion = null;
    this.operadorEnEdicion = null;
    this.numeroEconomico = '';
    this.placas = '';
    this.tipo = '';
    this.tipoCaja = '';
    this.vencimientoSeguro = '';
    this.aseguradora = '';
    this.polizaSeguro = '';
    this.folioVerificacion = '';
    this.vencimientoVerificacion = '';
    this.nombre = '';
    this.apellidoPaterno = '';
    this.apellidoMaterno = '';
    this.folioAptoMedico = '';
    this.vencimientoAptoMedico = '';
    this.rfc = '';
    this.folioLicencia = '';
    this.vencimientoLicencia = '';
    this.cdr.markForCheck();
  }

  estadoVencimiento(fecha?: string): string {
    const dias = this.diasPara(fecha);
    if (dias === null) return 'Sin fecha';
    if (dias < 0) return 'Vencido';
    if (dias <= 30) return `Próximo (${dias} día(s))`;
    return `Vigente (${dias} día(s))`;
  }

  esAlertaVencimiento(fecha?: string): boolean {
    const dias = this.diasPara(fecha);
    return dias !== null && dias <= 30;
  }

  private refrescar(): void {
    this.vehiculos = this.flotaService.obtenerVehiculos();
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
