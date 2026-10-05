/**
 * LANOVA Centralized API Client
 * Automatically attaches authentication headers and handles API errors.
 */

/**
 * Dynamically resolves the backend API URL.
 * Automatically adapts to the current browser hostname (e.g. localhost or a LAN IP like 192.168.0.11)
 * so that devices on the same local network connect to the host's backend port 5000.
 */
export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
}

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const token = sessionStorage.getItem('lanova_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to LANOVA server. Please ensure the backend is running.');
    }
    throw error;
  }
}

/**
 * Safely resolves relative media/upload paths (e.g. /uploads/image.png)
 * to full backend server URLs based on current network host.
 */
export function getMediaUrl(path) {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  del: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  upload: async (endpoint, formData, options = {}) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const token = sessionStorage.getItem('lanova_token');

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Upload failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      throw error;
    }

    return data;
  },
};

export default api;
