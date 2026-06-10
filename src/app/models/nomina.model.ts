export interface Nomina {
  id: string;
  periodoInicio: string;
  periodoFin: string;
  conductorId: string;
  conductorNombre: string;
  salarioBase: number;
  viajesRealizados: number;
  bonificacionViajes: number;
  viaticosRecibidos: number;
  deducciones: Deduccion[];
  totalDeducciones: number;
  neto: number;
  status: 'borrador' | 'procesada' | 'pagada';
  fechaPago?: string;
  referenciaPago?: string;
}

export interface Deduccion {
  id: string;
  tipo: 'impuestos' | 'seguro' | 'fondo' | 'prestamo' | 'otro';
  descripcion: string;
  monto: number;
}

export interface BonificacionViaje {
  id: string;
  conductorId: string;
  viajeId: string;
  kilometros: number;
  tarifa: number;
  bonificacionPorKm: number;
  bonificacionPuntualidad: number;
  bonificacionSeguridadOtro: number;
  totalBonificacion: number;
  fecha: string;
}
