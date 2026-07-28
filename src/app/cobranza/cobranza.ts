import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  abrirAdjuntoEnNuevaPestana,
  leerArchivoBase64,
  MAX_ADJUNTO_BYTES,
} from '../archivo-adjunto.util';
import { ServiciosViajeService } from '../servicios-viaje.service';
import type { ArchivoAdjunto, ViajeRow } from '../viaje.model';

@Component({
  selector: 'app-cobranza',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cobranza.html',
  styleUrl: './cobranza.scss',
})
export class Cobranza implements OnDestroy {
  private readonly serviciosViaje = inject(ServiciosViajeService);
  viajes: ViajeRow[] = [];
  errorMsg = '';
  exitoMsg = '';
  guardando = false;
  private sub = Subscription.EMPTY;

  // Modal para registrar pago
  viajeEnPago: ViajeRow | null = null;
  reportePagoPdfSeleccionado: File | null = null;
  metodoPago = '';
  fechaPago = '';
  referencia = '';

  readonly metodosPago = [
    { valor: 'efectivo', label: 'Efectivo' },
    { valor: 'transferencia', label: 'Transferencia electrónica' },
    { valor: 'cheque', label: 'Cheque' },
    { valor: 'tarjeta_credito', label: 'Tarjeta de crédito' },
    { valor: 'tarjeta_debito', label: 'Tarjeta de débito' },
  ];

  constructor() {
    this.sub = this.serviciosViaje.obtenerViajes$().subscribe((lista) => {
      // Mostrar solo viajes que ya tienen factura subida (facturaPdf !== null)
      this.viajes = lista.filter((v) => !!v.facturaPdf);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  trackById(_: number, v: ViajeRow): string {
    return v.id;
  }

  verArchivo(adj: ArchivoAdjunto | null): void {
    if (adj) abrirAdjuntoEnNuevaPestana(adj);
  }

  // --- Abrir modal de cobranza ---
  abrirCobranza(viaje: ViajeRow): void {
    this.viajeEnPago = viaje;
    this.reportePagoPdfSeleccionado = null;
    this.metodoPago = '';
    this.fechaPago = '';
    this.referencia = '';
    this.errorMsg = '';
    this.exitoMsg = '';
  }

  cerrarCobranza(): void {
    this.viajeEnPago = null;
  }

  onReportePagoPdfSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.reportePagoPdfSeleccionado = input?.files?.[0] || null;
  }

  async guardarPago(): Promise<void> {
    if (this.guardando || !this.viajeEnPago) return;
    this.errorMsg = '';
    this.exitoMsg = '';

    if (!this.metodoPago) {
      this.errorMsg = 'Selecciona el método de pago.';
      return;
    }

    if (!this.fechaPago) {
      this.errorMsg = 'Captura la fecha de pago.';
      return;
    }

    const viajeId = this.viajeEnPago.id;
    this.guardando = true;

    try {
      if (this.reportePagoPdfSeleccionado) {
        if (this.reportePagoPdfSeleccionado.type !== 'application/pdf') {
          this.errorMsg = 'El reporte de pago debe ser PDF.';
          return;
        }
        if (this.reportePagoPdfSeleccionado.size > MAX_ADJUNTO_BYTES) {
          this.errorMsg = 'El PDF no puede superar 1.5 MB.';
          return;
        }

        const adjunto = await leerArchivoBase64(this.reportePagoPdfSeleccionado);
        await this.serviciosViaje.actualizarViaje(viajeId, (v) => {
          v.reportePagoPdf = adjunto;
          v.cobranzaMetodoPago = this.metodoPago;
          v.cobranzaFechaPago = this.fechaPago;
          v.cobranzaReferencia = this.referencia.trim() || undefined;
          v.cobranzaTerminada = true;
        });
        this.exitoMsg = 'Pago registrado correctamente.';
        this.cerrarCobranza();
      } else {
        await this.serviciosViaje.actualizarViaje(viajeId, (v) => {
          v.cobranzaMetodoPago = this.metodoPago;
          v.cobranzaFechaPago = this.fechaPago;
          v.cobranzaReferencia = this.referencia.trim() || undefined;
          v.cobranzaTerminada = true;
        });
        this.exitoMsg = 'Pago registrado correctamente (sin reporte PDF).';
        this.cerrarCobranza();
      }
    } catch {
      this.errorMsg = 'No se pudo registrar el pago.';
    } finally {
      this.guardando = false;
    }
  }

  quitarRp(viajeId: string): void {
    this.errorMsg = '';
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.reportePagoPdf = null;
      v.cobranzaTerminada = false;
    });
  }

  desmarcarTerminado(viajeId: string): void {
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.cobranzaTerminada = false;
    });
  }

  marcarViajeTerminado(viajeId: string): void {
    this.errorMsg = '';
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.cobranzaTerminada = true;
    });
  }
}