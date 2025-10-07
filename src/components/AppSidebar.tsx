"use client"

import Link from "next/link"
import { 
  Home, 
  Server, 
  Cpu, 
  HardDrive, 
  Network, 
  FileText, 
  FolderOpen, 
  Settings, 
  Users, 
  Activity,
  Shield,
  Database,
  Terminal
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Servers",
    url: "/servers",
    icon: Server,
  },
  {
    title: "Virtual Machines", 
    url: "/vms",
    icon: Cpu,
  },
  {
    title: "Storage",
    url: "/storage", 
    icon: HardDrive,
  },
  {
    title: "Network",
    url: "/network",
    icon: Network,
  },
  {
    title: "File Manager",
    url: "/files",
    icon: FolderOpen,
  },
  {
    title: "System Logs",
    url: "/logs",
    icon: FileText,
  },
  {
    title: "Database",
    url: "/database",
    icon: Database,
  },
  {
    title: "Terminal",
    url: "/terminal",
    icon: Terminal,
  },
]

const adminItems = [
  {
    title: "User Management",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Shield className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-semibold">InfraManager</h1>
            <p className="text-xs text-muted-foreground">Server Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">{user?.username || 'Admin'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-2 h-auto"
                onClick={logout}
              >
                <Shield className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}