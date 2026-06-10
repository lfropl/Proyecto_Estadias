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
import { esViajeListoFacturacionCobranza } from '../viaje-operativo.util';

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
  private sub = Subscription.EMPTY;

  constructor() {
    this.sub = this.serviciosViaje.obtenerViajes$().subscribe((lista) => {
      this.viajes = lista.filter((v) => esViajeListoFacturacionCobranza(v) && !!v.facturaPdf);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  trackById(_: number, v: ViajeRow): string {
    return v.id;
  }

  verArchivo(adj: ArchivoAdjunto): void {
    abrirAdjuntoEnNuevaPestana(adj);
  }

  quitarRp(viajeId: string): void {
    this.errorMsg = '';
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.reportePagoPdf = null;
    });
  }

  onRpPdfSeleccionado(event: Event, viajeId: string): void {
    this.errorMsg = '';
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.errorMsg = 'El reporte de pago debe ser PDF.';
      if (input) input.value = '';
      return;
    }
    if (file.size > MAX_ADJUNTO_BYTES) {
      this.errorMsg = 'El PDF no puede superar 1.5 MB.';
      if (input) input.value = '';
      return;
    }
    leerArchivoBase64(file)
      .then((adjunto) => {
        this.serviciosViaje.actualizarViaje(viajeId, (v) => {
          v.reportePagoPdf = adjunto;
        });
      })
      .catch(() => {
        this.errorMsg = 'No se pudo leer el PDF.';
      })
      .finally(() => {
        if (input) input.value = '';
      });
  }

  marcarViajeTerminado(viajeId: string): void {
    this.errorMsg = '';
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.cobranzaTerminada = true;
    });
  }

  desmarcarTerminado(viajeId: string): void {
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.cobranzaTerminada = false;
    });
  }
}
