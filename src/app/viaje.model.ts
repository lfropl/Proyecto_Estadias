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

export interface GastoViaje {
  id: string;
  concepto: string;
  monto: number;
  fechaIso: string;
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
  /** Indica si la factura requiere carta porte */
  facturaRequiereCartaPorte?: boolean;
  /** Datos fiscales de la factura */
  facturaFolio?: string;
  facturaUuid?: string;
  facturaSubtotal?: number;
  facturaIva?: number;
  facturaRetencionIsr?: number;
  facturaRetencionIva?: number;
  facturaTotal?: number;
  facturaFechaEmision?: string;
  facturaFechaPago?: string;
  facturaMetodoPago?: string;
  facturaFormaPago?: string;
  facturaEstatus?: 'pendiente' | 'emitida' | 'pagada' | 'cancelada';
  facturaObservaciones?: string;
  /** Reporte de pago (solo módulo Cobranza) */
  reportePagoPdf: ArchivoAdjunto | null;
  cobranzaMetodoPago?: string;
  cobranzaFechaPago?: string;
  cobranzaReferencia?: string;
  /** Costo del servicio (para facturación y cuentas) */
  costoServicio: number;
  /** Gastos operativos asociados a este viaje */
  gastos: GastoViaje[];
  cobranzaTerminada: boolean;
}
