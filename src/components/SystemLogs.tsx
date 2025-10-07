"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react"

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source: string
  process?: string
  pid?: number
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchLogs()
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        level: levelFilter,
        limit: '100',
        offset: '0'
      })
      
      const response = await fetch(`/api/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLogs(data.data || [])
        } else {
          console.error('API error:', data.error)
          // Fallback to minimal logs if API fails
          setLogs([{
            timestamp: new Date().toISOString(),
            level: 'warning' as const,
            message: 'Failed to fetch system logs, showing limited data',
            source: 'system',
            process: 'log-service'
          }])
        }
      } else {
        throw new Error('Failed to fetch logs')
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      // Fallback to minimal logs
      setLogs([{
        timestamp: new Date().toISOString(),
        level: 'error' as const,
        message: `Error fetching logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: 'system',
        process: 'log-service'
      }])
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      case 'debug': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'debug': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesSearch && matchesLevel
  })

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} [${log.source}]: ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.log`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Logs</CardTitle>
            <CardDescription>View and monitor system logs across all services</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh {autoRefresh ? 'On' : 'Off'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || levelFilter !== 'all' ? 'No logs found matching your filters.' : 'No logs available.'}
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLevelIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-mono">
                      {log.source}
                    </span>
                    {log.process && (
                      <span className="text-xs text-muted-foreground">
                        ({log.process}{log.pid ? `[${log.pid}]` : ''})
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">
                    {log.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div>
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Error</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Info</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Debug</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}