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
  HardDrive, 
  Database, 
  Server, 
  Activity,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Settings,
  HardDrive as StorageIcon,
  Settings as ConfigIcon,
  Trash2 as DeleteIcon,
  Plus as AddIcon
} from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { withAuth } from "@/hooks/useAuth"

interface StorageInfo {
  device: string
  mountPoint: string
  filesystem: string
  total: number
  used: number
  available: number
  percentage: number
  type: 'local' | 'network' | 'external'
  status: 'mounted' | 'unmounted' | 'error'
  iops: {
    reads: number
    writes: number
  }
  throughput: {
    read: number
    write: number
  }
  temperature?: number
  smartStatus?: 'healthy' | 'warning' | 'critical'
  lastUpdated: string
}

interface StoragePool {
  id: string
  name: string
  type: 'zfs' | 'lvm' | 'btrfs' | 'raid'
  status: 'online' | 'degraded' | 'offline'
  total: number
  used: number
  available: number
  devices: string[]
  compression: boolean
  encryption: boolean
  redundancy: string
  lastUpdated: string
}

interface StoragePerformance {
  timestamp: string
  readSpeed: number
  writeSpeed: number
  iopsRead: number
  iopsWrite: number
  latency: number
  queueDepth: number
}

interface StorageAlert {
  id: string
  type: 'capacity' | 'performance' | 'health' | 'smart'
  severity: 'info' | 'warning' | 'critical'
  message: string
  device: string
  timestamp: string
  resolved: boolean
}

function StoragePage() {
  const [storage, setStorage] = useState<StorageInfo[]>([])
  const [pools, setPools] = useState<StoragePool[]>([])
  const [performance, setPerformance] = useState<StoragePerformance[]>([])
  const [alerts, setAlerts] = useState<StorageAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedStorage, setSelectedStorage] = useState<StorageInfo | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchStorage = async () => {
    try {
      const response = await fetch('/api/storage')
      if (response.ok) {
        const data = await response.json()
        setStorage(data.data?.filesystems || [])
        setPools(data.data?.pools || [])
        setPerformance(data.data?.performance || [])
        setAlerts(data.data?.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch storage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStorageAction = async (device: string, action: string) => {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, device }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchStorage()
      }
    } catch (error) {
      console.error('Failed to perform storage action:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mounted": return "bg-green-500"
      case "unmounted": return "bg-yellow-500"
      case "error": return "bg-red-500"
      case "online": return "bg-green-500"
      case "degraded": return "bg-yellow-500"
      case "offline": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "mounted": return "Mounted"
      case "unmounted": return "Unmounted"
      case "error": return "Error"
      case "online": return "Online"
      case "degraded": return "Degraded"
      case "offline": return "Offline"
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

  const filteredStorage = storage.filter(item => {
    const matchesSearch = (item.device?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (item.mountPoint?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (item.filesystem?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  useEffect(() => {
    fetchStorage()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchStorage, 10000) // Refresh every 10 seconds
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytes: number): string => {
    return formatBytes(bytes) + '/s'
  }

  const getStorageTypeIcon = (type: string) => {
    switch (type) {
      case 'network': return <Server className="w-4 h-4" />
      case 'external': return <HardDrive className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const getSmartStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const totalStorage = storage.reduce((sum, item) => sum + item.total, 0)
  const usedStorage = storage.reduce((sum, item) => sum + item.used, 0)
  const totalUsage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved)
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning' && !alert.resolved)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your storage infrastructure
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
            <Button onClick={fetchStorage} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Storage
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
                  <strong>Critical:</strong> {alert.message} ({alert.device})
                </AlertDescription>
              </Alert>
            ))}
            {warningAlerts.map((alert) => (
              <Alert key={alert.id} className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warning:</strong> {alert.message} ({alert.device})
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(totalStorage)}</div>
              <p className="text-xs text-muted-foreground">
                {storage.length} filesystems
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Storage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(usedStorage)}</div>
              <Progress value={totalUsage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(totalUsage)}% used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Pools</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pools.length}</div>
              <p className="text-xs text-muted-foreground">
                {pools.filter(p => p.status === 'online').length} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalAlerts.length + warningAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                {criticalAlerts.length} critical, {warningAlerts.length} warning
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="filesystems" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="filesystems">Filesystems</TabsTrigger>
            <TabsTrigger value="pools">Storage Pools</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="filesystems" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by device, mount point, or filesystem..."
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
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="mounted">Mounted</SelectItem>
                      <SelectItem value="unmounted">Unmounted</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Filesystem Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading storage data...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredStorage.map((item, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStorage?.device === item.device ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedStorage(item)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStorageTypeIcon(item.type)}
                          <CardTitle className="text-lg">{item.device}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              item.status === 'mounted' ? 'border-green-600 text-green-600' :
                              item.status === 'unmounted' ? 'border-yellow-600 text-yellow-600' :
                              'border-red-600 text-red-600'
                            }
                          >
                            {getStatusText(item.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.smartStatus && (
                            <Badge 
                              variant="outline" 
                              className={getSmartStatusColor(item.smartStatus)}
                            >
                              SMART: {item.smartStatus}
                            </Badge>
                          )}
                          {item.temperature && (
                            <Badge variant="outline">
                              {item.temperature}°C
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        Mounted at {item.mountPoint} • {item.filesystem}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Storage Usage */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Storage Usage</span>
                            <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                          </div>
                          <Progress value={item.percentage} />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Used</div>
                              <div className="font-medium">{formatBytes(item.used)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Available</div>
                              <div className="font-medium">{formatBytes(item.available)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Performance</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Read Speed</div>
                              <div className="font-medium">{formatSpeed(item.throughput?.read || 0)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Write Speed</div>
                              <div className="font-medium">{formatSpeed(item.throughput?.write || 0)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Read IOPS</div>
                              <div className="font-medium">{item.iops?.reads || 0}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Write IOPS</div>
                              <div className="font-medium">{item.iops?.writes || 0}</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Actions</div>
                          <div className="flex flex-wrap gap-2">
                            {item.status === 'mounted' ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStorageAction(item.device, 'unmount')
                                }}
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                Unmount
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStorageAction(item.device, 'mount')
                                }}
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                Mount
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStorageAction(item.device, 'format')
                              }}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Format
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStorageAction(item.device, 'resize')
                              }}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Resize
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

          <TabsContent value="pools" className="space-y-4">
            <div className="grid gap-6">
              {pools.map((pool, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(pool.status)}`} />
                        <CardTitle className="text-lg">{pool.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {pool.type.toUpperCase()}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={
                            pool.status === 'online' ? 'border-green-600 text-green-600' :
                            pool.status === 'degraded' ? 'border-yellow-600 text-yellow-600' :
                            'border-red-600 text-red-600'
                          }
                        >
                          {getStatusText(pool.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {pool.compression && (
                          <Badge variant="outline">Compression</Badge>
                        )}
                        {pool.encryption && (
                          <Badge variant="outline">Encryption</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Redundancy: {pool.redundancy} • {pool.devices.length} devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Pool Usage</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((pool.used / pool.total) * 100)}%
                          </span>
                        </div>
                        <Progress value={(pool.used / pool.total) * 100} />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Used</div>
                            <div className="font-medium">{formatBytes(pool.used)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-medium">{formatBytes(pool.total)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Devices</div>
                        <div className="space-y-1">
                          {pool.devices.map((device, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              {device}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Actions</div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Scrub
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-3 h-3 mr-1" />
                            Expand
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {pools.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No storage pools found</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Storage Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {performance.length > 0 ? formatSpeed(performance[performance.length - 1]?.readSpeed || 0) : '0 B/s'}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Read Speed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {performance.length > 0 ? formatSpeed(performance[performance.length - 1]?.writeSpeed || 0) : '0 B/s'}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Write Speed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {performance.length > 0 ? performance[performance.length - 1]?.iopsRead || 0 : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Read IOPS</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {performance.length > 0 ? performance[performance.length - 1]?.iopsWrite || 0 : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Write IOPS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Performance chart would be displayed here</p>
                      <p className="text-sm text-muted-foreground">Showing read/write speeds over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                        <span className="text-xs text-muted-foreground">Device: {alert.device}</span>
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
                      <p className="text-muted-foreground">No storage alerts</p>
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
export default withAuth(StoragePage)