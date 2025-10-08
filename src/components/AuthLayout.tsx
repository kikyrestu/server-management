"use client"

import { useAuth } from "@/hooks/useAuth"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show children (login page) without sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  // If authenticated, show main layout with sidebar
  return (
    <div className="flex h-screen w-full">
      <div className="hidden md:block">
        {/* Placeholder for sidebar - will be rendered by DashboardLayout */}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}