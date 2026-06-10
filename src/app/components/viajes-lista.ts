import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ArchivoAdjunto, ComentarioViaje, Estatus, RecoleccionSeguimiento, ViajeRow } from '../viaje.model';

export interface EstatusOpcion {
  id: Estatus;
  label: string;
}

@Component({
  selector: 'app-viajes-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './viajes-lista.html',
  styleUrls: ['./viajes-lista.scss']
})
export class ViajesListaComponent {
  @Input() serviciosGeneral: ViajeRow[] = [];
  @Input() viajeDetalleId: string | null = null;
  @Input() comentarioDetalleInput = '';
  @Input() estatusOpciones: EstatusOpcion[] = [];
  
  @Output() abrirDetalleEvent = new EventEmitter<ViajeRow>();
  @Output() cerrarDetalleEvent = new EventEmitter<void>();
  @Output() actualizarEstatusEvent = new EventEmitter<{ viaje: ViajeRow; estatus: Estatus }>();
  @Output() agregarComentarioEvent = new EventEmitter<void>();
  @Output() comentarioChangeEvent = new EventEmitter<string>();
  @Output() guardarDetalleEvent = new EventEmitter<void>();
  @Output() verArchivoEvent = new EventEmitter<ArchivoAdjunto>();
  @Output() quitarArchivoEvent = new EventEmitter<{ index: number; categoria: 'general' | 'cartaPorte' }>();
  @Output() archivosSeleccionadosEvent = new EventEmitter<{ event: Event; categoria: 'general' | 'cartaPorte' }>();

  get viajeDetalle(): ViajeRow | null {
    return this.serviciosGeneral.find((v) => v.id === this.viajeDetalleId) ?? null;
  }

  primerSeguimiento(viaje: ViajeRow): RecoleccionSeguimiento | null {
    return viaje.seguimientos[0] ?? null;
  }

  obtenerIndiceRecoleccion(viaje: ViajeRow, seg: RecoleccionSeguimiento): number {
    return viaje.seguimientos.findIndex((item: RecoleccionSeguimiento) => item === seg) + 1;
  }

  diferenciaEtaLlegadaCarga(seg: RecoleccionSeguimiento): string {
    if (!seg.etaCarga || !seg.llegadaCarga) return 'Sin datos';
    const eta = new Date(seg.etaCarga);
    const llegada = new Date(seg.llegadaCarga);
    if (isNaN(eta.getTime()) || isNaN(llegada.getTime())) return 'Sin datos';
    const diffMin = Math.round((llegada.getTime() - eta.getTime()) / 60000);
    const signo = diffMin >= 0 ? '+' : '-';
    const abs = Math.abs(diffMin);
    const horas = Math.floor(abs / 60);
    const minutos = abs % 60;
    if (abs < 60) return `${signo}${minutos} min`;
    return `${signo}${horas}h ${minutos}m`;
  }

  diferenciaEtaLlegadaDescarga(seg: RecoleccionSeguimiento): string {
    if (!seg.etaDescarga || !seg.llegadaDescarga) return 'Sin datos';
    const eta = new Date(seg.etaDescarga);
    const llegada = new Date(seg.llegadaDescarga);
    if (isNaN(eta.getTime()) || isNaN(llegada.getTime())) return 'Sin datos';
    const diffMin = Math.round((llegada.getTime() - eta.getTime()) / 60000);
    const signo = diffMin >= 0 ? '+' : '-';
    const abs = Math.abs(diffMin);
    const horas = Math.floor(abs / 60);
    const minutos = abs % 60;
    if (abs < 60) return `${signo}${minutos} min`;
    return `${signo}${horas}h ${minutos}m`;
  }

  esDiferenciaNegativa(valor: string): boolean {
    return valor.trim().startsWith('-');
  }

  archivosDisponiblesRestantes(viaje: ViajeRow): number {
    return 3 - viaje.archivosAdjuntos.length;
  }

  archivosDisponiblesCartaPorte(viaje: ViajeRow): number {
    return 3 - viaje.archivosCartaPorte.length;
  }

  formatoFechaComentario(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return fechaIso;
    return fecha.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  abrirDetalle(viaje: ViajeRow): void {
    this.abrirDetalleEvent.emit(viaje);
  }

  cerrarDetalle(): void {
    this.cerrarDetalleEvent.emit();
  }

  actualizarEstatus(viaje: ViajeRow, estatus: Estatus): void {
    this.actualizarEstatusEvent.emit({ viaje, estatus });
  }

  agregarComentarioDetalle(): void {
    this.agregarComentarioEvent.emit();
  }

  onComentarioChange(value: string): void {
    this.comentarioChangeEvent.emit(value);
  }

  guardarDetalle(): void {
    this.guardarDetalleEvent.emit();
  }

  verArchivo(adjunto: ArchivoAdjunto): void {
    this.verArchivoEvent.emit(adjunto);
  }

  quitarArchivoDetalle(index: number, categoria: 'general' | 'cartaPorte' = 'general'): void {
    this.quitarArchivoEvent.emit({ index, categoria });
  }

  onArchivosSeleccionadosDetalle(event: Event, categoria: 'general' | 'cartaPorte' = 'general'): void {
    this.archivosSeleccionadosEvent.emit({ event, categoria });
  }
}