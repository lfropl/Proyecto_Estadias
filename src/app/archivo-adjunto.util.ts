import type { ArchivoAdjunto } from './viaje.model';

export const MAX_ADJUNTO_BYTES = 1_500_000;

export function leerArchivoBase64(file: File): Promise<ArchivoAdjunto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject();
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : '';
      if (!base64) {
        reject();
        return;
      }
      resolve({
        nombre: file.name,
        mime: file.type || 'application/octet-stream',
        base64,
      });
    };
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });
}

export function abrirAdjuntoEnNuevaPestana(adjunto: ArchivoAdjunto): void {
  if (!adjunto.base64) return;
  const bytes = atob(adjunto.base64);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes.charCodeAt(i);
  }
  const blob = new Blob([out], { type: adjunto.mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  }
}
