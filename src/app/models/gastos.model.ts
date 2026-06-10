export interface GastoOperacional {
  id: string;
  fecha: string;
  tipo: 'combustible' | 'mantenimiento' | 'peaje' | 'cuota' | 'reparacion' | 'otro';
  vehiculoId: string;
  conductorId?: string;
  monto: number;
  descripcion: string;
  comprobante?: string;
  kmRegistro?: number;
  lugarGasto: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'credito';
  responsable: string;
  status: 'registrado' | 'validado' | 'reembolsado';
  viajeRelacionado?: string;
}

export interface ConsumoCombustible {
  id: string;
  vehiculoId: string;
  fecha: string;
  litros: number;
  precioLitro: number;
  total: number;
  kmRegistro: number;
  proveedor: string;
  comprobante: string;
  conductor?: string;
  lugarCarga: string;
}

export interface TarifaPeaje {
  id: string;
  carreteras: string;
  tipoCobro: 'por-vehiculo' | 'por-contenedor';
  montoPeaje: number;
  frecuencia: 'por-cruce' | 'mensual' | 'anual';
  vigenciaInicio: string;
  vigenciaFin: string;
}
