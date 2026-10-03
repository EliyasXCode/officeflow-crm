export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: any;
}

const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const apiPrefix = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const rawBase = ((import.meta as any).env?.VITE_API_URL || '') as string;
  const baseUrl = rawBase.replace(/\/$/, '');
  const url = `${baseUrl}${apiPrefix}`;
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryStr = searchParams.toString();
  return queryStr ? `${url}?${queryStr}` : url;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    // If not already on login/accept-invite page, redirect to login
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/accept-invite')) {
      window.dispatchEvent(new CustomEvent('officeflow:unauthorized'));
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const text = await response.text();
    return text as unknown as T;
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch (err) {
    data = { success: false, message: response.statusText };
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
};

export const api = {
  get: async <T = any>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    const res = await fetch(buildUrl(endpoint, params), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<T>(res);
  },

  post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const res = await fetch(buildUrl(endpoint), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  put: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const res = await fetch(buildUrl(endpoint), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const res = await fetch(buildUrl(endpoint), {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<T>(res);
  },

  downloadCsv: async (endpoint: string, filename: string): Promise<void> => {
    const res = await fetch(buildUrl(endpoint), {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
