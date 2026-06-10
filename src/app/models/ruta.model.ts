export interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  origenLatitud: number;
  origenLongitud: number;
  destinoLatitud: number;
  destinoLongitud: number;
  kmTotales: number;
  tiempoEstimado: number; // minutos
  status: 'activa' | 'inactiva' | 'archivada';
  costoPorKm: number;
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'eventual';
  paradas: Parada[];
}

export interface Parada {
  id: string;
  rutaId: string;
  nombre: string;
  latitud: number;
  longitud: number;
  orden: number;
  tipoParada: 'carga' | 'descarga' | 'recoleccion';
  horaEstimada: string;
  contacto: string;
  telefono: string;
  referencia: string;
}

export interface SeguimientoRuta {
  id: string;
  rutaId: string;
  viajeId: string;
  conductorId: string;
  fecha: string;
  hora: string;
  latitud: number;
  longitud: number;
  estadoViaje: 'iniciado' | 'en-transito' | 'parada' | 'completado' | 'cancelado';
  velocidadPromedio: number;
  distanciaRecorrida: number;
  eventosRegistrados: EventoSeguimiento[];
}

export interface EventoSeguimiento {
  id: string;
  tipo: 'llegada' | 'salida' | 'parada-emergencia' | 'desviacion' | 'otro';
  timestamp: string;
  ubicacion: string;
  latitud: number;
  longitud: number;
  descripcion: string;
  severidad: 'baja' | 'media' | 'alta';
}
