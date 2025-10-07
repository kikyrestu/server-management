"use client"

import { useAuth } from "@/hooks/useAuth"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Shield, Activity, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth()

  // If not authenticated, this shouldn't render, but just in case
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Infrastructure Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Monitor and manage your servers, VMs, storage, and network infrastructure
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Activity className="w-3 h-3 mr-1" />
                System Online
              </Badge>
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                {user?.username || 'Admin'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={logout}>
                <Shield className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}