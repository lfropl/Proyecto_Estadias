const TOKEN_KEY = 'tgj_token';

export function guardarToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function eliminarToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isDev ? 'http://localhost:3000' : '';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const fullUrl = `${API_BASE}${url}`;
  const token = obtenerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(fullUrl, { ...options, headers });
}
