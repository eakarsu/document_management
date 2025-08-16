// API utility for making authenticated requests to the backend
// Use same-origin API calls (proxied by Next.js) to avoid CSP issues
export const API_BASE_URL = '';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from localStorage for Bearer authentication
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }
    
    // Check if body is FormData - don't set Content-Type for FormData
    const isFormData = options.body instanceof FormData;
    
    const defaultHeaders: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Only set Content-Type for non-FormData requests
      ...(!isFormData && { 'Content-Type': 'application/json' }),
    };
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    return fetch(url, finalOptions);
  }

  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    const isFormData = data instanceof FormData;
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    const isFormData = data instanceof FormData;
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }
}

// Default instance
export const apiClient = new ApiClient();

// Helper functions
export const api = {
  get: (endpoint: string, options?: RequestInit) => apiClient.get(endpoint, options),
  post: (endpoint: string, data?: any, options?: RequestInit) => apiClient.post(endpoint, data, options),
  put: (endpoint: string, data?: any, options?: RequestInit) => apiClient.put(endpoint, data, options),
  delete: (endpoint: string, options?: RequestInit) => apiClient.delete(endpoint, options),
};