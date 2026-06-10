import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type {
  ArchivoAdjunto,
  ComentarioViaje,
  Estatus,
  RecoleccionSeguimiento,
  ViajeRow,
} from './viaje.model';

export const SERVICIOS_VIAJE_STORAGE_KEY = 'tgj_servicios_general_v1';

@Injectable({ providedIn: 'root' })
export class ServiciosViajeService {
  private lista: ViajeRow[] = [];
  private readonly viajes$ = new BehaviorSubject<ViajeRow[]>([]);

  constructor() {
    this.lista = this.leerYNormalizarDesdeLocalStorage();
    this.emitir();
  }

  /** Observable para sincronizar Facturación / Cobranza con Vista general */
  obtenerViajes$() {
    return this.viajes$.asObservable();
  }

  obtenerLista(): ViajeRow[] {
    return this.lista;
  }

  persistirLista(nueva: ViajeRow[]): void {
    this.lista = nueva;
    this.guardarLocalYEmitir();
  }

  mutarLista(mutador: (lista: ViajeRow[]) => void): void {
    mutador(this.lista);
    this.guardarLocalYEmitir();
  }

  actualizarViaje(id: string, mutador: (viaje: ViajeRow) => void): void {
    const viaje = this.lista.find((v) => v.id === id);
    if (!viaje) return;
    mutador(viaje);
    this.guardarLocalYEmitir();
  }

  limpiarTodo(): void {
    this.lista = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SERVICIOS_VIAJE_STORAGE_KEY);
    }
    this.emitir();
  }

  private guardarLocalYEmitir(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SERVICIOS_VIAJE_STORAGE_KEY, JSON.stringify(this.lista));
    }
    this.emitir();
  }

  private emitir(): void {
    this.viajes$.next([...this.lista]);
  }

  private leerYNormalizarDesdeLocalStorage(): ViajeRow[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(SERVICIOS_VIAJE_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      let nextFallback = 1;
      return parsed.map((item: Partial<ViajeRow> & Record<string, unknown>, index: number) => {
        const legacy = item as Partial<ViajeRow> & {
          eta?: string;
          llegada?: string;
          ingreso?: string;
          salida?: string;
          descarga?: string;
          reinicio?: string;
          podNombre?: string;
          podMime?: string;
          podBase64?: string;
          podEntregado?: boolean;
          archivosFacturacion?: ArchivoAdjunto[];
        };
        const seguimientosLegacy: RecoleccionSeguimiento[] =
          item.seguimientos && item.seguimientos.length
            ? (item.seguimientos as RecoleccionSeguimiento[])
            : [
                {
                  origen: '',
                  destino: '',
                  etaCarga: item.etaCarga || legacy.eta || '',
                  llegadaCarga: item.llegadaCarga || '',
                  ingresoCarga: item.ingresoCarga || '',
                  horaCarga: item.horaCarga || '',
                  salidaCarga: item.salidaCarga || '',
                  etaDescarga: item.etaDescarga || '',
                  llegadaDescarga: item.llegadaDescarga || legacy.llegada || '',
                  ingresoDescarga: item.ingresoDescarga || legacy.ingreso || '',
                  horaDescarga: item.horaDescarga || legacy.descarga || legacy.reinicio || '',
                  salidaDescarga: item.salidaDescarga || legacy.salida || '',
                },
              ];
        const archivosAdjuntos: ArchivoAdjunto[] = Array.isArray(item.archivosAdjuntos)
          ? item.archivosAdjuntos
          : legacy.podEntregado && legacy.podBase64
            ? [
                {
                  nombre: legacy.podNombre || 'adjunto.pdf',
                  mime: legacy.podMime || 'application/pdf',
                  base64: legacy.podBase64,
                },
              ]
            : [];
        const archivosCartaPorte: ArchivoAdjunto[] = Array.isArray(item.archivosCartaPorte)
          ? item.archivosCartaPorte
          : [];
        const legacyFacturaArr = Array.isArray(legacy.archivosFacturacion) ? legacy.archivosFacturacion : [];
        const facturaDesdeLegacy =
          legacyFacturaArr.length > 0
            ? legacyFacturaArr[0]
            : item.facturaPdf && typeof item.facturaPdf === 'object'
              ? (item.facturaPdf as ArchivoAdjunto)
              : null;
        const comentarios: ComentarioViaje[] = Array.isArray(item.comentarios)
          ? item.comentarios
              .filter((c) => !!c && typeof c.mensaje === 'string')
              .map((c) => ({
                id: c.id || `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                autorNombre: c.autorNombre || 'Usuario',
                autorPuesto: c.autorPuesto || 'Sin puesto',
                mensaje: c.mensaje || '',
                fechaIso: c.fechaIso || new Date().toISOString(),
              }))
          : [];
        const observacionesLegacy = item.observaciones || '';
        const comentariosDesdeObservacion: ComentarioViaje[] =
          !comentarios.length && observacionesLegacy
            ? [
                {
                  id: `cmt-legacy-${item.id || 'srv'}`,
                  autorNombre: 'Histórico',
                  autorPuesto: 'Migrado',
                  mensaje: observacionesLegacy,
                  fechaIso: new Date().toISOString(),
                },
              ]
            : [];
        const facturaPdf = facturaDesdeLegacy;
        const reportePagoPdf =
          item.reportePagoPdf && typeof item.reportePagoPdf === 'object'
            ? (item.reportePagoPdf as ArchivoAdjunto)
            : null;
        const cobranzaTerminada = Boolean(item.cobranzaTerminada);
        const id = item.id || `srv-${nextFallback++}-${index}`;
        return {
          id,
          nombre: item.nombre || 'Servicio',
          unidad: item.unidad || '',
          operador: item.operador || '',
          servicio: item.servicio || '',
          ruta: item.ruta || '',
          nota: item.nota || '',
          estatus:
            archivosAdjuntos.length || archivosCartaPorte.length || facturaPdf
              ? 'verde'
              : ((item.estatus as Estatus) || 'amarillo'),
          etaCarga: item.etaCarga || legacy.eta || '',
          llegadaCarga: item.llegadaCarga || '',
          ingresoCarga: item.ingresoCarga || '',
          horaCarga: item.horaCarga || '',
          salidaCarga: item.salidaCarga || '',
          etaDescarga: item.etaDescarga || '',
          llegadaDescarga: item.llegadaDescarga || legacy.llegada || '',
          ingresoDescarga: item.ingresoDescarga || legacy.ingreso || '',
          horaDescarga: item.horaDescarga || legacy.descarga || legacy.reinicio || '',
          salidaDescarga: item.salidaDescarga || legacy.salida || '',
          cliente: item.cliente || '',
          referencia: item.referencia || '',
          observaciones: observacionesLegacy,
          comentarios: comentarios.length ? comentarios : comentariosDesdeObservacion,
          seguimientos: seguimientosLegacy,
          archivosAdjuntos,
          archivosCartaPorte,
          facturaPdf,
          reportePagoPdf,
          cobranzaTerminada,
        };
      });
    } catch {
      return [];
    }
  }
}
