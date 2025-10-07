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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Database, 
  Table, 
  Key, 
  Users, 
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
  TrendingUp,
  Settings,
  Play,
  Pause,
  Square,
  Trash2,
  Download,
  Upload,
  Eye,
  Edit,
  Copy
} from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { withAuth } from "@/hooks/useAuth"

interface DatabaseInfo {
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb' | 'redis'
  version: string
  status: 'online' | 'offline' | 'maintenance' | 'error'
  host: string
  port: number
  size: number
  tables: number
  connections: number
  uptime: string
  lastBackup: string
  lastUpdated: string
}

interface TableInfo {
  name: string
  database: string
  engine: string
  rows: number
  size: number
  indexes: number
  collation: string
  created: string
  updated: string
  lastUpdated: string
}

interface QueryInfo {
  id: string
  database: string
  query: string
  type: 'select' | 'insert' | 'update' | 'delete' | 'create' | 'drop' | 'alter'
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  duration: number
  rowsAffected: number
  user: string
  timestamp: string
  lastUpdated: string
}

interface UserPermission {
  id: string
  username: string
  host: string
  database: string
  privileges: string[]
  grants: string[]
  created: string
  lastLogin: string
}

interface DatabasePerformance {
  timestamp: string
  queriesPerSecond: number
  connections: number
  cacheHitRatio: number
  slowQueries: number
  activeThreads: number
  bufferPoolUsage: number
}

interface DatabaseAlert {
  id: string
  type: 'performance' | 'connection' | 'space' | 'backup' | 'security'
  severity: 'info' | 'warning' | 'critical'
  message: string
  database: string
  timestamp: string
  resolved: boolean
}

function DatabasePage() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([])
  const [tables, setTables] = useState<TableInfo[]>([])
  const [queries, setQueries] = useState<QueryInfo[]>([])
  const [users, setUsers] = useState<UserPermission[]>([])
  const [performance, setPerformance] = useState<DatabasePerformance[]>([])
  const [alerts, setAlerts] = useState<DatabaseAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseInfo | null>(null)
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false)
  const [queryText, setQueryText] = useState("")

  const fetchDatabase = async () => {
    try {
      const response = await fetch('/api/database')
      if (response.ok) {
        const data = await response.json()
        setDatabases(data.data?.databases || [])
        setTables(data.data?.tables || [])
        setQueries(data.data?.queries || [])
        setUsers(data.data?.users || [])
        setPerformance(data.data?.performance || [])
        setAlerts(data.data?.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch database data:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeQuery = async () => {
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'query', query: queryText }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        setIsQueryDialogOpen(false)
        setQueryText("")
        fetchDatabase()
      }
    } catch (error) {
      console.error('Failed to execute query:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "offline": return "bg-red-500"
      case "maintenance": return "bg-yellow-500"
      case "error": return "bg-red-500"
      case "running": return "bg-blue-500"
      case "completed": return "bg-green-500"
      case "failed": return "bg-red-500"
      case "cancelled": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online"
      case "offline": return "Offline"
      case "maintenance": return "Maintenance"
      case "error": return "Error"
      case "running": return "Running"
      case "completed": return "Completed"
      case "failed": return "Failed"
      case "cancelled": return "Cancelled"
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

  const filteredDatabases = databases.filter(db => {
    const matchesSearch = db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         db.host.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || db.type === typeFilter
    const matchesStatus = statusFilter === "all" || db.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  useEffect(() => {
    fetchDatabase()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchDatabase, 10000) // Refresh every 10 seconds
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

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case 'mysql': return <Database className="w-4 h-4 text-blue-600" />
      case 'postgresql': return <Database className="w-4 h-4 text-blue-800" />
      case 'sqlite': return <Database className="w-4 h-4 text-orange-600" />
      case 'mongodb': return <Database className="w-4 h-4 text-green-600" />
      case 'redis': return <Database className="w-4 h-4 text-red-600" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const totalSize = databases.reduce((sum, db) => sum + db.size, 0)
  const totalTables = databases.reduce((sum, db) => sum + db.tables, 0)
  const totalConnections = databases.reduce((sum, db) => sum + db.connections, 0)

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved)
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning' && !alert.resolved)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage your database infrastructure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Execute Query
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Execute SQL Query</DialogTitle>
                  <DialogDescription>
                    Enter your SQL query to execute against the selected database.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">SQL Query</Label>
                    <Textarea
                      id="query"
                      placeholder="SELECT * FROM table_name WHERE condition;"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsQueryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={executeQuery}>
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Auto Refresh {autoRefresh ? "ON" : "OFF"}
            </Button>
            <Button onClick={fetchDatabase} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Database
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
                  <strong>Critical:</strong> {alert.message} ({alert.database})
                </AlertDescription>
              </Alert>
            ))}
            {warningAlerts.map((alert) => (
              <Alert key={alert.id} className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warning:</strong> {alert.message} ({alert.database})
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Databases</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databases.length}</div>
              <p className="text-xs text-muted-foreground">
                {databases.filter(db => db.status === 'online').length} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Table className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTables.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all databases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Total database storage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConnections}</div>
              <p className="text-xs text-muted-foreground">
                Current database connections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="databases" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="databases">Databases</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="databases" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or host..."
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
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="mongodb">MongoDB</SelectItem>
                      <SelectItem value="redis">Redis</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Database Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading database data...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredDatabases.map((db, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDatabase?.name === db.name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedDatabase(db)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getDatabaseIcon(db.type)}
                          <CardTitle className="text-lg">{db.name}</CardTitle>
                          <Badge variant="outline" className="uppercase">
                            {db.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              db.status === 'online' ? 'border-green-600 text-green-600' :
                              db.status === 'offline' ? 'border-red-600 text-red-600' :
                              db.status === 'maintenance' ? 'border-yellow-600 text-yellow-600' :
                              'border-red-600 text-red-600'
                            }
                          >
                            {getStatusText(db.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{db.version}</Badge>
                          <Badge variant="outline">{db.tables} tables</Badge>
                        </div>
                      </div>
                      <CardDescription>
                        {db.host}:{db.port} • {formatBytes(db.size)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Database Info */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Database Info</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Connections</div>
                              <div className="font-medium">{db.connections}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Uptime</div>
                              <div className="font-medium">{db.uptime}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Last Backup</div>
                              <div className="font-medium">{db.lastBackup}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Size</div>
                              <div className="font-medium">{formatBytes(db.size)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Performance</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Active Connections</span>
                              <span>{db.connections}</span>
                            </div>
                            <Progress value={Math.min(100, (db.connections / 100) * 100)} className="h-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Storage Usage</span>
                              <span>{Math.round((db.size / (1024 * 1024 * 1024)) * 100) / 100} GB</span>
                            </div>
                            <Progress value={Math.min(100, (db.size / (100 * 1024 * 1024 * 1024)) * 100)} className="h-1" />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Actions</div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              Backup
                            </Button>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Restart
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

          <TabsContent value="tables" className="space-y-4">
            <div className="grid gap-4">
              {tables.map((table, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{table.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Database: {table.database}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Engine: {table.engine}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Size & Rows</div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Size</div>
                          <div className="font-medium">{formatBytes(table.size)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Rows</div>
                          <div className="font-medium">{table.rows.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Indexes</div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Index Count</div>
                          <div className="font-medium">{table.indexes}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Collation</div>
                          <div className="font-medium">{table.collation}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Actions</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            Browse
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Drop
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tables.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Table className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No tables found</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <div className="grid gap-4">
              {queries.map((query, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(query.status)}`} />
                          <span className="text-sm font-medium capitalize">{query.type}</span>
                          <Badge variant="outline" className="capitalize">
                            {getStatusText(query.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Database: {query.database}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          User: {query.user}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Query</div>
                        <div className="text-xs font-mono bg-muted p-2 rounded max-h-16 overflow-hidden">
                          {query.query}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Performance</div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{formatDuration(query.duration)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Rows Affected</div>
                          <div className="font-medium">{query.rowsAffected}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Timestamp</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(query.timestamp).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
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
              
              {queries.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Edit className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No recent queries</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4">
              {users.map((user, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{user.username}@{user.host}</div>
                        <div className="text-xs text-muted-foreground">
                          Database: {user.database}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(user.created).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Privileges</div>
                        <div className="flex flex-wrap gap-1">
                          {user.privileges.slice(0, 3).map((priv, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {priv}
                            </Badge>
                          ))}
                          {user.privileges.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.privileges.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Grants</div>
                        <div className="text-xs text-muted-foreground">
                          {user.grants.length} grant(s)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last login: {user.lastLogin || 'Never'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Actions</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Key className="w-3 h-3 mr-1" />
                            Reset Password
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {users.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No database users found</p>
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
                    <BarChart3 className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {performance.length > 0 ? performance[performance.length - 1]?.queriesPerSecond || 0 : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Queries/sec</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {performance.length > 0 ? performance[performance.length - 1]?.cacheHitRatio || 0 : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Cache Hit Ratio</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {performance.length > 0 ? performance[performance.length - 1]?.slowQueries || 0 : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Slow Queries</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {performance.length > 0 ? performance[performance.length - 1]?.activeThreads || 0 : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Threads</div>
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
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Performance chart would be displayed here</p>
                      <p className="text-sm text-muted-foreground">Showing QPS, cache ratio, and slow queries over time</p>
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
                        <span className="text-xs text-muted-foreground">Database: {alert.database}</span>
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
                      <p className="text-muted-foreground">No database alerts</p>
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
export default withAuth(DatabasePage)