export type Estatus = 'rojo' | 'amarillo' | 'verde';

export interface ArchivoAdjunto {
  nombre: string;
  mime: string;
  base64: string;
}

export interface ComentarioViaje {
  id: string;
  autorNombre: string;
  autorPuesto: string;
  mensaje: string;
  fechaIso: string;
}

export interface RecoleccionSeguimiento {
  origen: string;
  destino: string;
  etaCarga: string;
  llegadaCarga: string;
  ingresoCarga: string;
  horaCarga: string;
  salidaCarga: string;
  etaDescarga: string;
  llegadaDescarga: string;
  ingresoDescarga: string;
  horaDescarga: string;
  salidaDescarga: string;
}

export interface ViajeRow {
  id: string;
  nombre: string;
  unidad: string;
  operador: string;
  servicio: string;
  ruta: string;
  nota: string;
  estatus: Estatus;
  etaCarga: string;
  llegadaCarga: string;
  ingresoCarga: string;
  horaCarga: string;
  salidaCarga: string;
  etaDescarga: string;
  llegadaDescarga: string;
  ingresoDescarga: string;
  horaDescarga: string;
  salidaDescarga: string;
  cliente: string;
  referencia: string;
  observaciones: string;
  comentarios: ComentarioViaje[];
  seguimientos: RecoleccionSeguimiento[];
  /** POD y adjuntos operativos en monitoreo */
  archivosAdjuntos: ArchivoAdjunto[];
  archivosCartaPorte: ArchivoAdjunto[];
  /** PDF de factura (solo módulo Facturación) */
  facturaPdf: ArchivoAdjunto | null;
  /** Reporte de pago (solo módulo Cobranza) */
  reportePagoPdf: ArchivoAdjunto | null;
  cobranzaTerminada: boolean;
}
