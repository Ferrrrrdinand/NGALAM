const API_BASE = '';

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

export interface FetchApiOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function fetchApi<T = any>(endpoint: string, options: FetchApiOptions = {}): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('ngalam_jwt_token') || localStorage.getItem('ngalam_jwt_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const reqInit: RequestInit = { ...options };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    defaultHeaders['Content-Type'] = 'application/json';
    reqInit.body = JSON.stringify(options.body);
  } else if (options.body) {
    reqInit.body = options.body;
  }

  // Include credentials for session cookies
  reqInit.credentials = 'same-origin';
  reqInit.headers = { ...defaultHeaders, ...(options.headers as any || {}) };

  let res: Response;
  try {
    res = await fetch(url, reqInit);
  } catch {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.'
      } as any
    };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.message && !data.error) {
    data.message = res.status === 401
      ? 'Sesi atau kredensial tidak valid. Silakan login kembali.'
      : res.status === 403
        ? 'Akses ditolak untuk akun ini.'
        : res.status === 404
          ? 'Data atau endpoint tidak ditemukan.'
          : res.status >= 500
            ? 'Server sedang bermasalah. Coba beberapa saat lagi.'
            : `Permintaan gagal (HTTP ${res.status}).`;
  }
  return { ok: res.ok, status: res.status, data };
}

export function formatRp(num: number | string | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export function formatDateId(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}
