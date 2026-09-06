export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

export async function apiPatch<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed`);
  return res.json();
}

export const DEFECT_LABELS: Record<string, string> = {
  transverse_crack: 'Transverse Crack',
  longitudinal_crack: 'Longitudinal Crack',
  spalling: 'Rail Head Spalling',
  corrugation: 'Rail Corrugation',
  missing_fastener: 'Missing Fastener',
  gauge_widening: 'Gauge Widening',
  joint_gap: 'Excessive Joint Gap',
  ballast_deficiency: 'Ballast Deficiency',
};

export function relativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function fmtNum(n: number, digits = 0): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
