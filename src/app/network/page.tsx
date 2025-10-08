"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Network, 
  Activity, 
  Wifi, 
  Router, 
  Server,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Square,
  Search,
  Filter,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { withAuth } from "@/hooks/useAuth"

interface NetworkInterface {
  name: string
  type: 'ethernet' | 'wifi' | 'bridge' | 'bond' | 'vlan'
  status: 'up' | 'down' | 'disconnected'
  mac: string
  ip: string
  netmask: string
  gateway: string
  dns: string[]
  speed: string
  duplex: string
  mtu: number
  rxBytes: number
  txBytes: number
  rxPackets: number
  txPackets: number
  rxErrors: number
  txErrors: number
  rxDropped: number
  txDropped: number
  rxSpeed: number
  txSpeed: number
  lastUpdated: string
}

interface NetworkConnection {
  id: string
  protocol: 'tcp' | 'udp' | 'icmp'
  localAddress: string
  localPort: number
  foreignAddress: string
  foreignPort: number
  state: 'established' | 'listen' | 'time_wait' | 'close_wait' | 'syn_sent' | 'syn_recv'
  process: string
  pid: number
  user: string
  rxBytes: number
  txBytes: number
  duration: string
}

interface NetworkBandwidth {
  timestamp: string
  download: number
  upload: number
  totalDownload: number
  totalUpload: number
}

interface NetworkLatency {
  target: string
  latency: number
  jitter: number
  packetLoss: number
  lastUpdated: string
}

interface FirewallRule {
  id: string
  chain: 'input' | 'output' | 'forward'
  action: 'accept' | 'drop' | 'reject'
  protocol: 'tcp' | 'udp' | 'icmp' | 'any'
  source: string
  destination: string
  sourcePort: string
  destinationPort: string
  enabled: boolean
  description: string
  hits: number
  lastHit: string
}

interface NetworkAlert {
  id: string
  type: 'connectivity' | 'performance' | 'security' | 'configuration'
  severity: 'info' | 'warning' | 'critical'
  message: string
  interface: string
  timestamp: string
  resolved: boolean
}

interface PortInfo {
  port: number
  protocol: 'tcp' | 'udp'
  state: 'open' | 'closed' | 'filtered' | 'listening'
  service: string
  process?: string
  pid?: number
  localAddress: string
}

function NetworkPage() {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [connections, setConnections] = useState<NetworkConnection[]>([])
  const [bandwidth, setBandwidth] = useState<NetworkBandwidth[]>([])
  const [latency, setLatency] = useState<NetworkLatency[]>([])
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([])
  const [alerts, setAlerts] = useState<NetworkAlert[]>([])
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterface | null>(null)
  const [portSearchTerm, setPortSearchTerm] = useState("")
  const [protocolFilter, setProtocolFilter] = useState<string>("all")
  const [portStateFilter, setPortStateFilter] = useState<string>("all")
  const [showAddPortDialog, setShowAddPortDialog] = useState(false)
  const [showScanPortDialog, setShowScanPortDialog] = useState(false)
  const [showPortForwardDialog, setShowPortForwardDialog] = useState(false)
  const [newPort, setNewPort] = useState({ port: '', protocol: 'tcp', action: 'open' })
  const [scanPort, setScanPort] = useState({ port: '', protocol: 'tcp', target: 'localhost' })
  const [portForward, setPortForward] = useState({ sourcePort: '', target: '', targetPort: '', protocol: 'tcp' })

  const fetchNetwork = async () => {
    try {
      const response = await fetch('/api/network')
      if (response.ok) {
        const data = await response.json()
        setInterfaces(data.data?.interfaces || [])
        setConnections(data.data?.connections || [])
        setBandwidth(data.data?.bandwidth || [])
        setLatency(data.data?.latency || [])
        setFirewallRules(data.data?.firewall || [])
        setAlerts(data.data?.alerts || [])
        setPorts(data.data?.ports || [])
      }
    } catch (error) {
      console.error('Failed to fetch network data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInterfaceAction = async (interfaceName: string, action: string) => {
    try {
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, interface: interfaceName }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchNetwork()
      }
    } catch (error) {
      console.error('Failed to perform interface action:', error)
    }
  }

  const handlePortAction = async (action: string, portData: any) => {
    try {
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...portData }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchNetwork()
        return result
      }
    } catch (error) {
      console.error('Failed to perform port action:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up": return "bg-green-500"
      case "down": return "bg-red-500"
      case "disconnected": return "bg-yellow-500"
      case "established": return "bg-green-500"
      case "listen": return "bg-blue-500"
      case "time_wait": return "bg-yellow-500"
      case "close_wait": return "bg-orange-500"
      case "syn_sent": return "bg-purple-500"
      case "syn_recv": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "up": return "Up"
      case "down": return "Down"
      case "disconnected": return "Disconnected"
      case "established": return "Established"
      case "listen": return "Listening"
      case "time_wait": return "Time Wait"
      case "close_wait": return "Close Wait"
      case "syn_sent": return "SYN Sent"
      case "syn_recv": return "SYN Received"
      default: return "Unknown"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info": return "bg-blue-500"
      case "warning": return "bg-yellow-500"
      case "critical": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getPortStateColor = (state: string) => {
    switch (state) {
      case "open": return "bg-green-500"
      case "closed": return "bg-red-500"
      case "filtered": return "bg-yellow-500"
      case "listening": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getPortStateText = (state: string) => {
    switch (state) {
      case "open": return "Open"
      case "closed": return "Closed"
      case "filtered": return "Filtered"
      case "listening": return "Listening"
      default: return "Unknown"
    }
  }

  const filteredInterfaces = interfaces.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.mac.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredPorts = ports.filter(item => {
    const matchesSearch = item.port.toString().includes(portSearchTerm) ||
                         item.service.toLowerCase().includes(portSearchTerm.toLowerCase()) ||
                         (item.process && item.process.toLowerCase().includes(portSearchTerm.toLowerCase()))
    const matchesProtocol = protocolFilter === "all" || item.protocol === protocolFilter
    const matchesState = portStateFilter === "all" || item.state === portStateFilter
    return matchesSearch && matchesProtocol && matchesState
  })

  useEffect(() => {
    fetchNetwork()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchNetwork, 5000) // Refresh every 5 seconds
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatBytes = (bytes: number): string => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytes: number): string => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B/s'
    return formatBytes(bytes) + '/s'
  }

  const getSafeValue = (value: any, defaultValue: any = 0) => {
    return value === undefined || value === null || isNaN(value) ? defaultValue : value
  }

  const getSafeString = (value: any, defaultValue: string = 'N/A') => {
    return value === undefined || value === null || value === '' ? defaultValue : value
  }

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'wifi': return <Wifi className="w-4 h-4" />
      case 'bridge': return <Router className="w-4 h-4" />
      case 'bond': return <Network className="w-4 h-4" />
      case 'vlan': return <Network className="w-4 h-4" />
      default: return <Network className="w-4 h-4" />
    }
  }

  const totalDownload = bandwidth.length > 0 ? bandwidth[bandwidth.length - 1]?.totalDownload || 0 : 0
  const totalUpload = bandwidth.length > 0 ? bandwidth[bandwidth.length - 1]?.totalUpload || 0 : 0
  const currentDownload = bandwidth.length > 0 ? bandwidth[bandwidth.length - 1]?.download || 0 : 0
  const currentUpload = bandwidth.length > 0 ? bandwidth[bandwidth.length - 1]?.upload || 0 : 0

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved)
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning' && !alert.resolved)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Network Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your network infrastructure
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
            <Button onClick={fetchNetwork} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Interface
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
          <div className="grid gap-4">
            {criticalAlerts.map((alert) => (
              <Alert key={alert.id} className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Critical:</strong> {alert.message} ({alert.interface})
                </AlertDescription>
              </Alert>
            ))}
            {warningAlerts.map((alert) => (
              <Alert key={alert.id} className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warning:</strong> {alert.message} ({alert.interface})
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Interfaces</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interfaces.filter(i => i.status === 'up').length}</div>
              <p className="text-xs text-muted-foreground">
                {interfaces.length} total interfaces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Download Speed</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSpeed(currentDownload)}</div>
              <p className="text-xs text-muted-foreground">
                Total: {formatBytes(totalDownload)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upload Speed</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSpeed(currentUpload)}</div>
              <p className="text-xs text-muted-foreground">
                Total: {formatBytes(totalUpload)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connections.filter(c => c.state === 'established').length}</div>
              <p className="text-xs text-muted-foreground">
                {connections.length} total connections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="interfaces" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="ports">Ports</TabsTrigger>
            <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
            <TabsTrigger value="firewall">Firewall</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="interfaces" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, IP, or MAC..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ethernet">Ethernet</SelectItem>
                      <SelectItem value="wifi">WiFi</SelectItem>
                      <SelectItem value="bridge">Bridge</SelectItem>
                      <SelectItem value="bond">Bond</SelectItem>
                      <SelectItem value="vlan">VLAN</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="up">Up</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="disconnected">Disconnected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Interface Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading network data...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredInterfaces.map((item, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInterface?.name === item.name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedInterface(item)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getInterfaceIcon(item.type)}
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              item.status === 'up' ? 'border-green-600 text-green-600' :
                              item.status === 'down' ? 'border-red-600 text-red-600' :
                              'border-yellow-600 text-yellow-600'
                            }
                          >
                            {getStatusText(item.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getSafeString(item.speed, 'Unknown')}</Badge>
                          <Badge variant="outline">{getSafeString(item.mtu, 'N/A')} MTU</Badge>
                        </div>
                      </div>
                      <CardDescription>
                        {getSafeString(item.ip)} / {getSafeString(item.netmask)} • Gateway: {getSafeString(item.gateway)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Traffic */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Traffic</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Download</div>
                              <div className="font-medium">{formatBytes(getSafeValue(item.rxBytes))}</div>
                              <div className="text-green-600">{formatSpeed(getSafeValue(item.rxSpeed))}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Upload</div>
                              <div className="font-medium">{formatBytes(getSafeValue(item.txBytes))}</div>
                              <div className="text-blue-600">{formatSpeed(getSafeValue(item.txSpeed))}</div>
                            </div>
                          </div>
                        </div>

                        {/* Packets */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Packets</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">RX</div>
                              <div className="font-medium">{getSafeValue(item.rxPackets).toLocaleString()}</div>
                              <div className="text-red-600">{getSafeValue(item.rxErrors)} errors</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">TX</div>
                              <div className="font-medium">{getSafeValue(item.txPackets).toLocaleString()}</div>
                              <div className="text-red-600">{getSafeValue(item.txErrors)} errors</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Actions</div>
                          <div className="flex flex-wrap gap-2">
                            {item.status === 'up' ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleInterfaceAction(item.name, 'down')
                                }}
                              >
                                <Pause className="w-3 h-3 mr-1" />
                                Down
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleInterfaceAction(item.name, 'up')
                                }}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Up
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInterfaceAction(item.name, 'restart')
                              }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Restart
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInterfaceAction(item.name, 'configure')
                              }}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <div className="grid gap-4">
              {connections.map((conn, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(conn.state)}`} />
                          <span className="text-sm font-medium">{conn.protocol.toUpperCase()}</span>
                          <Badge variant="outline" className="capitalize">
                            {conn.state.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Process: {conn.process} (PID: {conn.pid})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          User: {conn.user}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Local</div>
                        <div className="text-xs text-muted-foreground">
                          {conn.localAddress}:{conn.localPort}
                        </div>
                        <div className="text-xs">
                          RX: {formatBytes(conn.rxBytes)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Remote</div>
                        <div className="text-xs text-muted-foreground">
                          {conn.foreignAddress}:{conn.foreignPort}
                        </div>
                        <div className="text-xs">
                          TX: {formatBytes(conn.txBytes)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Duration</div>
                        <div className="text-xs text-muted-foreground">
                          {conn.duration}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Square className="w-3 h-3 mr-1" />
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {connections.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No active connections</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ports" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Port Management</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor and manage open ports and services
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={showScanPortDialog} onOpenChange={setShowScanPortDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Scan Port
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Scan Port</DialogTitle>
                      <DialogDescription>
                        Check if a specific port is open or closed
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="scan-port">Port Number</Label>
                        <Input
                          id="scan-port"
                          type="number"
                          placeholder="80"
                          value={scanPort.port}
                          onChange={(e) => setScanPort({ ...scanPort, port: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scan-protocol">Protocol</Label>
                        <Select value={scanPort.protocol} onValueChange={(value) => setScanPort({ ...scanPort, protocol: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="scan-target">Target Host</Label>
                        <Input
                          id="scan-target"
                          placeholder="localhost"
                          value={scanPort.target}
                          onChange={(e) => setScanPort({ ...scanPort, target: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            handlePortAction('scanPort', { 
                              port: parseInt(scanPort.port), 
                              protocol: scanPort.protocol, 
                              target: scanPort.target 
                            })
                            setShowScanPortDialog(false)
                          }}
                          disabled={!scanPort.port}
                        >
                          Scan Port
                        </Button>
                        <Button variant="outline" onClick={() => setShowScanPortDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showAddPortDialog} onOpenChange={setShowAddPortDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Port Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Port Rule</DialogTitle>
                      <DialogDescription>
                        Open or close a specific port through firewall
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-port">Port Number</Label>
                        <Input
                          id="new-port"
                          type="number"
                          placeholder="8080"
                          value={newPort.port}
                          onChange={(e) => setNewPort({ ...newPort, port: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-protocol">Protocol</Label>
                        <Select value={newPort.protocol} onValueChange={(value) => setNewPort({ ...newPort, protocol: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="new-action">Action</Label>
                        <Select value={newPort.action} onValueChange={(value) => setNewPort({ ...newPort, action: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open Port</SelectItem>
                            <SelectItem value="close">Close Port</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            const action = newPort.action === 'open' ? 'openPort' : 'closePort'
                            handlePortAction(action, { 
                              port: parseInt(newPort.port), 
                              protocol: newPort.protocol 
                            })
                            setShowAddPortDialog(false)
                            setNewPort({ port: '', protocol: 'tcp', action: 'open' })
                          }}
                          disabled={!newPort.port}
                        >
                          {newPort.action === 'open' ? 'Open Port' : 'Close Port'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddPortDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showPortForwardDialog} onOpenChange={setShowPortForwardDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Router className="w-4 h-4 mr-2" />
                      Port Forward
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Port Forwarding</DialogTitle>
                      <DialogDescription>
                        Set up port forwarding to redirect traffic to another host
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="source-port">Source Port</Label>
                        <Input
                          id="source-port"
                          type="number"
                          placeholder="8080"
                          value={portForward.sourcePort}
                          onChange={(e) => setPortForward({ ...portForward, sourcePort: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="target-host">Target Host</Label>
                        <Input
                          id="target-host"
                          placeholder="192.168.1.100"
                          value={portForward.target}
                          onChange={(e) => setPortForward({ ...portForward, target: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="target-port">Target Port</Label>
                        <Input
                          id="target-port"
                          type="number"
                          placeholder="80"
                          value={portForward.targetPort}
                          onChange={(e) => setPortForward({ ...portForward, targetPort: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="forward-protocol">Protocol</Label>
                        <Select value={portForward.protocol} onValueChange={(value) => setPortForward({ ...portForward, protocol: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            handlePortAction('portForward', { 
                              port: parseInt(portForward.sourcePort), 
                              target: portForward.target,
                              targetPort: parseInt(portForward.targetPort) || parseInt(portForward.sourcePort),
                              protocol: portForward.protocol
                            })
                            setShowPortForwardDialog(false)
                            setPortForward({ sourcePort: '', target: '', targetPort: '', protocol: 'tcp' })
                          }}
                          disabled={!portForward.sourcePort || !portForward.target}
                        >
                          Set Up Forwarding
                        </Button>
                        <Button variant="outline" onClick={() => setShowPortForwardDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Port Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by port, service, or process..."
                      value={portSearchTerm}
                      onChange={(e) => setPortSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Protocols</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={portStateFilter} onValueChange={setPortStateFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="listening">Listening</SelectItem>
                      <SelectItem value="filtered">Filtered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ports List */}
            <div className="grid gap-4">
              {filteredPorts.map((port, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getPortStateColor(port.state)}`} />
                          <span className="text-sm font-medium">{port.protocol.toUpperCase()}</span>
                          <Badge variant="outline" className="capitalize">
                            {getPortStateText(port.state)}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold">{port.port}</div>
                        <div className="text-sm text-muted-foreground">
                          Service: {port.service}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {port.localAddress}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Process</div>
                        <div className="text-xs text-muted-foreground">
                          {port.process || 'N/A'}
                        </div>
                        {port.pid && (
                          <div className="text-xs text-muted-foreground">
                            PID: {port.pid}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Status</div>
                        <div className="text-xs">
                          {port.state === 'listening' && (
                            <span className="text-green-600">● Listening for connections</span>
                          )}
                          {port.state === 'open' && (
                            <span className="text-blue-600">● Open and active</span>
                          )}
                          {port.state === 'closed' && (
                            <span className="text-red-600">● Closed</span>
                          )}
                          {port.state === 'filtered' && (
                            <span className="text-yellow-600">● Filtered by firewall</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Actions</div>
                        <div className="flex flex-wrap gap-2">
                          {port.state === 'closed' || port.state === 'filtered' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePortAction('openPort', { port: port.port, protocol: port.protocol })}
                            >
                              <Unlock className="w-3 h-3 mr-1" />
                              Open
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePortAction('closePort', { port: port.port, protocol: port.protocol })}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Close
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredPorts.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No ports found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bandwidth" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Bandwidth Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatSpeed(currentDownload)}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Download</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatSpeed(currentUpload)}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Upload</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatBytes(totalDownload)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Download</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatBytes(totalUpload)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Upload</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bandwidth History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Bandwidth chart would be displayed here</p>
                      <p className="text-sm text-muted-foreground">Showing download/upload speeds over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Latency */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Array.isArray(latency) && latency.length > 0 ? (
                      latency.map((lat, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{lat.target}</div>
                            <div className="text-sm text-muted-foreground">Target</div>
                          </div>
                          <div>
                            <div className="font-medium">{lat.latency} ms</div>
                            <div className="text-sm text-muted-foreground">Latency</div>
                          </div>
                          <div>
                            <div className="font-medium">{lat.jitter} ms</div>
                            <div className="text-sm text-muted-foreground">Jitter</div>
                          </div>
                          <div>
                            <div className="font-medium">{lat.packetLoss}%</div>
                            <div className="text-sm text-muted-foreground">Packet Loss</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No latency data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="firewall" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Firewall Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your firewall configuration
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
            
            <div className="grid gap-4">
              {firewallRules.map((rule, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="uppercase">
                            {rule.chain}
                          </Badge>
                          <Badge 
                            variant={rule.enabled ? "default" : "secondary"}
                            className={
                              rule.action === 'accept' ? 'bg-green-100 text-green-800' :
                              rule.action === 'drop' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {rule.action}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{rule.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Protocol: {rule.protocol.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Source</div>
                        <div className="text-xs text-muted-foreground">
                          {rule.source}
                        </div>
                        {rule.sourcePort && (
                          <div className="text-xs text-muted-foreground">
                            Port: {rule.sourcePort}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Destination</div>
                        <div className="text-xs text-muted-foreground">
                          {rule.destination}
                        </div>
                        {rule.destinationPort && (
                          <div className="text-xs text-muted-foreground">
                            Port: {rule.destinationPort}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Statistics</div>
                        <div className="text-xs text-muted-foreground">
                          Hits: {rule.hits}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last hit: {rule.lastHit}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Toggle rule enabled state
                            }}
                          >
                            {rule.enabled ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {firewallRules.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No firewall rules configured</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                        <CardTitle className="text-lg capitalize">{alert.type}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={
                            alert.severity === 'critical' ? 'border-red-600 text-red-600' :
                            alert.severity === 'warning' ? 'border-yellow-600 text-yellow-600' :
                            'border-blue-600 text-blue-600'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">{alert.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Interface: {alert.interface}</span>
                        {!alert.resolved && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolve
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {alerts.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-muted-foreground">No network alerts</p>
                      <p className="text-sm text-muted-foreground">All systems operating normally</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(NetworkPage)