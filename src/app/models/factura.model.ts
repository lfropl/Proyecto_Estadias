export interface Factura {
  id: string;
  folio: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  rfc: string;
  domicilio: string;
  concepto: string;
  viajesRelacionados: string[]; // IDs de viajes
  subtotal: number;
  iva: number;
  total: number;
  status: 'borrador' | 'emitida' | 'pagada' | 'cancelada';
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito';
  condicionesPago: string;
  observaciones: string;
  fechaPago?: string;
  comprobantePago?: string;
}

export interface ConceptoFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  unitario: number;
  subtotal: number;
  impuesto: number;
  total: number;
}

export interface TicketIncobrable {
  id: string;
  facturaId: string;
  clienteId: string;
  monto: number;
  fechaVencimiento: string;
  diasVencido: number;
  razonIncumplimiento: string;
  accionesTomadas: string[];
  contactoRealizado: boolean;
  statusCobro: 'pendiente' | 'proceso' | 'incobrable' | 'recuperado';
}
