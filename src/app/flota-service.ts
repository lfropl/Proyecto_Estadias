import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { apiFetch } from './api-helper';

export type VehiculoTipo = 'tracto' | 'caja' | 'camioneta' | 'van' | 'rabon' | 'torton';
export type TipoCaja = 'thermo' | 'seca';

export interface VehiculoLocal {
  id: string;
  numeroEconomico: string;
  placas: string;
  tipo: VehiculoTipo;
  tipoCaja?: TipoCaja;
  vencimientoSeguro?: string;
  aseguradora?: string;
  polizaSeguro?: string;
  folioVerificacion?: string;
  vencimientoVerificacion?: string;
}

export interface OperadorLocal {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  folioAptoMedico: string;
  vencimientoAptoMedico?: string;
  rfc: string;
  curp: string;
  nss: string;
  infonavit?: string;
  fechaIngreso: string;
  salarioDiario: number;
  tipoContrato: 'base' | 'eventual' | 'honorarios';
  rol?: string;
  estatus?: string;
  folioLicencia: string;
  vencimientoLicencia: string;
}

@Injectable({ providedIn: 'root' })
export class FlotaService {
  readonly vehiculos$ = new BehaviorSubject<VehiculoLocal[]>([]);
  readonly operadores$ = new BehaviorSubject<OperadorLocal[]>([]);

  constructor() {
    this.cargarVehiculos();
    this.cargarOperadores();
  }

  private async cargarVehiculos() {
    try {
      const res = await apiFetch('/api/vehiculos');
      this.vehiculos$.next(await res.json());
    } catch { this.vehiculos$.next([]); }
  }
  private async cargarOperadores() {
    try {
      const res = await apiFetch('/api/operadores');
      this.operadores$.next(await res.json());
    } catch { this.operadores$.next([]); }
  }

  async obtenerVehiculos(): Promise<VehiculoLocal[]> {
    const res = await apiFetch('/api/vehiculos');
    const data = await res.json();
    this.vehiculos$.next(data);
    return data;
  }

  obtenerCajas(): VehiculoLocal[] { return this.vehiculos$.value.filter(v => v.tipo === 'caja'); }

  async registrarVehiculo(datos: any): Promise<{ success: boolean; error?: string; vehiculo?: any }> {
    const res = await apiFetch('/api/vehiculos', { method: 'POST', body: JSON.stringify(datos) });
    if (!res.ok) throw new Error('Error al crear vehículo');
    const vehiculo = await res.json();
    await this.cargarVehiculos();
    return { success: true, vehiculo };
  }

  async eliminarVehiculo(id: string) { await apiFetch(`/api/vehiculos/${id}`, { method: 'DELETE' }); await this.cargarVehiculos(); }

  async actualizarVehiculo(datos: VehiculoLocal): Promise<{ success: boolean }> {
    const res = await apiFetch(`/api/vehiculos/${datos.id}`, { method: 'PUT', body: JSON.stringify(datos) });
    if (!res.ok) throw new Error('Error al actualizar');
    await this.cargarVehiculos();
    return { success: true };
  }

  async obtenerOperadores(): Promise<OperadorLocal[]> {
    const res = await apiFetch('/api/operadores');
    const data = await res.json();
    this.operadores$.next(data);
    return data;
  }

  async registrarOperador(datos: any): Promise<{ success: boolean; error?: string }> {
    const res = await apiFetch('/api/operadores', { method: 'POST', body: JSON.stringify(datos) });
    if (!res.ok) throw new Error('Error al crear operador');
    await this.cargarOperadores();
    return { success: true };
  }

  async eliminarOperador(id: string) { await apiFetch(`/api/operadores/${id}`, { method: 'DELETE' }); await this.cargarOperadores(); }

  async actualizarOperador(datos: OperadorLocal): Promise<{ success: boolean }> {
    const res = await apiFetch(`/api/operadores/${datos.id}`, { method: 'PUT', body: JSON.stringify(datos) });
    if (!res.ok) throw new Error('Error al actualizar');
    await this.cargarOperadores();
    return { success: true };
  }
}