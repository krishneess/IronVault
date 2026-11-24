/**
 * HTTP client for the IronVault API (Presentation tier → Application tier).
 * The browser only ever talks to the Express API; it never connects to MongoDB.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'ironvault_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiRequestError extends Error {
  constructor(message, status = 0, errors = undefined, code = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

function buildUrl(path, params) {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, value);
  });
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Performs a request and returns the API envelope: { success, message, data, meta }. */
export async function apiRequest(path, { method = 'GET', body, params, signal } = {}) {
  const token = tokenStore.get();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiRequestError('Unable to reach the IronVault server. Check your connection and try again.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('ironvault:unauthorized', { detail: payload?.message }));
    }
    throw new ApiRequestError(
      payload?.message || `Request failed (${response.status})`,
      response.status,
      payload?.errors,
      payload?.code
    );
  }

  return payload;
}

export const api = {
  get: (path, params, options) => apiRequest(path, { ...options, params }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
