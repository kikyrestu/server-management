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
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Activity,
  Play,
  Pause,
  RotateCcw,
  Power,
  Plus,
  Search,
  Filter,
  Monitor,
  Settings,
  Copy,
  Trash2,
  Clock,
  Zap
} from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { withAuth } from "@/hooks/useAuth"

interface VMStatus {
  id: string
  name: string
  description: string
  status: "running" | "stopped" | "paused" | "creating" | "deleting"
  cpu: {
    cores: number
    usage: number
  }
  memory: {
    allocated: number
    usage: number
  }
  disk: {
    size: number
    usage: number
    type: string
  }
  network: {
    interfaces: Array<{
      name: string
      type: string
      mac: string
      ip: string
    }>
    bandwidth: {
      download: number
      upload: number
    }
  }
  os: string
  ip: string
  uptime: string
  lastUpdated: string
  hostServer: string
  tags: string[]
}

interface VMDetail {
  id: string
  name: string
  description: string
  status: "running" | "stopped" | "paused" | "creating" | "deleting"
  os: string
  architecture: string
  cpu: {
    cores: number
    threads: number
    usage: number
    model: string
  }
  memory: {
    allocated: number
    usage: number
    balloon: number
  }
  disks: Array<{
    id: string
    name: string
    size: number
    usage: number
    type: string
    format: string
    path: string
    readonly: boolean
  }>
  network: Array<{
    id: string
    name: string
    type: string
    mac: string
    ip: string
    bridge: string
    bandwidth: {
      download: number
      upload: number
    }
  }>
  snapshots: Array<{
    id: string
    name: string
    description: string
    created: string
    size: number
  }>
  hostServer: string
  uptime: string
  lastBoot: string
  lastUpdated: string
  tags: string[]
  resources: {
    cpuWeight: number
    ioPriority: number
    memorySwap: number
  }
}

interface CreateVMData {
  name: string
  description: string
  os: string
  cpuCores: number
  memory: number
  diskSize: number
  networkType: string
  hostServer: string
}

function VMsPage() {
  const [vms, setVMs] = useState<VMStatus[]>([])
  const [selectedVM, setSelectedVM] = useState<VMDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createVMData, setCreateVMData] = useState<CreateVMData>({
    name: "",
    description: "",
    os: "ubuntu-22.04",
    cpuCores: 2,
    memory: 2048,
    diskSize: 20,
    networkType: "bridged",
    hostServer: ""
  })

  const fetchVMs = async () => {
    try {
      const response = await fetch('/api/vms')
      if (response.ok) {
        const data = await response.json()
        setVMs(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch VMs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVMDetail = async (vmId: string) => {
    try {
      const response = await fetch(`/api/vms/${vmId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedVM(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch VM detail:', error)
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
        fetchVMs()
        if (selectedVM && selectedVM.id === vmId) {
          fetchVMDetail(vmId)
        }
      }
    } catch (error) {
      console.error('Failed to perform VM action:', error)
    }
  }

  const handleCreateVM = async () => {
    try {
      const response = await fetch('/api/vms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create', ...createVMData }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        setIsCreateDialogOpen(false)
        setCreateVMData({
          name: "",
          description: "",
          os: "ubuntu-22.04",
          cpuCores: 2,
          memory: 2048,
          diskSize: 20,
          networkType: "bridged",
          hostServer: ""
        })
        fetchVMs()
      }
    } catch (error) {
      console.error('Failed to create VM:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-500"
      case "stopped": return "bg-red-500"
      case "paused": return "bg-yellow-500"
      case "creating": return "bg-blue-500"
      case "deleting": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "running": return "Running"
      case "stopped": return "Stopped"
      case "paused": return "Paused"
      case "creating": return "Creating"
      case "deleting": return "Deleting"
      default: return "Unknown"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="w-4 h-4 text-green-500" />
      case "stopped": return <Power className="w-4 h-4 text-red-500" />
      case "paused": return <Pause className="w-4 h-4 text-yellow-500" />
      case "creating": return <Clock className="w-4 h-4 text-blue-500" />
      case "deleting": return <Trash2 className="w-4 h-4 text-orange-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredVMs = vms.filter(vm => {
    const matchesSearch = vm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vm.os.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vm.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    fetchVMs()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchVMs, 5000)
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
            <h1 className="text-3xl font-bold tracking-tight">Virtual Machines</h1>
            <p className="text-muted-foreground">
              Manage your virtual infrastructure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create VM
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Virtual Machine</DialogTitle>
                  <DialogDescription>
                    Configure the basic settings for your new virtual machine.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      value={createVMData.name}
                      onChange={(e) => setCreateVMData({...createVMData, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input
                      id="description"
                      value={createVMData.description}
                      onChange={(e) => setCreateVMData({...createVMData, description: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="os" className="text-right">OS</Label>
                    <Select value={createVMData.os} onValueChange={(value) => setCreateVMData({...createVMData, os: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ubuntu-22.04">Ubuntu 22.04</SelectItem>
                        <SelectItem value="ubuntu-20.04">Ubuntu 20.04</SelectItem>
                        <SelectItem value="debian-11">Debian 11</SelectItem>
                        <SelectItem value="centos-8">CentOS 8</SelectItem>
                        <SelectItem value="windows-11">Windows 11</SelectItem>
                        <SelectItem value="windows-server-2022">Windows Server 2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cpuCores" className="text-right">CPU Cores</Label>
                    <Select value={createVMData.cpuCores.toString()} onValueChange={(value) => setCreateVMData({...createVMData, cpuCores: parseInt(value)})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Core</SelectItem>
                        <SelectItem value="2">2 Cores</SelectItem>
                        <SelectItem value="4">4 Cores</SelectItem>
                        <SelectItem value="8">8 Cores</SelectItem>
                        <SelectItem value="16">16 Cores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="memory" className="text-right">Memory (MB)</Label>
                    <Select value={createVMData.memory.toString()} onValueChange={(value) => setCreateVMData({...createVMData, memory: parseInt(value)})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024">1024 MB</SelectItem>
                        <SelectItem value="2048">2048 MB</SelectItem>
                        <SelectItem value="4096">4096 MB</SelectItem>
                        <SelectItem value="8192">8192 MB</SelectItem>
                        <SelectItem value="16384">16384 MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="diskSize" className="text-right">Disk Size (GB)</Label>
                    <Select value={createVMData.diskSize.toString()} onValueChange={(value) => setCreateVMData({...createVMData, diskSize: parseInt(value)})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 GB</SelectItem>
                        <SelectItem value="40">40 GB</SelectItem>
                        <SelectItem value="80">80 GB</SelectItem>
                        <SelectItem value="160">160 GB</SelectItem>
                        <SelectItem value="320">320 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVM}>
                    Create VM
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
            <Button onClick={fetchVMs} size="sm">
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
                  placeholder="Search VMs by name, description, or OS..."
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
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="creating">Creating</SelectItem>
                  <SelectItem value="deleting">Deleting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* VM Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading VM data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVMs.map((vm) => (
              <Card 
                key={vm.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVM?.id === vm.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => fetchVMDetail(vm.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(vm.status)}
                      <CardTitle className="text-lg">{vm.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {getStatusText(vm.status)}
                    </Badge>
                  </div>
                  <CardDescription>{vm.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* OS and Host */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{vm.os}</span>
                    <span className="text-muted-foreground">{vm.hostServer}</span>
                  </div>

                  {/* Resource Usage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">CPU</span>
                        <span className="text-xs text-muted-foreground">{vm.cpu.usage}%</span>
                      </div>
                      <Progress value={vm.cpu.usage} className="h-2" />
                      <div className="text-xs text-muted-foreground">{vm.cpu.cores} cores</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Memory</span>
                        <span className="text-xs text-muted-foreground">{vm.memory.usage}%</span>
                      </div>
                      <Progress value={vm.memory.usage} className="h-2" />
                      <div className="text-xs text-muted-foreground">{formatBytes(vm.memory.allocated)}</div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{vm.disk.usage}%</div>
                      <div className="text-muted-foreground">Disk</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{vm.ip || 'N/A'}</div>
                      <div className="text-muted-foreground">IP Address</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {vm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {vm.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {vm.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{vm.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {vm.status === "running" && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVMAction(vm.id, 'pause')
                          }}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVMAction(vm.id, 'restart')
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restart
                        </Button>
                      </>
                    )}
                    {vm.status === "stopped" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVMAction(vm.id, 'start')
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    )}
                    {vm.status === "paused" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVMAction(vm.id, 'resume')
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVMAction(vm.id, 'delete')
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* VM Details */}
        {selectedVM && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedVM.name}</CardTitle>
                  <CardDescription>{selectedVM.description}</CardDescription>
                </div>
                <Badge variant="outline" className="capitalize">
                  {getStatusText(selectedVM.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="disks">Disks</TabsTrigger>
                  <TabsTrigger value="network">Network</TabsTrigger>
                  <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
                  <TabsTrigger value="console">Console</TabsTrigger>
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
                          <div className="text-muted-foreground">{selectedVM.os}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Architecture</div>
                          <div className="text-muted-foreground">{selectedVM.architecture}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Host Server</div>
                          <div className="text-muted-foreground">{selectedVM.hostServer}</div>
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
                          <div className="text-muted-foreground">{formatUptime(selectedVM.uptime)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Last Boot</div>
                          <div className="text-muted-foreground">{new Date(selectedVM.lastBoot).toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">CPU Cores</div>
                          <div className="text-muted-foreground">{selectedVM.cpu.cores}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Memory</div>
                          <div className="text-muted-foreground">{formatBytes(selectedVM.memory.allocated)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Network Interfaces</div>
                          <div className="text-muted-foreground">{selectedVM.network.length}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Resource Limits</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">CPU Weight</div>
                          <div className="text-muted-foreground">{selectedVM.resources.cpuWeight}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">I/O Priority</div>
                          <div className="text-muted-foreground">{selectedVM.resources.ioPriority}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Memory Swap</div>
                          <div className="text-muted-foreground">{formatBytes(selectedVM.resources.memorySwap)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tags */}
                  {selectedVM.tags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedVM.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                            <span className="text-sm text-muted-foreground">{selectedVM.cpu.model}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Cores</span>
                            <span className="text-sm text-muted-foreground">{selectedVM.cpu.cores}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Threads</span>
                            <span className="text-sm text-muted-foreground">{selectedVM.cpu.threads}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Usage</span>
                            <span className="text-sm text-muted-foreground">{selectedVM.cpu.usage}%</span>
                          </div>
                          <Progress value={selectedVM.cpu.usage} />
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
                            <span className="text-sm font-medium">Allocated</span>
                            <span className="text-sm text-muted-foreground">{formatBytes(selectedVM.memory.allocated)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Used</span>
                            <span className="text-sm text-muted-foreground">{formatBytes(selectedVM.memory.allocated * selectedVM.memory.usage / 100)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Usage</span>
                            <span className="text-sm text-muted-foreground">{selectedVM.memory.usage}%</span>
                          </div>
                          <Progress value={selectedVM.memory.usage} />
                        </div>
                        <div className="pt-4 border-t">
                          <div className="text-sm font-medium mb-2">Memory Balloon</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Current</span>
                            <span className="text-xs text-muted-foreground">{selectedVM.memory.balloon}%</span>
                          </div>
                          <Progress value={selectedVM.memory.balloon} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="disks" className="space-y-4">
                  <div className="space-y-4">
                    {selectedVM.disks.map((disk, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <HardDrive className="w-5 h-5" />
                              {disk.name}
                            </span>
                            {disk.readonly && (
                              <Badge variant="outline">Read-only</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">Size</div>
                                <div className="text-muted-foreground">{formatBytes(disk.size)}</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Used</div>
                                <div className="text-muted-foreground">{formatBytes(disk.size * disk.usage / 100)}</div>
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
                                <div className="font-medium">Type</div>
                                <div className="text-muted-foreground">{disk.type}</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Format</div>
                                <div className="text-muted-foreground">{disk.format}</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">Path</div>
                                <div className="text-muted-foreground text-xs break-all">{disk.path}</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="network" className="space-y-4">
                  <div className="space-y-4">
                    {selectedVM.network.map((iface, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Network className="w-5 h-5" />
                            {iface.name}
                            <Badge variant="outline">{iface.type}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">MAC Address</div>
                                <div className="text-muted-foreground">{iface.mac}</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">IP Address</div>
                                <div className="text-muted-foreground">{iface.ip || 'Not assigned'}</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">Bridge</div>
                                <div className="text-muted-foreground">{iface.bridge}</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Download</div>
                                <div className="text-muted-foreground">{iface.bandwidth.download} Mbps</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium">Upload</div>
                                <div className="text-muted-foreground">{iface.bandwidth.upload} Mbps</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="snapshots" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">VM Snapshots</h3>
                      <p className="text-sm text-muted-foreground">
                        Restore your VM to a previous state
                      </p>
                    </div>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Snapshot
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {selectedVM.snapshots.map((snapshot, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{snapshot.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{formatBytes(snapshot.size)}</Badge>
                              <Button variant="outline" size="sm">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Restore
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardTitle>
                          <CardDescription>{snapshot.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Created: {new Date(snapshot.created).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {selectedVM.snapshots.length === 0 && (
                      <Card>
                        <CardContent className="flex items-center justify-center h-32">
                          <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground">No snapshots available</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="console" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="w-5 h-5" />
                        VM Console
                      </CardTitle>
                      <CardDescription>
                        Access the virtual machine console
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-auto">
                          <div>VM Console - {selectedVM.name}</div>
                          <div>Status: {selectedVM.status}</div>
                          <div>IP: {selectedVM.network[0]?.ip || 'Not assigned'}</div>
                          <div className="mt-4">--- Console Output ---</div>
                          <div>Connecting to VM console...</div>
                          <div>Console session ready.</div>
                          <div className="mt-2">$ </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Console Settings
                          </Button>
                          <Button variant="outline">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Clipboard
                          </Button>
                          <Button variant="outline">
                            <Zap className="w-4 h-4 mr-2" />
                            Send Ctrl+Alt+Del
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
export default withAuth(VMsPage)