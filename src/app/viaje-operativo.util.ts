import type { RecoleccionSeguimiento, ViajeRow } from './viaje.model';

function seguimientoCompleto(seg: RecoleccionSeguimiento): boolean {
  const campos = [
    seg.llegadaCarga,
    seg.ingresoCarga,
    seg.horaCarga,
    seg.salidaCarga,
    seg.etaDescarga,
    seg.llegadaDescarga,
    seg.ingresoDescarga,
    seg.horaDescarga,
    seg.salidaDescarga,
  ];
  return campos.every((c) => !!String(c ?? '').trim());
}

/**
 * Viaje listo para pasar a Facturación / Cobranza:
 * POD cargado y todos los campos de seguimiento (carga/descarga) llenos en cada recolección.
 */
export function esViajeListoFacturacionCobranza(v: ViajeRow): boolean {
  if (!v.archivosAdjuntos?.length) return false;
  if (!v.seguimientos?.length) return false;
  return v.seguimientos.every((s) => seguimientoCompleto(s));
}
