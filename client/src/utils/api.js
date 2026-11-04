const API_BASE = '';

export async function fetchApi(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  const defaultHeaders = {
    'Accept': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('ngalam_jwt_token') || localStorage.getItem('ngalam_jwt_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    defaultHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  // Include credentials for session cookies
  options.credentials = 'same-origin';
  options.headers = { ...defaultHeaders, ...(options.headers || {}) };

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function formatRp(num) {
  if (num === null || num === undefined || isNaN(Number(num))) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export function formatDateId(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}
