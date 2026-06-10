import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Factura } from '../models/factura.model';

@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly key = 'facturas_estadias';
  private folioCounter = 1000;

  obtenerTodos(): Factura[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  obtenerPorId(id: string): Factura | null {
    return this.obtenerTodos().find((f) => f.id === id) || null;
  }

  obtenerPorCliente(clienteId: string): Factura[] {
    return this.obtenerTodos().filter((f) => f.clienteId === clienteId);
  }

  obtenerPendientes(): Factura[] {
    return this.obtenerTodos().filter((f) => f.status !== 'pagada' && f.status !== 'cancelada');
  }

  crear(datos: Omit<Factura, 'id' | 'folio'>): Factura {
    this.folioCounter++;
    const nueva: Factura = {
      id: `fac_${Date.now()}`,
      folio: `FAC-${this.folioCounter}`,
      ...datos,
    };
    const todos = this.obtenerTodos();
    todos.push(nueva);
    localStorage.setItem(this.key, JSON.stringify(todos));
    return nueva;
  }

  actualizar(id: string, datos: Partial<Factura>): Factura | null {
    const todos = this.obtenerTodos();
    const index = todos.findIndex((f) => f.id === id);
    if (index === -1) return null;
    todos[index] = { ...todos[index], ...datos };
    localStorage.setItem(this.key, JSON.stringify(todos));
    return todos[index];
  }

  cambiarStatus(id: string, status: 'borrador' | 'emitida' | 'pagada' | 'cancelada'): boolean {
    const factura = this.actualizar(id, { status });
    return !!factura;
  }

  registrarPago(id: string, monto: number, referencia: string): Factura | null {
    const factura = this.obtenerPorId(id);
    if (!factura || factura.total !== monto) return null;

    return this.actualizar(id, {
      status: 'pagada',
      fechaPago: new Date().toISOString(),
      comprobantePago: referencia,
    });
  }
}
