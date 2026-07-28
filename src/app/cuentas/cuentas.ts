import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ServiciosViajeService } from '../servicios-viaje.service';
import type { GastoViaje, ViajeRow } from '../viaje.model';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas.html',
  styleUrl: './cuentas.scss',
})
export class Cuentas implements OnDestroy {
  private readonly serviciosViaje = inject(ServiciosViajeService);
  private sub = Subscription.EMPTY;

  viajes: ViajeRow[] = [];
  viajeSeleccionadoId: string | null = null;

  // Formulario para nuevo gasto
  nuevoGasto: { concepto: string; monto: number | null } = { concepto: '', monto: null };
  errorMsg = '';
  exitoMsg = '';
  guardando = false;

  constructor() {
    this.sub = this.serviciosViaje.obtenerViajes$().subscribe((lista) => {
      this.viajes = lista;
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ─── Cómputos ────────────────────────────────────────────

  get totalIngresos(): number {
    return this.viajes.reduce((sum, v) => sum + (v.costoServicio || 0), 0);
  }

  get totalGastos(): number {
    return this.viajes.reduce((sum, v) => sum + this.gastoTotalViaje(v), 0);
  }

  get balanceNeto(): number {
    return this.totalIngresos - this.totalGastos;
  }

  gastoTotalViaje(v: ViajeRow): number {
    return (v.gastos || []).reduce((s, g) => s + g.monto, 0);
  }

  gananciaViaje(v: ViajeRow): number {
    return (v.costoServicio || 0) - this.gastoTotalViaje(v);
  }

  get viajeSeleccionado(): ViajeRow | null {
    return this.viajes.find((v) => v.id === this.viajeSeleccionadoId) ?? null;
  }

  // ─── Selección de viaje ──────────────────────────────────

  abrirGastosViaje(viajeId: string): void {
    this.viajeSeleccionadoId = this.viajeSeleccionadoId === viajeId ? null : viajeId;
    this.errorMsg = '';
    this.exitoMsg = '';
    this.nuevoGasto = { concepto: '', monto: null };
  }

  cerrarGastosViaje(): void {
    this.viajeSeleccionadoId = null;
    this.errorMsg = '';
    this.exitoMsg = '';
  }

  // ─── CRUD Gastos ─────────────────────────────────────────

  async agregarGasto(): Promise<void> {
    if (this.guardando) return;
    const viaje = this.viajeSeleccionado;
    if (!viaje) return;

    const concepto = this.nuevoGasto.concepto.trim();
    const monto = this.nuevoGasto.monto;

    if (!concepto) {
      this.errorMsg = 'Ingresa el concepto del gasto.';
      return;
    }
    if (monto === null || monto <= 0) {
      this.errorMsg = 'Ingresa un monto mayor a 0.';
      return;
    }

    const gasto: GastoViaje = {
      id: `gst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      concepto,
      monto,
      fechaIso: new Date().toISOString(),
    };

    this.guardando = true;
    try {
      await this.serviciosViaje.actualizarViaje(viaje.id, (v) => {
        v.gastos = [...(v.gastos || []), gasto];
      });
      this.nuevoGasto = { concepto: '', monto: null };
      this.errorMsg = '';
      this.exitoMsg = `${concepto} por $${monto.toFixed(2)} agregado.`;
    } catch {
      this.errorMsg = 'No se pudo agregar el gasto.';
    } finally {
      this.guardando = false;
    }
  }

  async eliminarGasto(viaje: ViajeRow, gastoId: string): Promise<void> {
    if (this.guardando) return;
    this.guardando = true;
    try {
      await this.serviciosViaje.actualizarViaje(viaje.id, (v) => {
        v.gastos = (v.gastos || []).filter((g) => g.id !== gastoId);
      });
      this.errorMsg = '';
    } catch {
      this.errorMsg = 'No se pudo eliminar el gasto.';
    } finally {
      this.guardando = false;
    }
  }

  // ─── Formateo ────────────────────────────────────────────

  formatMxn(valor: number): string {
    return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  formatFecha(fechaIso: string): string {
    const f = new Date(fechaIso);
    if (Number.isNaN(f.getTime())) return fechaIso;
    return f.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  trackById(_: number, v: ViajeRow): string {
    return v.id;
  }

  trackByGastoId(_: number, g: GastoViaje): string {
    return g.id;
  }
}