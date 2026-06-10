import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { abrirAdjuntoEnNuevaPestana, leerArchivoBase64, MAX_ADJUNTO_BYTES } from '../archivo-adjunto.util';
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
  viajes: ViajeRow[] = [];
  errorMsg = '';
  private sub = Subscription.EMPTY;

  constructor(private readonly serviciosViaje: ServiciosViajeService) {
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

  verArchivo(adj: ArchivoAdjunto): void {
    abrirAdjuntoEnNuevaPestana(adj);
  }

  quitarFactura(viajeId: string): void {
    this.errorMsg = '';
    this.serviciosViaje.actualizarViaje(viajeId, (v) => {
      v.facturaPdf = null;
    });
  }

  onFacturaPdfSeleccionada(event: Event, viajeId: string): void {
    this.errorMsg = '';
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.errorMsg = 'La factura debe ser un archivo PDF.';
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
          v.facturaPdf = adjunto;
          if (v.archivosAdjuntos.length || v.archivosCartaPorte.length || v.facturaPdf) {
            v.estatus = 'verde';
          }
        });
      })
      .catch(() => {
        this.errorMsg = 'No se pudo leer el PDF.';
      })
      .finally(() => {
        if (input) input.value = '';
      });
  }
}
