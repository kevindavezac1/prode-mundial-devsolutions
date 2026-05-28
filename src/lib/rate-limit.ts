/**
 * Rate limiter simple en memoria — sin dependencias externas.
 * En Vercel cada función serverless tiene su propio proceso,
 * por lo que el Map se resetea entre cold starts.
 * Suficiente para ~1000 usuarios: limita abuso dentro de una instancia.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const WINDOW_MS = 60_000; // 1 minuto

function cleanup() {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}

/**
 * @param key    Identificador único (ej: "POST:/api/leagues:1.2.3.4")
 * @param max    Máximo de requests permitidos en la ventana de 1 minuto
 * @returns true si permitido, false si excede el límite
 */
export function checkRateLimit(key: string, max: number): boolean {
  // Limpieza probabilística (~1%) para evitar memory leak
  if (Math.random() < 0.01) cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/**
 * Extrae IP del request — compatible con Vercel y localhost.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
