import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GastoOperacional } from '../models/gastos.model';

@Injectable({
  providedIn: 'root',
})
export class GastosService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly key = 'gastos_estadias';

  obtenerTodos(): GastoOperacional[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  obtenerPorVehiculo(vehiculoId: string): GastoOperacional[] {
    return this.obtenerTodos().filter((g) => g.vehiculoId === vehiculoId);
  }

  obtenerPorTipo(tipo: string): GastoOperacional[] {
    return this.obtenerTodos().filter((g) => g.tipo === tipo);
  }

  obtenerPorPeriodo(inicio: string, fin: string): GastoOperacional[] {
    return this.obtenerTodos().filter((g) => {
      const fecha = new Date(g.fecha).getTime();
      return fecha >= new Date(inicio).getTime() && fecha <= new Date(fin).getTime();
    });
  }

  calcularTotalPorTipo(tipo: string): number {
    return this.obtenerPorTipo(tipo).reduce((sum, g) => sum + g.monto, 0);
  }

  crear(datos: Omit<GastoOperacional, 'id'>): GastoOperacional {
    const nuevo: GastoOperacional = {
      id: `gast_${Date.now()}`,
      ...datos,
    };
    const todos = this.obtenerTodos();
    todos.push(nuevo);
    localStorage.setItem(this.key, JSON.stringify(todos));
    return nuevo;
  }

  actualizar(id: string, datos: Partial<GastoOperacional>): GastoOperacional | null {
    const todos = this.obtenerTodos();
    const index = todos.findIndex((g) => g.id === id);
    if (index === -1) return null;
    todos[index] = { ...todos[index], ...datos };
    localStorage.setItem(this.key, JSON.stringify(todos));
    return todos[index];
  }

  eliminar(id: string): boolean {
    const todos = this.obtenerTodos();
    const nuevo = todos.filter((g) => g.id !== id);
    localStorage.setItem(this.key, JSON.stringify(nuevo));
    return nuevo.length < todos.length;
  }

  cambiarStatus(id: string, status: 'registrado' | 'validado' | 'reembolsado'): boolean {
    const gasto = this.actualizar(id, { status });
    return !!gasto;
  }
}
