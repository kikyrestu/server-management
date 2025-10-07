"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Server, 
  HardDrive, 
  Network, 
  Cpu, 
  MemoryStick, 
  Activity,
  Play,
  Pause,
  RotateCcw,
  Power,
  FileText,
  Users,
  Shield
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import LoginForm from "@/components/LoginForm"
import FileManager from "@/components/FileManager"
import SystemLogs from "@/components/SystemLogs"
import UserManagement from "@/components/UserManagement"
import Settings from "@/components/Settings"
import { AuthLayout } from "@/components/AuthLayout"
import { DashboardLayout } from "@/components/DashboardLayout"

interface ServerStatus {
  id: string
  name: string
  status: "online" | "offline" | "warning"
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  lastUpdated: string
}

interface VMStatus {
  id: string
  name: string
  status: "running" | "stopped" | "paused"
  cpu: number
  memory: number
  disk: number
  ip: string
  os: string
  uptime: string
  lastUpdated: string
}

interface StorageInfo {
  total: number
  used: number
  available: number
  percentage: number
  mountPoint: string
  filesystem: string
}

interface StorageData {
  filesystems: StorageInfo[]
  inodes: {
    total: number
    used: number
    available: number
    percentage: number
  }
  iops: {
    reads: number
    writes: number
  }
  lastUpdated: string
}

interface NetworkInterface {
  name: string
  ip: string
  netmask: string
  mac: string
  status: 'up' | 'down'
  speed: string
  rxBytes: number
  txBytes: number
  rxPackets: number
  txPackets: number
}

interface NetworkData {
  interfaces: NetworkInterface[]
  connections: Array<{
    protocol: string
    localAddress: string
    foreignAddress: string
    state: string
    pid: number
    process: string
  }>
  bandwidth: {
    download: number
    upload: number
  }
  latency: {
    average: number
    min: number
    max: number
  }
  packetLoss: number
  lastUpdated: string
}

export default function Home() {
  const { user, logout, isAuthenticated, loading, login } = useAuth()
  const [servers, setServers] = useState<ServerStatus[]>([])
  const [vms, setVMs] = useState<VMStatus[]>([])
  const [storage, setStorage] = useState<StorageData | null>(null)
  const [network, setNetwork] = useState<NetworkData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [loginError, setLoginError] = useState('')

  const fetchData = async () => {
    try {
      const [serversRes, vmsRes, storageRes, networkRes] = await Promise.all([
        fetch('/api/servers'),
        fetch('/api/vms'),
        fetch('/api/storage'),
        fetch('/api/network')
      ])

      if (serversRes.ok) {
        const serversData = await serversRes.json()
        setServers(serversData.data || [])
      }

      if (vmsRes.ok) {
        const vmsData = await vmsRes.json()
        setVMs(vmsData.data || [])
      }

      if (storageRes.ok) {
        const storageData = await storageRes.json()
        setStorage(storageData.data)
      }

      if (networkRes.ok) {
        const networkData = await networkRes.json()
        setNetwork(networkData.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleServerAction = async (serverId: string, action: string) => {
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, serverId }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to perform server action:', error)
    }
  }

  const handleVMAction = async (vmId: string, action: string) => {
    try {
      const response = await fetch('/api/vms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, vmId }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to perform VM action:', error)
    }
  }

  const handleNetworkAction = async (action: string) => {
    try {
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        // You could show a toast notification here
        alert(result.message || `${action} completed successfully`)
      } else {
        const error = await response.json()
        alert(error.error || `${action} failed`)
      }
    } catch (error) {
      console.error('Failed to perform network action:', error)
      alert(`Failed to perform ${action}: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "offline": return "bg-red-500"
      case "warning": return "bg-yellow-500"
      case "running": return "bg-green-500"
      case "stopped": return "bg-red-500"
      case "paused": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online"
      case "offline": return "Offline"
      case "warning": return "Warning"
      case "running": return "Running"
      case "stopped": return "Stopped"
      case "paused": return "Paused"
      default: return "Unknown"
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Infrastructure Management</h1>
              <p className="text-muted-foreground mt-2">
                Please login to access your server management dashboard
              </p>
            </div>
            <LoginForm onLogin={async (credentials) => {
              try {
                const result = await login(credentials)
                if (!result.success) {
                  throw new Error(result.error || 'Login failed')
                }
                setLoginError('')
              } catch (error: any) {
                setLoginError(error.message)
                throw error
              }
            }} />
            {loginError && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{loginError}</p>
              </div>
            )}
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Show dashboard with sidebar if authenticated
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {dataLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading infrastructure data...</p>
            </div>
          </div>
        ) : (
          <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{servers.length}</div>
              <p className="text-xs text-muted-foreground">
                {servers.filter(s => s.status === "online").length} online, {servers.filter(s => s.status === "warning").length} warning
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active VMs</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vms.filter(vm => vm.status === "running").length}</div>
              <p className="text-xs text-muted-foreground">
                {vms.length} total VMs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active VMs</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vms.filter(vm => vm.status === "running").length}</div>
              <p className="text-xs text-muted-foreground">
                {vms.length} total VMs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storage ? `${Math.round(storage.filesystems[0]?.percentage || 0)}%` : '78%'}
              </div>
              <Progress value={storage ? storage.filesystems[0]?.percentage || 0 : 78} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Load</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {network ? `${Math.round((network.bandwidth.download + network.bandwidth.upload) * 100) / 100} Mbps` : '45%'}
              </div>
              <Progress value={network ? Math.min(100, (network.bandwidth.download + network.bandwidth.upload) * 10) : 45} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="servers" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-8 min-w-max">
              <TabsTrigger value="servers" className="text-xs">Servers</TabsTrigger>
              <TabsTrigger value="vms" className="text-xs">VMs</TabsTrigger>
              <TabsTrigger value="storage" className="text-xs">Storage</TabsTrigger>
              <TabsTrigger value="network" className="text-xs">Network</TabsTrigger>
              <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="servers" className="space-y-4">
            <div className="grid gap-6">
              {servers.map((server, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
                        <CardTitle className="text-lg">{server.name}</CardTitle>
                        <Badge variant="outline">{getStatusText(server.status)}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleServerAction(server.id, 'restart')}>
                        <Power className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4" />
                          <span className="text-sm font-medium">CPU</span>
                        </div>
                        <Progress value={server.cpu} />
                        <p className="text-xs text-muted-foreground">{server.cpu}%</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MemoryStick className="w-4 h-4" />
                          <span className="text-sm font-medium">Memory</span>
                        </div>
                        <Progress value={server.memory} />
                        <p className="text-xs text-muted-foreground">{server.memory}%</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-4 h-4" />
                          <span className="text-sm font-medium">Disk</span>
                        </div>
                        <Progress value={server.disk} />
                        <p className="text-xs text-muted-foreground">{server.disk}%</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Network className="w-4 h-4" />
                          <span className="text-sm font-medium">Network</span>
                        </div>
                        <Progress value={server.network} />
                        <p className="text-xs text-muted-foreground">{server.network}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vms" className="space-y-4">
            <div className="grid gap-6">
              {vms.map((vm) => (
                <Card key={vm.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(vm.status)}`} />
                        <CardTitle className="text-lg">{vm.name}</CardTitle>
                        <Badge variant="outline">{getStatusText(vm.status)}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {vm.status === "running" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleVMAction(vm.id, 'pause')}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleVMAction(vm.id, 'restart')}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Restart
                            </Button>
                          </>
                        )}
                        {vm.status === "stopped" && (
                          <Button variant="outline" size="sm" onClick={() => handleVMAction(vm.id, 'start')}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                        )}
                        {vm.status === "paused" && (
                          <Button variant="outline" size="sm" onClick={() => handleVMAction(vm.id, 'resume')}>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleVMAction(vm.id, 'stop')}>
                          <Power className="w-4 h-4 mr-2" />
                          Power Off
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4" />
                          <span className="text-sm font-medium">CPU</span>
                        </div>
                        <Progress value={vm.cpu} />
                        <p className="text-xs text-muted-foreground">{vm.cpu}%</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MemoryStick className="w-4 h-4" />
                          <span className="text-sm font-medium">Memory</span>
                        </div>
                        <Progress value={vm.memory} />
                        <p className="text-xs text-muted-foreground">{vm.memory}%</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-4 h-4" />
                          <span className="text-sm font-medium">Disk</span>
                        </div>
                        <Progress value={vm.disk} />
                        <p className="text-xs text-muted-foreground">{vm.disk}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <div className="grid gap-6">
              {storage?.filesystems?.map((filesystem, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{filesystem.mountPoint}</CardTitle>
                        <CardDescription>{filesystem.filesystem}</CardDescription>
                      </div>
                      <Badge variant={filesystem.percentage > 90 ? "destructive" : filesystem.percentage > 70 ? "default" : "secondary"}>
                        {filesystem.percentage > 90 ? "Critical" : filesystem.percentage > 70 ? "Warning" : "Normal"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Usage</span>
                          <span className="text-sm text-muted-foreground">{filesystem.percentage}%</span>
                        </div>
                        <Progress value={filesystem.percentage} />
                        <p className="text-xs text-muted-foreground">
                          {filesystem.used.toFixed(1)} GB of {filesystem.total.toFixed(1)} GB used
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Available</span>
                          <span className="text-sm text-muted-foreground">{filesystem.available.toFixed(1)} GB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${((filesystem.available / filesystem.total) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">I/O Stats</span>
                          <span className="text-sm text-muted-foreground">
                            R: {storage.iops.reads}/s W: {storage.iops.writes}/s
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Inodes: {storage.inodes.percentage}% used
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No storage data available</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Storage Actions</CardTitle>
                  <CardDescription>Perform maintenance and analysis tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleStorageAction('cleanup')}
                    >
                      <HardDrive className="w-4 h-4 mr-2" />
                      Disk Cleanup
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleStorageAction('analyze')}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Analyze Usage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid gap-6">
              {network?.interfaces?.map((interface_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{interface_.name}</CardTitle>
                        <CardDescription>{interface_.mac}</CardDescription>
                      </div>
                      <Badge variant={interface_.status === 'up' ? "default" : "secondary"}>
                        {interface_.status === 'up' ? 'Up' : 'Down'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">IP Address</span>
                          <span className="text-sm text-muted-foreground">{interface_.ip}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Netmask: {interface_.netmask}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Speed</span>
                          <span className="text-sm text-muted-foreground">{interface_.speed}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Status: {interface_.status}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Traffic</span>
                          <span className="text-sm text-muted-foreground">
                            ↓{formatBytes(interface_.rxBytes)} ↑{formatBytes(interface_.txBytes)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          RX: {interface_.rxPackets} TX: {interface_.txPackets} packets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No network data available</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Network Statistics</CardTitle>
                  <CardDescription>Overall network performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Download</span>
                        <span className="text-sm text-muted-foreground">
                          {network ? `${Math.round(network.bandwidth.download * 100) / 100} Mbps` : '0 Mbps'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Upload</span>
                        <span className="text-sm text-muted-foreground">
                          {network ? `${Math.round(network.bandwidth.upload * 100) / 100} Mbps` : '0 Mbps'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Latency</span>
                        <span className="text-sm text-muted-foreground">
                          {network ? `${Math.round(network.latency.average)} ms` : '0 ms'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Packet Loss</span>
                        <span className="text-sm text-muted-foreground">
                          {network ? `${Math.round(network.packetLoss)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Actions</CardTitle>
                  <CardDescription>Perform network diagnostics and tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleNetworkAction('ping')}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Ping Test
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleNetworkAction('traceroute')}
                    >
                      <Network className="w-4 h-4 mr-2" />
                      Traceroute
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleNetworkAction('speedtest')}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Speed Test
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {network?.connections && network.connections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Connections</CardTitle>
                    <CardDescription>Current network connections and processes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {network.connections.slice(0, 10).map((conn, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{conn.protocol} {conn.localAddress} → {conn.foreignAddress}</span>
                          <span className="text-muted-foreground">{conn.process} ({conn.pid})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <FileManager />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <SystemLogs />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Settings />
          </TabsContent>
        </Tabs>
      </>
    )}
      </div>
    </DashboardLayout>
  )
}

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}