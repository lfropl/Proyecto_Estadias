import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { apiFetch } from './api-helper';
import type { ViajeRow } from './viaje.model';

@Injectable({ providedIn: 'root' })
export class ServiciosViajeService {
  private readonly viajes$ = new BehaviorSubject<ViajeRow[]>([]);
  private readonly base = `/api/viajes`;

  constructor() {
    this.cargarViajes();
  }

  obtenerViajes$() {
    return this.viajes$.asObservable();
  }

  async obtenerLista(): Promise<ViajeRow[]> {
    return this.cargarViajes();
  }

  async persistirLista(nueva: ViajeRow[]): Promise<void> {
    // Crear o actualizar cada viaje
    for (const v of nueva) {
      const existe = await this.obtenerViajePorId(v.id);
      if (existe) {
        await apiFetch(`${this.base}/${v.id}`, { method: 'PUT', body: JSON.stringify(v) });
      } else {
        await apiFetch(this.base, { method: 'POST', body: JSON.stringify(v) });
      }
    }
    await this.cargarViajes();
  }

  async actualizarViaje(id: string, mutador: (viaje: ViajeRow) => void): Promise<void> {
    const viaje = await this.obtenerViajePorId(id);
    if (!viaje) return;
    mutador(viaje);
    await apiFetch(`${this.base}/${id}`, { method: 'PUT', body: JSON.stringify(viaje) });
    await this.cargarViajes();
  }

  async limpiarTodo(): Promise<void> {
    const viajes = this.viajes$.value;
    for (const v of viajes) {
      await apiFetch(`${this.base}/${v.id}`, { method: 'DELETE' });
    }
    this.viajes$.next([]);
  }

  async obtenerViajePorId(id: string): Promise<ViajeRow | undefined> {
    try {
      const res = await apiFetch(`${this.base}/${id}`);
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  }

  private async cargarViajes(): Promise<ViajeRow[]> {
    try {
      const res = await apiFetch(this.base);
      const data = await res.json();
      this.viajes$.next(data);
      return data;
    } catch {
      this.viajes$.next([]);
      return [];
    }
  }
}