import api from './api'
import type { User } from '@/types'

export type { User }

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: 'owner' | 'admin' | 'user'
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/api/v1/auth/login', credentials)
    const { access_token, refresh_token } = response.data

    // Store tokens in sessionStorage (tab-specific, prevents multi-tab conflicts)
    sessionStorage.setItem('access_token', access_token)
    sessionStorage.setItem('refresh_token', refresh_token)

    // Get user info
    const user = await this.getMe()

    return {
      user,
      tokens: {
        access_token,
        refresh_token,
        token_type: 'bearer',
      },
    }
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post('/api/v1/auth/register', data)
    const { access_token, refresh_token } = response.data

    // Store tokens in sessionStorage (tab-specific, prevents multi-tab conflicts)
    sessionStorage.setItem('access_token', access_token)
    sessionStorage.setItem('refresh_token', refresh_token)

    // Get user info
    const user = await this.getMe()

    return {
      user,
      tokens: {
        access_token,
        refresh_token,
        token_type: 'bearer',
      },
    }
  },

  async logout(): Promise<void> {
    const refreshToken = sessionStorage.getItem('refresh_token')
    try {
      if (refreshToken) {
        await api.post('/api/v1/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Ignore logout API errors - we'll clear tokens regardless
    } finally {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get('/api/v1/auth/me')
    return response.data
  },

  async refreshToken(): Promise<string> {
    const refreshToken = sessionStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    })

    const { access_token } = response.data
    sessionStorage.setItem('access_token', access_token)

    return access_token
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('access_token')
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token')
  },
}
