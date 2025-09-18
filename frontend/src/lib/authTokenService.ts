interface TokenInfo {
  accessToken: string | null;
  refreshToken: string | null;
  isValid: boolean;
}

class AuthTokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Don't cache tokens in constructor - always read fresh from localStorage
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  getTokenInfo(): TokenInfo {
    // Always read fresh from localStorage, never use cached values
    if (typeof window !== 'undefined') {
      const freshAccessToken = localStorage.getItem('accessToken');
      const freshRefreshToken = localStorage.getItem('refreshToken');
      return {
        accessToken: freshAccessToken,
        refreshToken: freshRefreshToken,
        isValid: !!freshAccessToken
      };
    }
    return {
      accessToken: null,
      refreshToken: null,
      isValid: false
    };
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearTokens();
      return false;
    }
  }

  getAccessToken(): string | null {
    const tokenInfo = this.getTokenInfo();
    return tokenInfo.accessToken;
  }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Always get fresh token info
    const tokenInfo = this.getTokenInfo();
    
    if (!tokenInfo.isValid) {
      // Try to get token from cookies or user data
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.accessToken) {
            this.setTokens(user.accessToken, user.refreshToken || '');
          }
        }
      }
    }

    // Get fresh token again after potential update
    const currentToken = this.getTokenInfo();

    // Prepare headers
    const headers = new Headers(options.headers);
    if (currentToken.accessToken) {
      headers.set('Authorization', `Bearer ${currentToken.accessToken}`);
    }
    headers.set('Content-Type', 'application/json');

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // If unauthorized, try to refresh the token
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        const newTokenInfo = this.getTokenInfo();
        headers.set('Authorization', `Bearer ${newTokenInfo.accessToken}`);
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      }
    }

    return response;
  }
}

// Export a singleton instance
export const authTokenService = new AuthTokenService();