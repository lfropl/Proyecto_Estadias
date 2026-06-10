import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Conductor } from '../models/conductor.model';

@Injectable({
  providedIn: 'root',
})
export class ConductoresService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly key = 'conductores_estadias';

  obtenerTodos(): Conductor[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  obtenerPorId(id: string): Conductor | null {
    return this.obtenerTodos().find((c) => c.id === id) || null;
  }

  crear(datos: Omit<Conductor, 'id'>): Conductor {
    const nuevo: Conductor = {
      id: `cond_${Date.now()}`,
      ...datos,
    };
    const todos = this.obtenerTodos();
    todos.push(nuevo);
    localStorage.setItem(this.key, JSON.stringify(todos));
    return nuevo;
  }

  actualizar(id: string, datos: Partial<Conductor>): Conductor | null {
    const todos = this.obtenerTodos();
    const index = todos.findIndex((c) => c.id === id);
    if (index === -1) return null;
    todos[index] = { ...todos[index], ...datos };
    localStorage.setItem(this.key, JSON.stringify(todos));
    return todos[index];
  }

  eliminar(id: string): boolean {
    const todos = this.obtenerTodos();
    const nuevo = todos.filter((c) => c.id !== id);
    localStorage.setItem(this.key, JSON.stringify(nuevo));
    return nuevo.length < todos.length;
  }

  cambiarStatus(id: string, status: 'activo' | 'inactivo' | 'suspendido'): boolean {
    const conductor = this.actualizar(id, { status });
    return !!conductor;
  }
}
