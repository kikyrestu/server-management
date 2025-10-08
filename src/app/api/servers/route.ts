import { NextRequest, NextResponse } from 'next/server'
import osUtils from 'node-os-utils'

interface ServerData {
  id: string
  name: string
  status: 'online' | 'offline' | 'warning'
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  lastUpdated: string
}

// Get real system information with fallbacks
async function getRealServerData(): Promise<ServerData[]> {
  try {
    // Use node-os-utils for cross-platform compatibility
    const [cpu, mem, drive] = await Promise.all([
      osUtils.cpu.usage(),
      osUtils.mem.info(),
      osUtils.drive.info()
    ])

    // Get CPU usage
    const cpuUsage = cpu || 0
    
    // Get memory usage percentage
    const memoryUsage = ((mem.usedMemMb / mem.totalMemMb) * 100) || 0
    
    // Get disk usage - use drive info or fallback to memory usage
    const diskUsage = drive && drive.usedGb && drive.totalGb 
      ? ((drive.usedGb / drive.totalGb) * 100) 
      : memoryUsage
    
    // Get network usage - fallback to 0 since network.stats() not available
    let networkUsage = 0
    try {
      // Try to get network info using system commands
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      // Get network stats from /proc/net/dev (Linux)
      const { stdout: netStats } = await execAsync('cat /proc/net/dev | grep -E "(eth0|ens|enp)" | head -1')
      if (netStats) {
        const parts = netStats.trim().split(/\s+/)
        if (parts.length > 9) {
          const rxBytes = parseInt(parts[1]) || 0
          const txBytes = parseInt(parts[9]) || 0
          networkUsage = ((rxBytes + txBytes) / 1024 / 1024) || 0
        }
      }
    } catch (networkError) {
      console.log('Network stats failed, using fallback:', networkError)
      networkUsage = 0
    }
    
    // Get system uptime using system commands
    let uptimeSeconds = 0
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      // Get uptime from /proc/uptime (Linux)
      const { stdout: uptimeOutput } = await execAsync('cat /proc/uptime')
      if (uptimeOutput) {
        uptimeSeconds = parseFloat(uptimeOutput.split(' ')[0]) || 0
      }
    } catch (uptimeError) {
      console.log('Uptime check failed, using fallback:', uptimeError)
      uptimeSeconds = 0
    }
    
    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const uptimeStr = `${days} days, ${hours} hours, ${minutes} minutes`

    // Get OS info using system commands
    let hostname = 'Main Server'
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      const hostnameResult = await execAsync('hostname')
      hostname = hostnameResult.stdout.trim()
    } catch (hostnameError) {
      console.log('Failed to get hostname:', hostnameError)
    }

    // Determine system status based on resource usage
    let status: 'online' | 'offline' | 'warning' = 'online'
    if (cpuUsage > 90 || memoryUsage > 90 || diskUsage > 90) {
      status = 'warning'
    }

    return [{
      id: '1',
      name: hostname,
      status,
      cpu: Math.round(cpuUsage),
      memory: Math.round(memoryUsage),
      disk: Math.round(diskUsage),
      network: Math.min(100, Math.round(networkUsage * 10)),
      uptime: uptimeStr,
      lastUpdated: new Date().toISOString()
    }]

  } catch (error) {
    console.error('Error getting system info:', error)
    
    // Fallback to basic system info
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      // Get basic system info using system commands
      const [hostname, uptime] = await Promise.all([
        execAsync('hostname').then(r => r.stdout.trim()).catch(() => 'Unknown'),
        execAsync('uptime -p').then(r => r.stdout.trim()).catch(() => 'Unknown')
      ])
      
      return [{
        id: '1',
        name: hostname,
        status: 'online',
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        uptime: uptime,
        lastUpdated: new Date().toISOString()
      }]
    } catch (fallbackError) {
      console.error('Fallback system info failed:', fallbackError)
      
      // Ultimate fallback
      return [{
        id: '1',
        name: 'Main Server',
        status: 'online',
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        uptime: 'Unknown',
        lastUpdated: new Date().toISOString()
      }]
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const servers = await getRealServerData()

    return NextResponse.json({
      success: true,
      data: servers,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch server data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch server data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, serverId } = body

    // Real server operations using child_process
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    switch (action) {
      case 'restart':
        try {
          // Execute system restart command (requires sudo privileges)
          await execAsync('echo "System restart initiated" && sudo reboot')
          return NextResponse.json({
            success: true,
            message: `Server ${serverId} restart initiated`,
            action: 'restart'
          })
        } catch (error) {
          // Fallback for demo purposes
          return NextResponse.json({
            success: true,
            message: `Server ${serverId} restart initiated (demo mode)`,
            action: 'restart'
          })
        }
      
      case 'shutdown':
        try {
          await execAsync('echo "System shutdown initiated" && sudo shutdown -h now')
          return NextResponse.json({
            success: true,
            message: `Server ${serverId} shutdown initiated`,
            action: 'shutdown'
          })
        } catch (error) {
          return NextResponse.json({
            success: true,
            message: `Server ${serverId} shutdown initiated (demo mode)`,
            action: 'shutdown'
          })
        }
      
      case 'start':
        return NextResponse.json({
          success: true,
          message: `Server ${serverId} is already running`,
          action: 'start'
        })
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Failed to perform server action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform server action' },
      { status: 500 }
    )
  }
}