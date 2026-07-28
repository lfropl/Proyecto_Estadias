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
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.html',
  styleUrl: './facturacion.scss',
})
export class Facturacion implements OnDestroy {
  private readonly serviciosViaje = inject(ServiciosViajeService);
  viajes: ViajeRow[] = [];
  errorMsg = '';
  exitoMsg = '';
  private sub = Subscription.EMPTY;

  // Estado para subida en línea (sin modal)
  viajeSubiendo: string | null = null;
  requiereCartaPorte = false;

  constructor() {
    this.sub = this.serviciosViaje.obtenerViajes$().subscribe((lista) => {
      this.viajes = lista.filter(esViajeListoFacturacionCobranza);
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

  /** Abre el explorador de archivos oculto para factura */
  triggerFacturaInput(viajeId: string): void {
    const input = document.getElementById(`factura-input-${viajeId}`) as HTMLInputElement;
    input?.click();
  }

  /** Abre el explorador de archivos oculto para carta porte */
  triggerCartaPorteInput(viajeId: string): void {
    const input = document.getElementById(`carta-input-${viajeId}`) as HTMLInputElement;
    input?.click();
  }

  /** Cuando se selecciona la factura PDF */
  onFacturaPdfSeleccionada(event: Event, viajeId: string): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.errorMsg = 'La factura debe ser un archivo PDF.';
      if (input) input.value = '';
      return;
    }
    if (file.size > MAX_ADJUNTO_BYTES) {
      this.errorMsg = 'El PDF de factura no puede superar 1.5 MB.';
      if (input) input.value = '';
      return;
    }

    this.viajeSubiendo = viajeId;
    this.errorMsg = '';

    leerArchivoBase64(file)
      .then((adjuntoFactura) => {
        this.serviciosViaje.actualizarViaje(viajeId, (v) => {
          v.facturaPdf = adjuntoFactura;
          v.estatus = 'verde';
        });
        this.exitoMsg = 'Factura subida correctamente.';
        this.viajeSubiendo = null;
        if (input) input.value = '';
      })
      .catch(() => {
        this.errorMsg = 'Error al leer la factura.';
        this.viajeSubiendo = null;
      });
  }

  /** Cuando se selecciona la carta porte PDF */
  onCartaPortePdfSeleccionada(event: Event, viajeId: string): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.errorMsg = 'La carta porte debe ser un archivo PDF.';
      if (input) input.value = '';
      return;
    }
    if (file.size > MAX_ADJUNTO_BYTES) {
      this.errorMsg = 'El PDF de carta porte no puede superar 1.5 MB.';
      if (input) input.value = '';
      return;
    }

    leerArchivoBase64(file)
      .then((adjunto) => {
        this.serviciosViaje.actualizarViaje(viajeId, (v) => {
          v.archivosCartaPorte = [...(v.archivosCartaPorte || []), adjunto];
        });
        this.exitoMsg = 'Carta porte subida correctamente.';
        if (input) input.value = '';
      })
      .catch(() => {
        this.errorMsg = 'Error al leer la carta porte.';
      });
  }

  quitarFactura(viajeId: string): void {
    this.errorMsg = '';
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.facturaPdf = null;
    });
  }

  quitarCartaPorte(viajeId: string, index: number): void {
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.archivosCartaPorte = v.archivosCartaPorte.filter((_, i) => i !== index);
    });
  }

  tieneDocumentos(viaje: ViajeRow): boolean {
    return !!viaje.facturaPdf;
  }
}
