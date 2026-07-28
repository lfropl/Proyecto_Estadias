import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { apiFetch } from './api-helper';

export interface ClienteLocal {
  id: string;
  nombre: string;
  rfc?: string;
  direccionFiscal?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private base = `/api/clientes`;
  readonly clientes$ = new BehaviorSubject<ClienteLocal[]>([]);

  constructor() {
    this.cargarClientes();
  }

  async cargarClientes() {
    try {
      const res = await apiFetch(this.base);
      const data = await res.json();
      this.clientes$.next(data);
    } catch {
      this.clientes$.next([]);
    }
  }

  async obtenerClientes(): Promise<ClienteLocal[]> {
    const res = await apiFetch(this.base);
    const data = await res.json();
    this.clientes$.next(data);
    return data;
  }

  async agregarCliente(datos: { nombre: string; rfc?: string; direccionFiscal?: string }): Promise<{ success: boolean; error?: string; cliente?: ClienteLocal }> {
    const res = await apiFetch(this.base, { method: 'POST', body: JSON.stringify(datos) });
    if (!res.ok) throw new Error('Error al crear cliente');
    const cliente = await res.json();
    await this.cargarClientes();
    return { success: true, cliente };
  }

  async actualizarCliente(id: string, datos: Partial<ClienteLocal>): Promise<{ success: boolean; error?: string }> {
    const res = await apiFetch(`${this.base}/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
    if (!res.ok) throw new Error('Error al actualizar');
    await this.cargarClientes();
    return { success: true };
  }

  async eliminarCliente(id: string) {
    await apiFetch(`${this.base}/${id}`, { method: 'DELETE' });
    await this.cargarClientes();
  }
}
