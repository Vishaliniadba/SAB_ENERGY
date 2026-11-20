// Base helper for standard JSON API requests
export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

// Caches the successfully resolved API base URL across all requests
let cachedWorkingBaseUrl: string | null = null;

/**
 * Returns candidate base URLs for API requests.
 * In browser environments, relative path ('') is prioritized first so all calls
 * are routed through the Vite dev server proxy (or IIS reverse proxy).
 * This completely avoids browser CORS preflight (OPTIONS) errors on POST/PUT/DELETE.
 */
export const getCandidateBaseUrls = (): string[] => {
  if (typeof window !== 'undefined') {
    const list: string[] = [];

    // If a working base URL was previously confirmed, prioritize it
    if (cachedWorkingBaseUrl !== null) {
      list.push(cachedWorkingBaseUrl);
    }

    // Relative path routes through Vite dev server proxy or IIS/Nginx
    list.push('');

    // Explicit override saved in localStorage
    const saved = localStorage.getItem('sab_api_base_url');
    if (saved && saved.trim()) {
      list.push(saved.trim().replace(/\/$/, ''));
    }

    // Environment configured API URL
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envBase && typeof envBase === 'string' && envBase.trim()) {
      list.push(envBase.trim().replace(/\/$/, ''));
    }

    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
    if (backendUrl && typeof backendUrl === 'string' && backendUrl.trim()) {
      list.push(backendUrl.trim().replace(/\/$/, ''));
    }

    const enerlinkEnv = (import.meta as any).env?.VITE_ENERLINK_URL;
    if (enerlinkEnv && typeof enerlinkEnv === 'string' && enerlinkEnv.trim() && !enerlinkEnv.includes('5114')) {
      list.push(enerlinkEnv.trim().replace(/\/$/, ''));
    }

    // Direct backend host fallback
    list.push('http://192.23.1.7:8007');

    return Array.from(new Set(list));
  }

  return ['http://192.23.1.7:8007'];
};

/**
 * Clear cached working base URL (e.g. on network switch or retry)
 */
export const resetApiBaseUrlCache = () => {
  cachedWorkingBaseUrl = null;
};

export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const candidates = getCandidateBaseUrls();

  let lastError: any = null;

  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i];
    const fullUrl = base ? `${base}${cleanEndpoint}` : cleanEndpoint;
    const isLastCandidate = i === candidates.length - 1;

    try {
      const isBodyMethod = options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase());
      const headers: Record<string, string> = {
        Accept: 'application/json, text/plain, */*',
        ...(options.headers || {}),
      };

      // Only attach Content-Type: application/json for requests with payloads
      // This prevents triggering unnecessary CORS preflight OPTIONS failures on simple GET calls
      if (isBodyMethod && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Add a request timeout to avoid hanging UI tables
      const timeoutMs = options.timeoutMs ?? 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const config: RequestInit = {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      };

      let response: Response;
      try {
        response = await fetch(fullUrl, config);
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        // Cache the working base URL for instant subsequent requests
        cachedWorkingBaseUrl = base;

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return (await response.json()) as T;
        }
        const text = await response.text();
        return (text ? JSON.parse(text) : {}) as T;
      }

      // Parse error payload from the API
      let errorData: any = null;
      let errorMessage = `Request to ${fullUrl} failed with status ${response.status}`;
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const txt = await response.text();
          try { errorData = JSON.parse(txt); } catch { errorData = txt; }
        }
      } catch (_) {}

      if (errorData) {
        if (typeof errorData === 'object' && errorData.errors) {
          const msgs = Object.entries(errorData.errors)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join('; ');
          if (msgs) errorMessage = `Validation Error (${response.status}): ${msgs}`;
        } else if (typeof errorData === 'object' && (errorData.title || errorData.message)) {
          errorMessage = errorData.title || errorData.message;
        }
      }

      // For 400 (Bad Request) or 404 (Not Found), this host is definitely the real API!
      if (response.status === 400 || response.status === 404) {
        cachedWorkingBaseUrl = base;
      }

      const err: any = new Error(errorMessage);
      err.status = response.status;
      err.data = errorData;
      err.errors = errorData?.errors;
      throw err;
    } catch (err: any) {
      lastError = err;

      // If the API server responded with 400 or 404, it is active and reached.
      // Do not fail over to other hosts - throw immediately so the component can handle it.
      if (err?.status === 400 || err?.status === 404) {
        cachedWorkingBaseUrl = base;
        throw err;
      }

      // Invalidate cached base URL only on genuine network failure
      if (cachedWorkingBaseUrl === base) {
        cachedWorkingBaseUrl = null;
      }

      // If this wasn't the last candidate, try next candidate
      if (!isLastCandidate) {
        continue;
      }
    }
  }

  // If cached URL was tried and failed with a network error, clear cache
  if (cachedWorkingBaseUrl !== null) {
    cachedWorkingBaseUrl = null;
  }

  throw lastError || new Error(`All candidate API endpoints failed for ${cleanEndpoint}`);
}

// Convenient REST client wrapper
export const apiClient = {
  get: <T = any>(url: string, options?: RequestOptions): Promise<T> =>
    request<T>(url.startsWith('/api') ? url : `/api${url}`, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body: any = {}, options?: RequestOptions): Promise<T> =>
    request<T>(url.startsWith('/api') ? url : `/api${url}`, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),

  put: <T = any>(url: string, body: any = {}, options?: RequestOptions): Promise<T> =>
    request<T>(url.startsWith('/api') ? url : `/api${url}`, {
      ...options,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),

  delete: <T = any>(url: string, options?: RequestOptions): Promise<T> =>
    request<T>(url.startsWith('/api') ? url : `/api${url}`, { ...options, method: 'DELETE' }),
};

export default apiClient;
