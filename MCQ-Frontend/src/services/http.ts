import axios from 'axios';
import { API_BASE_URL } from '../config';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    // Prevent cached 304 responses by busting cache on GETs
    if ((config.method || 'get').toLowerCase() === 'get') {
      Object.assign(config.headers, {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      });
      config.params = {
        ...(config.params || {}),
        _ts: Date.now(),
      };
    }

    console.log('🚀 [REQUEST]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer ***' : undefined,
      },
      data: config.data,
      timestamp: new Date().toISOString(),
    });
    return config;
  },
  (error) => {
    console.error('❌ [REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ [RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  (error) => {
    console.error('❌ [RESPONSE ERROR]', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      timestamp: new Date().toISOString(),
    });

    if (
      error?.response?.status === 401 &&
      (error?.response?.data?.message === 'Invalid or expired token' ||
        error?.response?.data?.error === 'Invalid or expired token')
    ) {
      console.log('🔒 [AUTH] Detected invalid/expired token. Triggering unauthorized handler.');
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log('🔑 [AUTH TOKEN SET]', { hasToken: true });
    return;
  }

  delete axiosInstance.defaults.headers.common.Authorization;
  console.log('🔑 [AUTH TOKEN REMOVED]');
}
