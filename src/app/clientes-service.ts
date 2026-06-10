import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ClienteLocal {
  id: string;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clientesKey = 'clientes_locales_estadias_json';

  readonly clientes$ = new BehaviorSubject<ClienteLocal[]>([]);

  constructor() {
    this.clientes$.next(this.leerClientes());
  }

  obtenerClientes(): ClienteLocal[] {
    const clientes = this.leerClientes();
    this.clientes$.next(clientes);
    return clientes;
  }

  agregarCliente(nombre: string): { success: boolean; error?: string; cliente?: ClienteLocal } {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, error: 'Disponible solo en navegador.' };
    }
    const limpio = nombre.trim();
    if (!limpio) return { success: false, error: 'Nombre de cliente es obligatorio.' };

    const clientes = this.leerClientes();
    const existe = clientes.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase());
    if (existe) return { success: false, error: 'Ese cliente ya existe.' };

    const nuevo: ClienteLocal = {
      id: `cli_${Date.now()}`,
      nombre: limpio,
    };
    const actualizados = [...clientes, nuevo];
    localStorage.setItem(this.clientesKey, JSON.stringify(actualizados));
    this.clientes$.next(actualizados);
    return { success: true, cliente: nuevo };
  }

  eliminarCliente(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const actualizados = this.leerClientes().filter((c) => c.id !== id);
    localStorage.setItem(this.clientesKey, JSON.stringify(actualizados));
    this.clientes$.next(actualizados);
  }

  private leerClientes(): ClienteLocal[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.clientesKey);
    if (!raw) {
      const seed: ClienteLocal[] = [
        { id: 'cli_demo_1', nombre: 'Cliente demo' },
      ];
      localStorage.setItem(this.clientesKey, JSON.stringify(seed));
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ClienteLocal[]) : [];
    } catch {
      return [];
    }
  }
}
