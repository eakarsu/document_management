interface TokenInfo { accessToken: null; refreshToken: null; isValid: boolean }

class AuthTokenService {
  setTokens(_accessToken?: string, _refreshToken?: string): void {
    // Tokens are intentionally held only in HttpOnly cookies.
    this.clearTokens();
  }

  getTokenInfo(): TokenInfo { return { accessToken: null, refreshToken: null, isValid: typeof window !== 'undefined' }; }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) this.clearTokens();
    return response.ok;
  }

  getAccessToken(): null { return null; }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    let response = await fetch(url, { ...options, headers, credentials: 'include' });
    if (response.status === 401 && !url.endsWith('/api/auth/refresh') && await this.refreshAccessToken()) {
      response = await fetch(url, { ...options, headers, credentials: 'include' });
    }
    return response;
  }
}

export const authTokenService = new AuthTokenService();
