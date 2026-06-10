import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ClienteLocal, ClientesService } from '../clientes-service';
import { FlotaService, OperadorLocal, TipoCaja, VehiculoLocal } from '../flota-service';
import { GestionFlota } from '../gestion-flota/gestion-flota';
import { LoginService } from '../login-service';
import { Facturacion } from '../facturacion/facturacion';
import { Nominas } from '../nominas/nominas';
import { Cuentas } from '../cuentas/cuentas';
import { Cobranza } from '../cobranza/cobranza';
import { Mantenimiento } from '../mantenimiento/mantenimiento';
import { RecursosHumanos } from '../recursos-humanos/recursos-humanos';
import { ServiciosViajeService } from '../servicios-viaje.service';
import type { ArchivoAdjunto, ComentarioViaje, Estatus, RecoleccionSeguimiento, ViajeRow } from '../viaje.model';
import { Subscription, filter } from 'rxjs';
import { InactivityService } from '../services/inactivity.service';
import { ActivityDetector } from '../services/activity.detector';
import { SessionService } from '../services/session.service';

export type { ArchivoAdjunto, ComentarioViaje, Estatus, RecoleccionSeguimiento, ViajeRow } from '../viaje.model';

export interface NavItem {
  id: string;
  label: string;
  ruta: string;
}

export interface EstatusOpcion {
  id: Estatus;
  label: string;
}

export type TipoUnidad = 'tracto' | 'camioneta' | 'van' | 'rabon' | 'torton';
export type RegistroTipoCaja = 'thermo' | 'seca';

export interface RegistroServicioRow {
  id: string;
  unidad: string;
  operador: string;
  tieneMultiplesRecolecciones: boolean;
  totalRecolecciones: number;
  recolecciones: { origen: string; destino: string }[];
  tipoUnidad: TipoUnidad | '' | 'caja';
  cajaTipo: TipoCaja | '';
  cajaNumero: string;
  eta: string; // datetime-local
  llegada: string; // datetime-local
  ingreso: string; // datetime-local
  carga: string; // datetime-local
  salida: string; // datetime-local
  descarga: string; // datetime-local
  clienteId: string;
  referencia: string;
  servicio: string;
  observaciones: string;
  podNombre: string;
  podMime: string;
  podBase64: string;
  podEntregado: boolean;
}

@Component({
  selector: 'app-vista-general',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    GestionFlota,
    RecursosHumanos,
    Facturacion,
    Nominas,
    Cuentas,
    Cobranza,
    Mantenimiento,
  ],
  templateUrl: './vista-general.html',
  styleUrls: ['./vista-general.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VistaGeneral implements OnInit, OnDestroy {
  private readonly maxArchivoBytes = 1_500_000;
  private readonly maxAdjuntos = 3;
  clientes: ClienteLocal[] = [];
  vehiculosActivos: VehiculoLocal[] = [];
  operadoresActivos: OperadorLocal[] = [];
  private flotaSub: Subscription = Subscription.EMPTY;
  private operadoresSub: Subscription = Subscription.EMPTY;
  private routerSub: Subscription = Subscription.EMPTY;
  private viajesSyncSub: Subscription = Subscription.EMPTY;
  private nextRegistroId = 1;
  private nextServicioId = 1;
  get unidadesDisponibles(): VehiculoLocal[] {
    return this.vehiculosActivos.filter((v) => v.tipo !== 'caja');
  }

  navItems: NavItem[] = [
    { id: 'gestion-flota', label: 'Gestion de flota', ruta: '/gestion-flota' },
    { id: 'recursos-humanos', label: 'Recursos humanos', ruta: '/recursos-humanos' },
    { id: 'facturacion', label: 'Facturacion', ruta: '/facturacion' },
    { id: 'nominas', label: 'Nominas', ruta: '/nominas' },
    { id: 'cuentas', label: 'Cuentas', ruta: '/cuentas' },
    { id: 'cobranza', label: 'Cobranza', ruta: '/cobranza' },
    { id: 'mantenimiento', label: 'Mantenimiento', ruta: '/mantenimiento' },
  ];

  estatusOpciones: EstatusOpcion[] = [
    { id: 'rojo', label: 'Detenido' },
    { id: 'amarillo', label: 'En ruta' },
    { id: 'verde', label: 'Terminado' },
  ];

  seccionActiva = 'general';
  generalExpanded = false;
  registroErrorMsg = '';
  notificaciones: { id: string; mensaje: string; tipo: 'ok' | 'error' }[] = [];

  registroServicios: RegistroServicioRow[] = [this.crearFilaRegistro()];
  serviciosGeneral: ViajeRow[] = [];
  viajeDetalleId: string | null = null;
  comentarioDetalleInput = '';

  get viajeDetalle(): ViajeRow | null {
    return this.serviciosGeneral.find((v) => v.id === this.viajeDetalleId) ?? null;
  }

  get tituloSeccion(): string {
    if (this.seccionActiva === 'general') return 'General';
    if (this.seccionActiva === 'registro-servicios') return 'Registro de servicios';
    const item = this.navItems.find((n) => n.id === this.seccionActiva);
    return item?.label ?? 'General';
  }

  readonly opcionesRecoleccion = [1, 2, 3, 4, 5];
  private readonly clientesService = inject(ClientesService);
  private readonly flotaService = inject(FlotaService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly serviciosViaje = inject(ServiciosViajeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly inactivityService = inject(InactivityService);
  private readonly activityDetector = inject(ActivityDetector);
  private readonly sessionService = inject(SessionService);

  constructor() {
    this.clientes = this.clientesService.obtenerClientes();
    this.vehiculosActivos = this.flotaService.obtenerVehiculos();
    this.operadoresActivos = this.flotaService.obtenerOperadores();
    this.flotaSub = this.flotaService.vehiculos$.subscribe((vehiculos) => {
      this.vehiculosActivos = vehiculos;
    });
    this.operadoresSub = this.flotaService.operadores$.subscribe((operadores) => {
      this.operadoresActivos = operadores;
    });
    this.serviciosGeneral = this.serviciosViaje.obtenerLista();
    if (!this.loginService.haySesionActiva()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.actualizarSeccionDesdeRuta(this.router.url);
    this.cdr.detectChanges();
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.actualizarSeccionDesdeRuta(event.urlAfterRedirects);
        this.cdr.markForCheck();
      });
    this.viajesSyncSub = this.serviciosViaje.obtenerViajes$().subscribe((viajes) => {
      this.serviciosGeneral = viajes;
      this.cdr.markForCheck();
    });
  }

  seleccionarSeccion(id: string): void {
    const item = this.navItems.find((n) => n.id === id);
    if (!item) return;
    this.seccionActiva = item.id;
    this.cdr.markForCheck();
    this.router.navigateByUrl(item.ruta);
  }

  irAGeneral(): void {
    this.seccionActiva = 'general';
    this.cdr.markForCheck();
    this.router.navigate(['/vista-general']);
  }

  toggleGeneralExpanded(): void {
    this.generalExpanded = !this.generalExpanded;
    this.cdr.markForCheck();
  }

  logout(): void {
    this.loginService.cerrarSesion();
    this.sessionService.destroySession();
    this.inactivityService.stopInactivityTimer();
    this.activityDetector.stopDetectingActivity();
    this.router.navigate(['/login']);
  }

  irARegistroServicios(): void {
    this.generalExpanded = true;
    this.seccionActiva = 'registro-servicios';
    this.cdr.markForCheck();
    this.router.navigate(['/registro-servicios']);
  }

  agregarFilaRegistro(): void {
    this.registroServicios = [...this.registroServicios, this.crearFilaRegistro()];
  }

  eliminarFilaRegistro(id: string): void {
    this.registroServicios = this.registroServicios.filter((r) => r.id !== id);
  }

  onTipoUnidadChange(row: RegistroServicioRow): void {
    if (row.tipoUnidad !== 'tracto') {
      row.cajaTipo = '';
      row.cajaNumero = '';
    }
  }

  onUnidadChange(row: RegistroServicioRow): void {
    const unidad = this.unidadesDisponibles.find((v) => v.numeroEconomico === row.unidad);
    row.tipoUnidad = (unidad?.tipo ?? '') as RegistroServicioRow['tipoUnidad'];
    this.onTipoUnidadChange(row);
  }

  cajasDisponibles(tipo: TipoCaja | ''): VehiculoLocal[] {
    return this.vehiculosActivos.filter((v) => v.tipo === 'caja' && (!tipo || v.tipoCaja === tipo));
  }

  toggleMultiplesRecolecciones(row: RegistroServicioRow): void {
    if (row.tieneMultiplesRecolecciones) {
      if (row.totalRecolecciones < 2) {
        row.totalRecolecciones = 2;
      }
    } else {
      row.totalRecolecciones = 1;
    }
    this.sincronizarRecolecciones(row);
  }

  onTotalRecoleccionesChange(row: RegistroServicioRow): void {
    if (!row.tieneMultiplesRecolecciones) {
      row.totalRecolecciones = 1;
    }
    this.sincronizarRecolecciones(row);
  }

  private sincronizarRecolecciones(row: RegistroServicioRow): void {
    const total = row.tieneMultiplesRecolecciones ? row.totalRecolecciones : 1;
    const actual = [...row.recolecciones];
    while (actual.length < total) {
      actual.push({ origen: '', destino: '' });
    }
    row.recolecciones = actual.slice(0, total);
  }

  onCajaTipoChange(row: RegistroServicioRow): void {
    if (!row.cajaTipo) {
      row.cajaNumero = '';
      return;
    }
    const pref = this.prefijoCaja(row.cajaTipo);
    const actual = (row.cajaNumero ?? '').trim();
    if (actual && !actual.toUpperCase().startsWith(pref)) {
      row.cajaNumero = pref;
    } else if (!actual) {
      row.cajaNumero = pref;
    }
  }

  prefijoCaja(tipo: RegistroTipoCaja): string {
    return tipo === 'thermo' ? 'TH' : '20';
  }

  ejemploCaja(tipo: RegistroTipoCaja): string {
    return tipo === 'thermo' ? 'TH101' : '201';
  }

  cajaNumeroValido(row: RegistroServicioRow): boolean {
    if (row.tipoUnidad !== 'tracto') return true;
    if (!row.cajaTipo) return false;
    const pref = this.prefijoCaja(row.cajaTipo);
    const val = (row.cajaNumero ?? '').trim().toUpperCase();
    if (!val.startsWith(pref)) return false;
    const consecutivo = val.slice(pref.length);
    if (row.cajaTipo === 'seca' && consecutivo.length === 0) {
      // Para caja seca se permite exactamente "20".
      return true;
    }
    if (consecutivo.length === 0) return false;
    return /^\d+$/.test(consecutivo);
  }

  registrarServicios(): void {
    this.registroErrorMsg = '';
    const errores = this.registroServicios
      .map((row, index) => this.validarFilaRegistro(row, index))
      .filter((error): error is string => !!error);

    if (errores.length) {
      this.registroErrorMsg = errores[0];
      return;
    }

    const serviciosNuevos = this.registroServicios
      .map((row) => this.mapearServicioPanel(row))
      .filter((item): item is ViajeRow => item !== null);

    if (!serviciosNuevos.length) return;
    this.serviciosGeneral = [...serviciosNuevos, ...this.serviciosGeneral];
    this.persistirServiciosGeneral();
    this.registroServicios = [this.crearFilaRegistro()];
    this.seccionActiva = 'general';
    this.mostrarPopup('Servicio registrado exitosamente.');
  }

  actualizarEstatus(viaje: ViajeRow, estatus: Estatus): void {
    if (viaje.archivosAdjuntos.length > 0 && estatus !== 'verde') {
      this.mostrarNotificacion('No se puede bajar estatus: el POD ya fue entregado.', 'error');
      viaje.estatus = 'verde';
      return;
    }
    viaje.estatus = estatus;
    this.persistirServiciosGeneral();
  }

  abrirDetalle(viaje: ViajeRow): void {
    this.viajeDetalleId = viaje.id;
  }

  cerrarDetalle(): void {
    this.viajeDetalleId = null;
  }

  guardarDetalle(): void {
    const viaje = this.viajeDetalle;
    if (!viaje) return;
    viaje.nombre = viaje.servicio.trim() || viaje.nombre;
    if (this.totalArchivosDetalle(viaje) > 0) {
      viaje.estatus = 'verde';
    }
    this.persistirServiciosGeneral();
    this.mostrarPopup('Detalle del servicio actualizado.');
  }

  agregarComentarioDetalle(): void {
    const viaje = this.viajeDetalle;
    if (!viaje) return;
    const mensaje = this.comentarioDetalleInput.trim();
    if (!mensaje) {
      this.registroErrorMsg = 'Escribe un comentario antes de enviarlo.';
      return;
    }
    const autor = this.loginService.obtenerSesionActiva();
    const autorNombre = autor ? `${autor.nombre} ${autor.apellido}`.trim() : 'Usuario';
    const autorPuesto = autor?.puesto?.trim() || 'Sin puesto';
    const comentario: ComentarioViaje = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      autorNombre,
      autorPuesto,
      mensaje,
      fechaIso: new Date().toISOString(),
    };
    viaje.comentarios = [...viaje.comentarios, comentario];
    viaje.observaciones = viaje.comentarios.map((c) => `${c.autorNombre}: ${c.mensaje}`).join('\n');
    this.comentarioDetalleInput = '';
    this.registroErrorMsg = '';
    this.persistirServiciosGeneral();
  }

  formatoFechaComentario(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return fechaIso;
    return fecha.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  diferenciaEtaLlegadaCarga(seg: RecoleccionSeguimiento): string {
    if (!seg.etaCarga || !seg.llegadaCarga) return 'Sin datos';
    const eta = new Date(seg.etaCarga);
    const llegada = new Date(seg.llegadaCarga);
    if (Number.isNaN(eta.getTime()) || Number.isNaN(llegada.getTime())) return 'Sin datos';
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
    if (Number.isNaN(eta.getTime()) || Number.isNaN(llegada.getTime())) return 'Sin datos';
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

  onArchivosSeleccionadosDetalle(event: Event, categoria: 'general' | 'cartaPorte' = 'general'): void {
    const viaje = this.viajeDetalle;
    const input = event.target as HTMLInputElement | null;
    if (!viaje) return;

    const files = Array.from(input?.files ?? []);
    if (!files.length) return;

    const listaActual = this.listaArchivosPorCategoria(viaje, categoria);
    if (listaActual.length + files.length > this.maxAdjuntos) {
      this.registroErrorMsg = `Solo se permiten ${this.maxAdjuntos} archivos por servicio.`;
      if (input) input.value = '';
      return;
    }

    const invalido = files.find((file) => !this.esTipoAdjuntoValido(file.type));
    if (invalido) {
      this.registroErrorMsg = `Archivo no valido: ${invalido.name}. Solo PDF o imagenes.`;
      if (input) input.value = '';
      return;
    }
    const pesado = files.find((file) => file.size > this.maxArchivoBytes);
    if (pesado) {
      this.registroErrorMsg = `El archivo ${pesado.name} excede 1.5 MB.`;
      if (input) input.value = '';
      return;
    }

    Promise.all(files.map((file) => this.leerArchivoBase64(file)))
      .then((adjuntos) => {
        if (categoria === 'general') {
          viaje.archivosAdjuntos = [...viaje.archivosAdjuntos, ...adjuntos];
        } else {
          viaje.archivosCartaPorte = [...viaje.archivosCartaPorte, ...adjuntos];
        }
        if (this.totalArchivosDetalle(viaje) > 0) viaje.estatus = 'verde';
        this.registroErrorMsg = '';
        this.persistirServiciosGeneral();
      })
      .catch(() => {
        this.registroErrorMsg = 'Ocurrio un error al cargar los archivos.';
      })
      .finally(() => {
        if (input) input.value = '';
      });
  }

  quitarArchivoDetalle(index: number, categoria: 'general' | 'cartaPorte' = 'general'): void {
    const viaje = this.viajeDetalle;
    if (!viaje) return;
    if (categoria === 'general') {
      viaje.archivosAdjuntos = viaje.archivosAdjuntos.filter((_, i) => i !== index);
    } else {
      viaje.archivosCartaPorte = viaje.archivosCartaPorte.filter((_, i) => i !== index);
    }
    this.persistirServiciosGeneral();
  }

  verArchivo(adjunto: ArchivoAdjunto): void {
    if (!adjunto.base64) return;
    const blob = this.base64ToBlob(adjunto.base64, adjunto.mime || 'application/octet-stream');
    const url = URL.createObjectURL(blob);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 15_000);
    }
  }

  archivosDisponiblesRestantes(viaje: ViajeRow): number {
    return this.maxAdjuntos - viaje.archivosAdjuntos.length;
  }

  archivosDisponiblesCartaPorte(viaje: ViajeRow): number {
    return this.maxAdjuntos - viaje.archivosCartaPorte.length;
  }

  obtenerIndiceRecoleccion(viaje: ViajeRow, seg: RecoleccionSeguimiento): number {
    return viaje.seguimientos.findIndex((item) => item === seg) + 1;
  }

  primerSeguimiento(viaje: ViajeRow): RecoleccionSeguimiento | null {
    return viaje.seguimientos[0] ?? null;
  }

  private validarFilaRegistro(row: RegistroServicioRow, index: number): string | null {
    const prefijo = `Fila ${index + 1}:`;
    if (!row.servicio.trim()) return `${prefijo} captura el nombre del servicio.`;
    if (!row.unidad.trim()) return `${prefijo} selecciona una unidad.`;
    if (!row.operador.trim()) return `${prefijo} captura el operador.`;
    if (!row.eta) return `${prefijo} captura la ETA.`;
    if (!row.clienteId) return `${prefijo} selecciona el cliente.`;
    if (!row.referencia.trim()) return `${prefijo} captura la referencia.`;

    const recoleccionesValidas = row.recolecciones.filter((r) => r.origen.trim() && r.destino.trim());
    if (!recoleccionesValidas.length) {
      return `${prefijo} captura al menos origen y destino en una recolección.`;
    }

    const recoleccionIncompleta = row.recolecciones.some((r) => {
      const origen = r.origen.trim();
      const destino = r.destino.trim();
      return (origen && !destino) || (!origen && destino);
    });
    if (recoleccionIncompleta) {
      return `${prefijo} cada recolección debe tener origen y destino.`;
    }

    if (row.tipoUnidad === 'tracto') {
      if (!row.cajaTipo) return `${prefijo} selecciona el tipo de caja.`;
      if (!row.cajaNumero.trim()) return `${prefijo} captura el número de caja.`;
      if (!this.cajaNumeroValido(row)) return `${prefijo} el número de caja no cumple el formato.`;
    }

    return null;
  }

  private mostrarPopup(message: string): void {
    this.mostrarNotificacion(message, 'ok');
  }

  cerrarNotificacion(id: string): void {
    this.notificaciones = this.notificaciones.filter((n) => n.id !== id);
  }

  private mostrarNotificacion(mensaje: string, tipo: 'ok' | 'error'): void {
    const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.notificaciones = [{ id, mensaje, tipo }, ...this.notificaciones];
  }

  private esTipoAdjuntoValido(mime: string): boolean {
    return mime === 'application/pdf' || mime.startsWith('image/');
  }

  private leerArchivoBase64(file: File): Promise<ArchivoAdjunto> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject();
          return;
        }
        const base64 = result.includes(',') ? result.split(',')[1] : '';
        if (!base64) {
          reject();
          return;
        }
        resolve({
          nombre: file.name,
          mime: file.type || 'application/octet-stream',
          base64,
        });
      };
      reader.onerror = () => reject();
      reader.readAsDataURL(file);
    });
  }

  private crearSeguimientoRecoleccion(origen: string, destino: string, etaCarga: string): RecoleccionSeguimiento {
    return {
      origen,
      destino,
      etaCarga,
      llegadaCarga: '',
      ingresoCarga: '',
      horaCarga: '',
      salidaCarga: '',
      etaDescarga: '',
      llegadaDescarga: '',
      ingresoDescarga: '',
      horaDescarga: '',
      salidaDescarga: '',
    };
  }

  private mapearServicioPanel(row: RegistroServicioRow): ViajeRow | null {
    const unidad = row.unidad.trim();
    const operador = row.operador.trim();
    const recoleccionesValidas = row.recolecciones
      .map((r) => ({ origen: r.origen.trim(), destino: r.destino.trim() }))
      .filter((r) => r.origen && r.destino);

    if (!unidad || !operador || !recoleccionesValidas.length) {
      return null;
    }

    const cliente = this.clientes.find((c) => c.id === row.clienteId)?.nombre ?? 'Sin cliente';
    const detalleCaja = row.cajaTipo && row.cajaNumero ? `Caja ${row.cajaTipo.toUpperCase()} ${row.cajaNumero}` : 'Sin caja';
    const ruta = recoleccionesValidas.map((r) => `${r.origen} -> ${r.destino}`).join(' | ');
    const nota = `${operador} | ${cliente} | ${detalleCaja}${row.referencia ? ` | Ref: ${row.referencia}` : ''}`;
    const seguimientos = recoleccionesValidas.map((rec) =>
      this.crearSeguimientoRecoleccion(rec.origen, rec.destino, row.eta)
    );
    const archivosAdjuntos = row.podBase64
      ? [{ nombre: row.podNombre || 'adjunto.pdf', mime: row.podMime || 'application/pdf', base64: row.podBase64 }]
      : [];

    return {
      id: `srv-${this.nextServicioId++}`,
      nombre: row.servicio.trim(),
      unidad,
      operador,
      servicio: row.servicio.trim(),
      ruta,
      nota,
      estatus: archivosAdjuntos.length ? 'verde' : 'amarillo',
      etaCarga: row.eta,
      llegadaCarga: '',
      ingresoCarga: '',
      horaCarga: '',
      salidaCarga: '',
      etaDescarga: '',
      llegadaDescarga: '',
      ingresoDescarga: '',
      horaDescarga: '',
      salidaDescarga: '',
      cliente,
      referencia: row.referencia.trim(),
      observaciones: '',
      comentarios: [],
      seguimientos,
      archivosAdjuntos,
      archivosCartaPorte: [],
      facturaPdf: null,
      reportePagoPdf: null,
      cobranzaTerminada: false,
    };
  }

  private crearFilaRegistro(): RegistroServicioRow {
    return {
      id: `rs-${this.nextRegistroId++}`,
      unidad: '',
      operador: '',
      tieneMultiplesRecolecciones: false,
      totalRecolecciones: 1,
      recolecciones: [{ origen: '', destino: '' }],
      tipoUnidad: '',
      cajaTipo: '',
      cajaNumero: '',
      eta: '',
      llegada: '',
      ingreso: '',
      carga: '',
      salida: '',
      descarga: '',
      clienteId: '',
      referencia: '',
      servicio: '',
      observaciones: '',
      podNombre: '',
      podMime: '',
      podBase64: '',
      podEntregado: false,
    };
  }

  private persistirServiciosGeneral(): void {
    this.serviciosViaje.persistirLista(this.serviciosGeneral);
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const bytes = atob(base64);
    const len = bytes.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      out[i] = bytes.charCodeAt(i);
    }
    return new Blob([out], { type: mimeType });
  }

  private listaArchivosPorCategoria(viaje: ViajeRow, categoria: 'general' | 'cartaPorte'): ArchivoAdjunto[] {
    return categoria === 'general' ? viaje.archivosAdjuntos : viaje.archivosCartaPorte;
  }

  private totalArchivosDetalle(viaje: ViajeRow): number {
    return viaje.archivosAdjuntos.length + viaje.archivosCartaPorte.length;
  }

  resetFiltro(): void {
    this.seccionActiva = 'general';
    this.viajeDetalleId = null;
    this.serviciosViaje.limpiarTodo();
    this.serviciosGeneral = this.serviciosViaje.obtenerLista();
    this.registroErrorMsg = '';
  }

  ngOnDestroy(): void {
    this.flotaSub.unsubscribe();
    this.operadoresSub.unsubscribe();
    this.routerSub.unsubscribe();
    this.viajesSyncSub.unsubscribe();
  }

  private actualizarSeccionDesdeRuta(url: string): void {
    const sinQuery = url.split('?')[0] ?? '';
    const partsHash = sinQuery.split('#');
    const candidato = partsHash.length > 1 && partsHash[1] ? partsHash[1] : partsHash[0];

    const partes = candidato.split('/').filter(Boolean);
    const segmento = partes[partes.length - 1] ?? '';

    if (!segmento) {
      this.seccionActiva = 'general';
      this.cdr.markForCheck();
      return;
    }
    
    if (segmento === 'vista-general') {
      this.seccionActiva = 'general';
      this.cdr.markForCheck();
      return;
    }
    
    if (segmento === 'registro-servicios') {
      this.generalExpanded = true;
      this.seccionActiva = 'registro-servicios';
      this.cdr.markForCheck();
      return;
    }

    const item = this.navItems.find((n) => n.id === segmento);
    if (item) {
      this.seccionActiva = item.id;
      this.cdr.markForCheck();
      return;
    }

    this.seccionActiva = 'general';
    this.cdr.markForCheck();
  }
}
