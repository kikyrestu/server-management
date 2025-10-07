"use client"

import React, { useState, useEffect, createContext, useContext, ReactNode, useRef, useCallback } from 'react'
import LoginForm from '@/components/LoginForm'

interface User {
  username: string
  uid: number
  home: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const checkSessionRef = useRef<() => Promise<void>>()
  const lastCheckTime = useRef(0)

  // Debounced session check - lebih jarang biar ga ganggu!
  checkSessionRef.current = useCallback(async () => {
    const now = Date.now()
    // Cek session paling sering 30 detik sekali aja!
    if (now - lastCheckTime.current < 30000) {
      return
    }
    lastCheckTime.current = now
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(data.session.id)
      } else if (response.status === 401) {
        // Hanya clear kalau memang 401 (session expired)
        setUser(null)
        setToken(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      // Kalau error network, JANGAN logout! Pakai cache aja
      const savedUser = localStorage.getItem('auth_user')
      const savedToken = localStorage.getItem('auth_token')
      
      if (savedUser && savedToken) {
        try {
          setUser(JSON.parse(savedUser))
          setToken(savedToken)
        } catch (parseError) {
          // Cache corrupted, clear aja
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_token')
          setUser(null)
          setToken(null)
        }
      } else {
        setUser(null)
        setToken(null)
      }
    }
  }, [])

  const checkSession = useCallback(async () => {
    if (checkSessionRef.current) {
      await checkSessionRef.current()
    }
  }, [])

  // Initialize dari localStorage saat pertama load - PRIORITY!
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user')
    const savedToken = localStorage.getItem('auth_token')
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
        // Kalau ada cache, langsung anggap udah login dan JANGAN ngecek API dulu
        setLoading(false)
        setInitialized(true)
        
        // Cek session di background setelah 5 detik biar ga blocking
        setTimeout(async () => {
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              setUser(data.user)
              setToken(data.session.id)
            } else if (response.status === 401) {
              // Session expired, clear cache
              localStorage.removeItem('auth_user')
              localStorage.removeItem('auth_token')
              setUser(null)
              setToken(null)
            }
          } catch (error) {
            console.error('Background session check failed:', error)
            // Biarkan aja user tetap login dari cache
          }
        }, 5000)
        
        return
      } catch (error) {
        console.error('Failed to parse saved auth data:', error)
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
      }
    }
    
    // Kalau ga ada cache, baru cek session
    const initializeAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setToken(data.session.id)
        } else {
          setUser(null)
          setToken(null)
        }
      } catch (error) {
        console.error('Initial auth check failed:', error)
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }
    
    initializeAuth()
  }, [])

  // Save to localStorage when auth state changes
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
    }
  }, [user, token])

  useEffect(() => {
    // Event listeners untuk browser navigation - DIKURANGIN DRASTIS!
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Delay 5 detik biar ga langsung ngecek
        setTimeout(checkSession, 5000)
      }
    }
    
    const handleFocus = () => {
      // Delay 5 detik biar ga langsung ngecek
      setTimeout(checkSession, 5000)
    }
    
    // Hanya tambah listener yang penting aja
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkSession])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        const data = await response.json()
        const userData = {
          username: data.user.username,
          uid: data.user.uid,
          home: data.user.home
        }
        setUser(userData)
        setToken(data.session.id)
        // localStorage will be updated by the useEffect
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      // localStorage will be cleared by the useEffect
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading, login } = useAuth()
    const [hasMounted, setHasMounted] = useState(false)
    
    useEffect(() => {
      setHasMounted(true)
    }, [])
    
    // Jangan render apa-apa sebelum mount biar ga ada hydration issues
    if (!hasMounted) {
      return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
        React.createElement('div', { className: "text-center" },
          React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" }),
          React.createElement('p', { className: "text-muted-foreground" }, "Loading...")
        )
      )
    }
    
    // Loading state - tapi lebih cepet!
    if (loading) {
      return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
        React.createElement('div', { className: "text-center" },
          React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" }),
          React.createElement('p', { className: "text-muted-foreground" }, "Checking session...")
        )
      )
    }
    
    // Kalau belum authenticated, baru show login form
    if (!isAuthenticated) {
      return React.createElement(LoginForm, { onLogin: login })
    }
    
    // Kalau udah authenticated, render component langsung
    return React.createElement(Component, props)
  }
}