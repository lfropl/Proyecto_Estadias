import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type VehiculoTipo = 'tracto' | 'caja' | 'camioneta' | 'van' | 'rabon' | 'torton';
export type TipoCaja = 'thermo' | 'seca';

export interface VehiculoLocal {
  id: string;
  numeroEconomico: string;
  placas: string;
  tipo: VehiculoTipo;
  tipoCaja?: TipoCaja; // solo si tipo=caja
  vencimientoSeguro?: string; // YYYY-MM-DD
  aseguradora?: string;
  polizaSeguro?: string;
  folioVerificacion?: string;
  vencimientoVerificacion?: string; // YYYY-MM-DD
}

export interface OperadorLocal {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  folioAptoMedico: string;
  vencimientoAptoMedico?: string; // YYYY-MM-DD
  rfc: string;
  folioLicencia: string;
  vencimientoLicencia: string; // YYYY-MM-DD
}

@Injectable({
  providedIn: 'root',
})
export class FlotaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly flotaKey = 'flota_vehiculos_estadias_json';
  private readonly operadoresKey = 'flota_operadores_estadias_json';

  readonly vehiculos$ = new BehaviorSubject<VehiculoLocal[]>([]);
  readonly operadores$ = new BehaviorSubject<OperadorLocal[]>([]);

  constructor() {
    this.vehiculos$.next(this.leerVehiculos());
    this.operadores$.next(this.leerOperadores());
  }

  obtenerVehiculos(): VehiculoLocal[] {
    const v = this.leerVehiculos();
    this.vehiculos$.next(v);
    return v;
  }

  obtenerCajas(): VehiculoLocal[] {
    return this.leerVehiculos().filter((v) => v.tipo === 'caja');
  }

  obtenerOperadores(): OperadorLocal[] {
    const o = this.leerOperadores();
    this.operadores$.next(o);
    return o;
  }

  registrarVehiculo(datos: Omit<VehiculoLocal, 'id'>): { success: boolean; error?: string; vehiculo?: VehiculoLocal } {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, error: 'Disponible solo en navegador.' };
    }

    const numeroEconomico = datos.numeroEconomico.trim();
    const placas = datos.placas.trim().toUpperCase();
    if (!numeroEconomico || !placas || !datos.tipo) {
      return { success: false, error: 'Completa # económico, placas y tipo.' };
    }

    if (datos.tipo === 'caja' && !datos.tipoCaja) {
      return { success: false, error: 'Selecciona el tipo de caja (Thermo/Seca).' };
    }

    const vehiculos = this.leerVehiculos();
    const existe = vehiculos.some(
      (v) => v.numeroEconomico.toLowerCase() === numeroEconomico.toLowerCase() && v.tipo === datos.tipo
    );
    if (existe) {
      return { success: false, error: 'Ya existe un vehículo con ese # económico y tipo.' };
    }

    const nuevo: VehiculoLocal = {
      id: `veh_${Date.now()}`,
      ...datos,
      numeroEconomico,
      placas,
      vencimientoSeguro: (datos.vencimientoSeguro ?? '').trim() || undefined,
      aseguradora: (datos.aseguradora ?? '').trim() || undefined,
      polizaSeguro: (datos.polizaSeguro ?? '').trim() || undefined,
      folioVerificacion: (datos.folioVerificacion ?? '').trim() || undefined,
      vencimientoVerificacion: (datos.vencimientoVerificacion ?? '').trim() || undefined,
    };
    const actualizados = [...vehiculos, nuevo];
    localStorage.setItem(this.flotaKey, JSON.stringify(actualizados));
    this.vehiculos$.next(actualizados);
    return { success: true, vehiculo: nuevo };
  }

  eliminarVehiculo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const actualizados = this.leerVehiculos().filter((v) => v.id !== id);
    localStorage.setItem(this.flotaKey, JSON.stringify(actualizados));
    this.vehiculos$.next(actualizados);
  }

  registrarOperador(datos: Omit<OperadorLocal, 'id'>): { success: boolean; error?: string; operador?: OperadorLocal } {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, error: 'Disponible solo en navegador.' };
    }

    const nombre = datos.nombre.trim();
    const apellidoPaterno = datos.apellidoPaterno.trim();
    const apellidoMaterno = datos.apellidoMaterno.trim();
    const folioAptoMedico = datos.folioAptoMedico.trim();
    const vencimientoAptoMedico = (datos.vencimientoAptoMedico ?? '').trim();
    const rfc = datos.rfc.trim().toUpperCase();
    const folioLicencia = datos.folioLicencia.trim().toUpperCase();
    const vencimientoLicencia = datos.vencimientoLicencia.trim();

    if (
      !nombre ||
      !apellidoPaterno ||
      !apellidoMaterno ||
      !folioAptoMedico ||
      !rfc ||
      !folioLicencia ||
      !vencimientoLicencia
    ) {
      return { success: false, error: 'Completa todos los campos del operador.' };
    }

    const operadores = this.leerOperadores();
    const existe = operadores.some((o) => o.rfc === rfc || o.folioLicencia === folioLicencia);
    if (existe) {
      return { success: false, error: 'Ya existe un operador con ese RFC o folio de licencia.' };
    }

    const nuevo: OperadorLocal = {
      id: `op_${Date.now()}`,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      folioAptoMedico,
      vencimientoAptoMedico,
      rfc,
      folioLicencia,
      vencimientoLicencia,
    };
    const actualizados = [...operadores, nuevo];
    localStorage.setItem(this.operadoresKey, JSON.stringify(actualizados));
    this.operadores$.next(actualizados);
    return { success: true, operador: nuevo };
  }

  eliminarOperador(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const actualizados = this.leerOperadores().filter((o) => o.id !== id);
    localStorage.setItem(this.operadoresKey, JSON.stringify(actualizados));
    this.operadores$.next(actualizados);
  }

  actualizarVehiculo(datos: VehiculoLocal): { success: boolean; error?: string } {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, error: 'Disponible solo en navegador.' };
    }

    const vehiculos = this.leerVehiculos();
    const indice = vehiculos.findIndex((v) => v.id === datos.id);
    if (indice === -1) {
      return { success: false, error: 'Vehículo no encontrado.' };
    }

    vehiculos[indice] = datos;
    localStorage.setItem(this.flotaKey, JSON.stringify(vehiculos));
    this.vehiculos$.next(vehiculos);
    return { success: true };
  }

  actualizarOperador(datos: OperadorLocal): { success: boolean; error?: string } {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, error: 'Disponible solo en navegador.' };
    }

    const operadores = this.leerOperadores();
    const indice = operadores.findIndex((o) => o.id === datos.id);
    if (indice === -1) {
      return { success: false, error: 'Operador no encontrado.' };
    }

    operadores[indice] = datos;
    localStorage.setItem(this.operadoresKey, JSON.stringify(operadores));
    this.operadores$.next(operadores);
    return { success: true };
  }

  private leerVehiculos(): VehiculoLocal[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.flotaKey);
    if (!raw) {
      const seed: VehiculoLocal[] = [];
      localStorage.setItem(this.flotaKey, JSON.stringify(seed));
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as VehiculoLocal[]) : [];
    } catch {
      localStorage.setItem(this.flotaKey, JSON.stringify([]));
      return [];
    }
  }

  private leerOperadores(): OperadorLocal[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.operadoresKey);
    if (!raw) {
      const seed: OperadorLocal[] = [];
      localStorage.setItem(this.operadoresKey, JSON.stringify(seed));
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OperadorLocal[]) : [];
    } catch {
      localStorage.setItem(this.operadoresKey, JSON.stringify([]));
      return [];
    }
  }
}

