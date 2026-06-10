export interface Cliente {
  id: string;
  razonSocial: string;
  rfc: string;
  email: string;
  telefono: string;
  domicilio: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  contactoPrincipal: string;
  telefonoContacto: string;
  status: 'activo' | 'inactivo';
  creditoDisponible: number;
  diasCredito: number;
  limiteCredito: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  tipo: 'combustible' | 'mecanica' | 'llantas' | 'seguros' | 'otro';
  email: string;
  telefono: string;
  domicilio: string;
  ciudad: string;
  contactoComercial: string;
  telefonoContacto: string;
  status: 'activo' | 'inactivo';
  creditoDisponible: number;
}

export interface ClienteCuenta {
  id: string;
  clienteId: string;
  banco: string;
  cuentaNumero: string;
  tipoCuenta: 'ahorro' | 'cheques' | 'credito';
  titular: string;
  status: 'activa' | 'inactiva';
}
