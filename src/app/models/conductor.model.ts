export interface Conductor {
  id: string;
  nombre: string;
  apellido: string;
  licencia: string;
  licenciaVencimiento: string;
  telefonoContacto: string;
  email: string;
  status: 'activo' | 'inactivo' | 'suspendido';
  fechaContratacion: string;
  salarioBase: number;
  departamento: string;
  documentoIdentidad: string;
  domicilio: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  vigente: boolean;
}

export interface ConductorRegistro {
  id: string;
  conductor: Conductor;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  vehiculoAsignado: string;
  rutaAsignada: string;
  kmInicio: number;
  kmFinal: number;
  combustibleInicio: number;
  combustibleFinal: number;
  gastos: Gasto[];
  observaciones: string;
}

export interface Gasto {
  id: string;
  tipo: 'combustible' | 'mantenimiento' | 'peaje' | 'otro';
  monto: number;
  descripcion: string;
  fecha: string;
  comprobante?: string;
}
