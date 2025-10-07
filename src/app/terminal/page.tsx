"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Terminal, 
  Monitor, 
  Server, 
  Activity,
  Plus,
  Search,
  RefreshCw,
  Play,
  Pause,
  Square,
  Copy,
  Download,
  Upload,
  Settings,
  Maximize,
  Minimize,
  Save,
  FileText,
  FolderOpen,
  Users,
  Key,
  Shield,
  Zap,
  Clock,
  Edit
} from "lucide-react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { withAuth } from "@/hooks/useAuth"

interface TerminalSession {
  id: string
  name: string
  host: string
  user: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  type: 'ssh' | 'local' | 'web'
  lastCommand: string
  lastActivity: string
  duration: string
  processCount: number
  cpuUsage: number
  memoryUsage: number
}

interface CommandHistory {
  id: string
  sessionId: string
  command: string
  output: string
  timestamp: string
  duration: number
  exitCode: number
}

interface Script {
  id: string
  name: string
  description: string
  content: string
  language: 'bash' | 'python' | 'powershell' | 'perl'
  created: string
  lastModified: string
  runs: number
  lastRun: string
  author: string
}

interface FileSystemNode {
  name: string
  path: string
  type: 'file' | 'directory' | 'link'
  size: number
  permissions: string
  owner: string
  group: string
  modified: string
  children?: FileSystemNode[]
}

function TerminalPage() {
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedSession, setSelectedSession] = useState<TerminalSession | null>(null)
  const [currentCommand, setCurrentCommand] = useState("")
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false)
  const [newScript, setNewScript] = useState({
    name: "",
    description: "",
    content: "",
    language: "bash" as const
  })
  const terminalRef = useRef<HTMLDivElement>(null)

  const fetchTerminal = async () => {
    try {
      const response = await fetch('/api/terminal')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.data?.sessions || [])
        setHistory(data.data?.history || [])
        setScripts(data.data?.scripts || [])
        setFileSystem(data.data?.fileSystem || [])
      }
    } catch (error) {
      console.error('Failed to fetch terminal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeCommand = async () => {
    if (!currentCommand.trim() || !selectedSession) return

    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'execute', 
          sessionId: selectedSession.id,
          command: currentCommand 
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setTerminalOutput(prev => [...prev, `$ ${currentCommand}`, result.output || ""])
        setCurrentCommand("")
        fetchTerminal()
      }
    } catch (error) {
      console.error('Failed to execute command:', error)
      setTerminalOutput(prev => [...prev, `$ ${currentCommand}`, "Error executing command"])
    }
  }

  const createSession = async (type: string, host: string, user: string) => {
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'create_session', 
          type, 
          host, 
          user 
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        fetchTerminal()
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const saveScript = async () => {
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'save_script', 
          ...newScript 
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        setIsScriptDialogOpen(false)
        setNewScript({
          name: "",
          description: "",
          content: "",
          language: "bash"
        })
        fetchTerminal()
      }
    } catch (error) {
      console.error('Failed to save script:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-500"
      case "disconnected": return "bg-red-500"
      case "connecting": return "bg-yellow-500"
      case "error": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected": return "Connected"
      case "disconnected": return "Disconnected"
      case "connecting": return "Connecting"
      case "error": return "Error"
      default: return "Unknown"
    }
  }

  useEffect(() => {
    fetchTerminal()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchTerminal, 5000) // Refresh every 5 seconds
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'ssh': return <Server className="w-4 h-4" />
      case 'local': return <Terminal className="w-4 h-4" />
      case 'web': return <Monitor className="w-4 h-4" />
      default: return <Terminal className="w-4 h-4" />
    }
  }

  const totalSessions = sessions.length
  const activeSessions = sessions.filter(s => s.status === 'connected').length
  const totalCommands = history.length
  const totalScripts = scripts.length

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      executeCommand()
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Terminal</h1>
            <p className="text-muted-foreground">
              Manage terminal sessions and execute commands
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isScriptDialogOpen} onOpenChange={setIsScriptDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  New Script
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Script</DialogTitle>
                  <DialogDescription>
                    Create a new script for automation and repetitive tasks.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      value={newScript.name}
                      onChange={(e) => setNewScript({...newScript, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input
                      id="description"
                      value={newScript.description}
                      onChange={(e) => setNewScript({...newScript, description: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="language" className="text-right">Language</Label>
                    <Select value={newScript.language} onValueChange={(value: any) => setNewScript({...newScript, language: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bash">Bash</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="powershell">PowerShell</SelectItem>
                        <SelectItem value="perl">Perl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="content" className="text-right">Content</Label>
                    <Textarea
                      id="content"
                      value={newScript.content}
                      onChange={(e) => setNewScript({...newScript, content: e.target.value})}
                      className="col-span-3 font-mono text-sm"
                      rows={8}
                      placeholder="#!/bin/bash\n# Your script here"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsScriptDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveScript}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Script
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
            <Button onClick={fetchTerminal} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                {totalSessions} total sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commands Executed</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCommands}</div>
              <p className="text-xs text-muted-foreground">
                Today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Scripts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScripts}</div>
              <p className="text-xs text-muted-foreground">
                Automation scripts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Load</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.length > 0 ? Math.round(sessions[0].cpuUsage) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average CPU usage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Sessions
                  </span>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSession?.id === session.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getSessionIcon(session.type)}
                          <span className="font-medium text-sm">{session.name}</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.user}@{session.host}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(session.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {session.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Terminal className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No active sessions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  New SSH Session
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Terminal className="w-4 h-4 mr-2" />
                  Local Terminal
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  File Manager
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  User Sessions
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Terminal Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedSession ? (
                      <>
                        {getSessionIcon(selectedSession.type)}
                        <CardTitle className="text-lg">{selectedSession.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {getStatusText(selectedSession.status)}
                        </Badge>
                      </>
                    ) : (
                      <CardTitle className="text-lg">Terminal</CardTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {selectedSession && (
                  <CardDescription>
                    {selectedSession.user}@{selectedSession.host} • PID: {selectedSession.processCount} • CPU: {selectedSession.cpuUsage}% • Memory: {selectedSession.memoryUsage}%
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Terminal Output */}
                <div
                  ref={terminalRef}
                  className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-auto"
                >
                  {selectedSession ? (
                    <>
                      <div className="text-gray-400 mb-2">
                        Connected to {selectedSession.host} as {selectedSession.user}
                      </div>
                      {terminalOutput.map((line, index) => (
                        <div key={index} className="mb-1">
                          {line}
                        </div>
                      ))}
                      {terminalOutput.length === 0 && (
                        <div className="text-gray-400">
                          Terminal ready. Type a command and press Enter.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400 h-full flex items-center justify-center">
                      Select a session to start terminal
                    </div>
                  )}
                </div>

                {/* Command Input */}
                {selectedSession && (
                  <div className="border-t p-4 bg-muted">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {selectedSession.user}@{selectedSession.host}:~$
                      </span>
                      <Input
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter command..."
                        className="flex-1 font-mono text-sm"
                        disabled={selectedSession.status !== 'connected'}
                      />
                      <Button 
                        onClick={executeCommand} 
                        size="sm"
                        disabled={selectedSession.status !== 'connected' || !currentCommand.trim()}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for additional functionality */}
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="scripts">Scripts</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Command History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {history.slice(0, 10).map((cmd) => (
                        <div key={cmd.id} className="p-2 border rounded text-sm">
                          <div className="font-mono text-xs bg-muted p-1 rounded">
                            $ {cmd.command}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(cmd.timestamp).toLocaleString()} • {formatDuration(cmd.duration)} • Exit: {cmd.exitCode}
                          </div>
                        </div>
                      ))}
                      
                      {history.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No command history
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scripts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Saved Scripts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {scripts.map((script) => (
                        <div key={script.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{script.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {script.language}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {script.description}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Runs: {script.runs}</span>
                            <span>Last run: {script.lastRun || 'Never'}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              <Play className="w-3 h-3 mr-1" />
                              Run
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {scripts.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No saved scripts
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">File Browser</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {fileSystem.map((node) => (
                        <div key={node.path} className="flex items-center space-x-2 p-2 hover:bg-muted rounded text-sm">
                          {node.type === 'directory' ? (
                            <FolderOpen className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="flex-1">{node.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {node.type !== 'directory' ? formatBytes(node.size) : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {node.permissions}
                          </span>
                        </div>
                      ))}
                      
                      {fileSystem.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No files found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Wrap with authentication HOC
export default withAuth(TerminalPage)