import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Vehiculo } from '../models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly key = 'vehiculos_estadias';

  obtenerTodos(): Vehiculo[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  obtenerPorId(id: string): Vehiculo | null {
    return this.obtenerTodos().find((v) => v.id === id) || null;
  }

  obtenerPorPlaca(placa: string): Vehiculo | null {
    return this.obtenerTodos().find((v) => v.placa === placa) || null;
  }

  obtenerActivos(): Vehiculo[] {
    return this.obtenerTodos().filter((v) => v.status === 'activo');
  }

  crear(datos: Omit<Vehiculo, 'id'>): Vehiculo {
    const nuevo: Vehiculo = {
      id: `veh_${Date.now()}`,
      ...datos,
    };
    const todos = this.obtenerTodos();
    todos.push(nuevo);
    localStorage.setItem(this.key, JSON.stringify(todos));
    return nuevo;
  }

  actualizar(id: string, datos: Partial<Vehiculo>): Vehiculo | null {
    const todos = this.obtenerTodos();
    const index = todos.findIndex((v) => v.id === id);
    if (index === -1) return null;
    todos[index] = { ...todos[index], ...datos };
    localStorage.setItem(this.key, JSON.stringify(todos));
    return todos[index];
  }

  eliminar(id: string): boolean {
    const todos = this.obtenerTodos();
    const nuevo = todos.filter((v) => v.id !== id);
    localStorage.setItem(this.key, JSON.stringify(nuevo));
    return nuevo.length < todos.length;
  }

  cambiarStatus(id: string, status: 'activo' | 'inactivo' | 'mantenimiento' | 'fuera-de-servicio'): boolean {
    const vehiculo = this.actualizar(id, { status });
    return !!vehiculo;
  }

  actualizarKilometraje(id: string, km: number): boolean {
    const vehiculo = this.actualizar(id, { kilometer: km });
    return !!vehiculo;
  }
}
