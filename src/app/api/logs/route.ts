import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source: string
  process?: string
  pid?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const logs: LogEntry[] = []

    // Get system logs from journalctl (Linux systems)
    try {
      const { stdout: journalLogs } = await execAsync(
        `journalctl --no-pager --lines=${limit} --output=json`
      )
      
      const journalEntries = journalLogs.trim().split('\n').filter(line => line).map(line => {
        try {
          const entry = JSON.parse(line)
          return {
            timestamp: entry.__REALTIME_TIMESTAMP ? new Date(parseInt(entry.__REALTIME_TIMESTAMP) / 1000).toISOString() : new Date().toISOString(),
            level: getLogLevel(entry.PRIORITY || '6'),
            message: entry.MESSAGE || '',
            source: entry.SYSLOG_IDENTIFIER || entry._SYSTEMD_UNIT || 'system',
            process: entry._COMM,
            pid: entry._PID ? parseInt(entry._PID) : undefined
          }
        } catch {
          return null
        }
      }).filter(Boolean) as LogEntry[]

      logs.push(...journalEntries)
    } catch (journalError) {
      console.log('Journalctl failed, trying alternative methods:', journalError)
    }

    // Fallback to reading common log files
    const logFiles = [
      '/var/log/syslog',
      '/var/log/messages',
      '/var/log/kern.log',
      '/var/log/auth.log',
      '/var/log/daemon.log'
    ]

    for (const logFile of logFiles) {
      try {
        if (fs.existsSync(logFile)) {
          const content = fs.readFileSync(logFile, 'utf8')
          const lines = content.split('\n').slice(-limit).filter(line => line.trim())
          
          for (const line of lines) {
            const logEntry = parseSyslogLine(line)
            if (logEntry) {
              logs.push(logEntry)
            }
          }
        }
      } catch (fileError) {
        console.log(`Failed to read ${logFile}:`, fileError)
      }
    }

    // Get Docker logs if Docker is available
    try {
      const { stdout: dockerPs } = await execAsync('docker ps --format "{{.Names}}"')
      const containers = dockerPs.trim().split('\n').filter(Boolean)
      
      for (const container of containers.slice(0, 5)) { // Limit to 5 containers
        try {
          const { stdout: dockerLogs } = await execAsync(`docker logs --tail 20 ${container}`)
          const dockerLogLines = dockerLogs.trim().split('\n').filter(line => line.trim())
          
          for (const line of dockerLogLines) {
            logs.push({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: line,
              source: `docker-${container}`,
              process: container
            })
          }
        } catch (dockerError) {
          console.log(`Failed to get logs for container ${container}:`, dockerError)
        }
      }
    } catch (dockerError) {
      console.log('Docker not available or no containers running')
    }

    // Get application logs from current directory
    try {
      const appLogFiles = [
        'logs/app.log',
        'logs/error.log',
        '.next/server.log',
        'server.log'
      ]
      
      for (const logFile of appLogFiles) {
        try {
          if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf8')
            const lines = content.split('\n').slice(-50).filter(line => line.trim())
            
            for (const line of lines) {
              logs.push({
                timestamp: new Date().toISOString(),
                level: line.toLowerCase().includes('error') ? 'error' : 
                       line.toLowerCase().includes('warn') ? 'warning' : 'info',
                message: line,
                source: `app-${path.basename(logFile)}`,
                process: 'node'
              })
            }
          }
        } catch (appLogError) {
          console.log(`Failed to read app log ${logFile}:`, appLogError)
        }
      }
    } catch (appError) {
      console.log('Failed to get application logs:', appError)
    }

    // Filter by level if specified
    const filteredLogs = level === 'all' 
      ? logs 
      : logs.filter(log => log.level === level)

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      total: filteredLogs.length,
      offset,
      limit,
      level
    })

  } catch (error) {
    console.error('Failed to fetch system logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system logs' },
      { status: 500 }
    )
  }
}

function getLogLevel(priority: string): 'info' | 'warning' | 'error' | 'debug' {
  const prio = parseInt(priority) || 6
  if (prio <= 2) return 'error'
  if (prio <= 4) return 'warning'
  if (prio <= 6) return 'info'
  return 'debug'
}

function parseSyslogLine(line: string): LogEntry | null {
  try {
    // Basic syslog format parser
    const match = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s*(.*)$/)
    if (!match) return null

    const [, timestamp, hostname, process, message] = match
    
    // Parse process name and PID
    const processMatch = process.match(/^([^\[]+)(\[(\d+)\])?$/)
    const processName = processMatch?.[1] || process
    const pid = processMatch?.[3] ? parseInt(processMatch[3]) : undefined

    // Determine log level based on message content
    let level: 'info' | 'warning' | 'error' | 'debug' = 'info'
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('fail')) {
      level = 'error'
    } else if (message.toLowerCase().includes('warn') || message.toLowerCase().includes('warning')) {
      level = 'warning'
    } else if (message.toLowerCase().includes('debug')) {
      level = 'debug'
    }

    return {
      timestamp: new Date(`${new Date().getFullYear()} ${timestamp}`).toISOString(),
      level,
      message,
      source: hostname,
      process: processName,
      pid
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'clear_logs':
        // Clear application logs (not system logs for safety)
        try {
          const logFiles = [
            'logs/app.log',
            'logs/error.log',
            'server.log'
          ]
          
          for (const logFile of logFiles) {
            if (fs.existsSync(logFile)) {
              fs.writeFileSync(logFile, '')
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Application logs cleared successfully'
          })
        } catch (clearError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to clear logs'
          }, { status: 500 })
        }

      case 'export_logs':
        // Export logs to file
        try {
          const { level, format = 'text' } = params
          const logsResponse = await GET(new URL(request.url))
          const logsData = await logsResponse.json()
          
          if (!logsData.success) {
            throw new Error('Failed to fetch logs for export')
          }

          const exportDir = 'exports'
          if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true })
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const filename = `${exportDir}/logs-export-${timestamp}.${format}`
          
          let content = ''
          if (format === 'json') {
            content = JSON.stringify(logsData.data, null, 2)
          } else {
            content = logsData.data.map((log: LogEntry) => 
              `[${log.timestamp}] ${log.level.toUpperCase()} [${log.source}]: ${log.message}`
            ).join('\n')
          }

          fs.writeFileSync(filename, content)

          return NextResponse.json({
            success: true,
            message: 'Logs exported successfully',
            filename,
            downloadUrl: `/api/logs/download?filename=${encodeURIComponent(filename)}`
          })
        } catch (exportError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to export logs'
          }, { status: 500 })
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to perform log action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform log action' },
      { status: 500 }
    )
  }
}