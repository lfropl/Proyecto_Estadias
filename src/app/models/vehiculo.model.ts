export type TipoVehiculo = 'tracto' | 'camioneta' | 'van' | 'rabon' | 'torton' | 'plataforma';
export type TipoCaja = 'thermo' | 'seca' | 'caja-cerrada' | 'plataforma';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo;
  cajaType: TipoCaja;
  capacidadCarga: number; // kg
  numeroSerie: string;
  status: 'activo' | 'inactivo' | 'mantenimiento' | 'fuera-de-servicio';
  fechaAdquisicion: string;
  kilometer: number;
  proximoMantenimiento: string;
  seguroVencimiento: string;
  verificacionVencimiento: string;
  propietario: string;
  responsable?: string;
  asignacionActual?: string; // ID del viaje actual
}

export interface MantenimientoVehiculo {
  id: string;
  vehiculoId: string;
  fecha: string;
  tipo: 'preventivo' | 'correctivo' | 'otro';
  descripcion: string;
  costo: number;
  responsable: string;
  proxTerminacion?: string;
}

export interface UbicacionVehiculo {
  vehiculoId: string;
  latitud: number;
  longitud: number;
  timestamp: string;
  velocidad: number;
  direccion: string;
}
