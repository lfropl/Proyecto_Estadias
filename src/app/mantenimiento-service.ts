import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { apiFetch } from './api-helper';

export interface MantenimientoRecord {
  id: string;
  fecha: string;
  unidadId: string;
  unidadNombre: string;
  descripcion: string;
  costo: number;
}

@Injectable({ providedIn: 'root' })
export class MantenimientoService {
  private readonly base = `/api/mantenimiento`;
  readonly records$ = new BehaviorSubject<MantenimientoRecord[]>([]);

  constructor() {
    this.cargarRegistros();
  }

  private async cargarRegistros() {
    try {
      const res = await apiFetch(this.base);
      const data = await res.json();
      this.records$.next(data);
    } catch {
      this.records$.next([]);
    }
  }

  async obtenerRegistros(): Promise<MantenimientoRecord[]> {
    const res = await apiFetch(this.base);
    const data = await res.json();
    this.records$.next(data);
    return data;
  }

  async agregarRegistro(datos: Omit<MantenimientoRecord, 'id'>): Promise<{ success: boolean; error?: string; record?: MantenimientoRecord }> {
    try {
      const res = await apiFetch(this.base, { method: 'POST', body: JSON.stringify(datos) });
      if (!res.ok) throw new Error('Error al agregar');
      const record = await res.json();
      await this.cargarRegistros();
      return { success: true, record };
    } catch {
      return { success: false, error: 'Error al guardar el registro.' };
    }
  }

  async eliminarRegistro(id: string): Promise<void> {
    await apiFetch(`${this.base}/${id}`, { method: 'DELETE' });
    await this.cargarRegistros();
  }
}