"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Activity,
  Power,
  RotateCcw,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter
} from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { withAuth } from "@/hooks/useAuth"

interface ServerStatus {
  id: string
  name: string
  host: string
  status: "online" | "offline" | "warning" | "maintenance"
  cpu: {
    usage: number
    cores: number
    frequency: string
    temperature: number
  }
  memory: {
    usage: number
    total: number
    available: number
    used: number
  }
  disk: {
    usage: number
    total: number
    used: number
    available: number
    readSpeed: number
    writeSpeed: number
  }
  network: {
    usage: number
    download: number
    upload: number
    packetsIn: number
    packetsOut: number
  }
  uptime: string
  lastUpdated: string
  loadAverage: [number, number, number]
  processes: number
  connections: number
}

interface ServerDetail {
  id: string
  name: string
  host: string
  os: string
  kernel: string
  architecture: string
  status: "online" | "offline" | "warning" | "maintenance"
  cpu: {
    model: string
    cores: number
    threads: number
    usage: number
    frequency: string
    temperature: number
    loadAverage: [number, number, number]
  }
  memory: {
    total: number
    used: number
    available: number
    usage: number
    swap: {
      total: number
      used: number
      usage: number
    }
  }
  disks: Array<{
    device: string
    mount: string
    type: string
    total: number
    used: number
    available: number
    usage: number
    readSpeed: number
    writeSpeed: number
  }>
  network: Array<{
    interface: string
    ip: string
    speed: string
    status: 'up' | 'down'
    download: number
    upload: number
    packetsIn: number
    packetsOut: number
  }>
  processes: {
    total: number
    running: number
    sleeping: number
    stopped: number
    zombie: number
  }
  connections: number
  uptime: string
  lastBoot: string
  lastUpdated: string
}

function ServersPage() {
  const [servers, setServers] = useState<ServerStatus[]>([])
  const [selectedServer, setSelectedServer] = useState<ServerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServerDetail = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedServer(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch server detail:', error)
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
        fetchServers()
        if (selectedServer && selectedServer.id === serverId) {
          fetchServerDetail(serverId)
        }
      }
    } catch (error) {
      console.error('Failed to perform server action:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "offline": return "bg-red-500"
      case "warning": return "bg-yellow-500"
      case "maintenance": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online"
      case "offline": return "Offline"
      case "warning": return "Warning"
      case "maintenance": return "Maintenance"
      default: return "Unknown"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "offline": return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "maintenance": return <Clock className="w-4 h-4 text-blue-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.host.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || server.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    fetchServers()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchServers, 5000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (uptime: string): string => {
    const seconds = parseInt(uptime)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Server Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your physical servers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Auto Refresh {autoRefresh ? "ON" : "OFF"}
            </Button>
            <Button onClick={fetchServers} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers by name or host..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Server Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading server data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredServers.map((server) => (
              <Card 
                key={server.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedServer?.id === server.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => fetchServerDetail(server.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(server.status)}
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {getStatusText(server.status)}
                    </Badge>
                  </div>
                  <CardDescription>{server.host}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resource Usage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">CPU</span>
                        <span className="text-xs text-muted-foreground">{server.cpu.usage}%</span>
                      </div>
                      <Progress value={server.cpu.usage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Memory</span>
                        <span className="text-xs text-muted-foreground">{server.memory.usage}%</span>
                      </div>
                      <Progress value={server.memory.usage} className="h-2" />
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{server.disk.usage}%</div>
                      <div className="text-muted-foreground">Disk</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{server.network.usage}%</div>
                      <div className="text-muted-foreground">Network</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{server.processes}</div>
                      <div className="text-muted-foreground">Processes</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleServerAction(server.id, 'restart')
                      }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleServerAction(server.id, 'shutdown')
                      }}
                    >
                      <Power className="w-3 h-3 mr-1" />
                      Shutdown
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Server Details */}
        {selectedServer && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedServer.name}</CardTitle>
                  <CardDescription>{selectedServer.host}</CardDescription>
                </div>
                <Badge variant="outline" className="capitalize">
                  {getStatusText(selectedServer.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="network">Network</TabsTrigger>
                  <TabsTrigger value="processes">Processes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">System Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">OS</div>
                          <div className="text-muted-foreground">{selectedServer.os}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Kernel</div>
                          <div className="text-muted-foreground">{selectedServer.kernel}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Architecture</div>
                          <div className="text-muted-foreground">{selectedServer.architecture}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">Current Uptime</div>
                          <div className="text-muted-foreground">{formatUptime(selectedServer.uptime)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Last Boot</div>
                          <div className="text-muted-foreground">{new Date(selectedServer.lastBoot).toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Load Average</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">1 min</div>
                          <div className="text-muted-foreground">{selectedServer.cpu.loadAverage[0].toFixed(2)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">5 min</div>
                          <div className="text-muted-foreground">{selectedServer.cpu.loadAverage[1].toFixed(2)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">15 min</div>
                          <div className="text-muted-foreground">{selectedServer.cpu.loadAverage[2].toFixed(2)}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Connections</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">Active Connections</div>
                          <div className="text-muted-foreground">{selectedServer.connections}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Total Processes</div>
                          <div className="text-muted-foreground">{selectedServer.processes.total}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CPU */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="w-5 h-5" />
                          CPU Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Model</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.cpu.model}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Cores</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.cpu.cores}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Threads</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.cpu.threads}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Frequency</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.cpu.frequency}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Temperature</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.cpu.temperature}°C</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Usage</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.cpu.usage}%</span>
                          </div>
                          <Progress value={selectedServer.cpu.usage} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Memory */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MemoryStick className="w-5 h-5" />
                          Memory Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total</span>
                            <span className="text-sm text-muted-foreground">{formatBytes(selectedServer.memory.total)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Used</span>
                            <span className="text-sm text-muted-foreground">{formatBytes(selectedServer.memory.used)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Available</span>
                            <span className="text-sm text-muted-foreground">{formatBytes(selectedServer.memory.available)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Usage</span>
                            <span className="text-sm text-muted-foreground">{selectedServer.memory.usage}%</span>
                          </div>
                          <Progress value={selectedServer.memory.usage} />
                        </div>
                        <div className="pt-4 border-t">
                          <div className="text-sm font-medium mb-2">Swap Memory</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Total</span>
                              <span className="text-xs text-muted-foreground">{formatBytes(selectedServer.memory.swap.total)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Used</span>
                              <span className="text-xs text-muted-foreground">{formatBytes(selectedServer.memory.swap.used)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs">Usage</span>
                              <span className="text-xs text-muted-foreground">{selectedServer.memory.swap.usage}%</span>
                            </div>
                            <Progress value={selectedServer.memory.swap.usage} className="h-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Disks */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <HardDrive className="w-5 h-5" />
                          Disk Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedServer.disks.map((disk, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                              <div className="space-y-2">
                                <div className="font-medium">{disk.device}</div>
                                <div className="text-sm text-muted-foreground">{disk.mount}</div>
                                <div className="text-xs text-muted-foreground">{disk.type}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <div className="font-medium">Size</div>
                                  <div className="text-muted-foreground">{formatBytes(disk.total)}</div>
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium">Used</div>
                                  <div className="text-muted-foreground">{formatBytes(disk.used)}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Usage</span>
                                  <span className="text-sm text-muted-foreground">{disk.usage}%</span>
                                </div>
                                <Progress value={disk.usage} />
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <div className="font-medium">Read</div>
                                  <div className="text-muted-foreground">{disk.readSpeed} MB/s</div>
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium">Write</div>
                                  <div className="text-muted-foreground">{disk.writeSpeed} MB/s</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="network" className="space-y-4">
                  <div className="grid gap-4">
                    {selectedServer.network.map((iface, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Network className="w-5 h-5" />
                            {iface.interface}
                            <Badge variant={iface.status === 'up' ? 'default' : 'destructive'}>
                              {iface.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">IP Address</div>
                                <div className="text-muted-foreground">{iface.ip}</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Speed</div>
                                <div className="text-muted-foreground">{iface.speed}</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">Download</div>
                                <div className="text-muted-foreground">{iface.download} Mbps</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Upload</div>
                                <div className="text-muted-foreground">{iface.upload} Mbps</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">Packets In</div>
                                <div className="text-muted-foreground">{iface.packetsIn}</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Packets Out</div>
                                <div className="text-muted-foreground">{iface.packetsOut}</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="processes" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Process Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total</span>
                          <span className="text-sm font-medium">{selectedServer.processes.total}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Running</span>
                          <span className="text-sm font-medium text-green-600">{selectedServer.processes.running}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sleeping</span>
                          <span className="text-sm font-medium text-blue-600">{selectedServer.processes.sleeping}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Stopped</span>
                          <span className="text-sm font-medium text-red-600">{selectedServer.processes.stopped}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Zombie</span>
                          <span className="text-sm font-medium text-yellow-600">{selectedServer.processes.zombie}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">System Connections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold">{selectedServer.connections}</div>
                          <div className="text-sm text-muted-foreground">Active Connections</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(ServersPage)