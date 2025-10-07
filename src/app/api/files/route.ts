import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir, stat, readFile, writeFile, unlink, rename, mkdir, rmdir } from 'fs/promises'
import { join, dirname, basename, extname } from 'path'

const execAsync = promisify(exec)

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modified: string
  permissions: string
}

interface DirectoryInfo {
  currentPath: string
  files: FileItem[]
  totalSize: number
}

// Get real file system information
async function getRealDirectoryInfo(path: string): Promise<DirectoryInfo> {
  try {
    // Security check - prevent directory traversal
    const normalizedPath = join('/', path).replace(/\.\./g, '')
    
    // Get directory contents
    const items = await readdir(normalizedPath)
    const files: FileItem[] = []
    let totalSize = 0

    for (const item of items) {
      try {
        const itemPath = join(normalizedPath, item)
        const stats = await stat(itemPath)
        
        // Get file permissions
        const permissions = stats.mode.toString(8).padStart(4, '0')
        
        // Create file item
        const fileItem: FileItem = {
          name: item,
          path: itemPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          permissions: stats.isDirectory() ? `d${permissions}` : `-${permissions}`
        }
        
        files.push(fileItem)
        totalSize += stats.size
      } catch (error) {
        console.error(`Error getting stats for ${item}:`, error)
      }
    }

    // Sort files: directories first, then files
    files.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'directory') return 1
      return a.name.localeCompare(b.name)
    })

    return {
      currentPath: normalizedPath,
      files,
      totalSize
    }

  } catch (error) {
    console.error('Error reading directory:', error)
    
    // Fallback to basic directory listing using ls command
    try {
      const { stdout } = await execAsync(`ls -la "${path}" 2>/dev/null || echo "Access denied"`)
      
      if (stdout.includes('Access denied')) {
        throw new Error('Access denied')
      }
      
      const lines = stdout.split('\n').slice(1, -1) // Skip total line and empty last line
      const files: FileItem[] = []
      let totalSize = 0

      for (const line of lines) {
        const match = line.match(/^([drwx-]+)\s+\d+\s+\w+\s+\w+\s+(\d+)\s+(\w+\s+\d+\s+\d+:\d+)\s+(.+)$/)
        if (match) {
          const [, permissions, sizeStr, modified, name] = match
          const size = parseInt(sizeStr) || 0
          const type = permissions.startsWith('d') ? 'directory' : 'file'
          
          files.push({
            name,
            path: join(path, name),
            type,
            size,
            modified: new Date(modified).toISOString(),
            permissions
          })
          
          totalSize += size
        }
      }

      return {
        currentPath: path,
        files,
        totalSize
      }
    } catch (fallbackError) {
      console.error('Fallback directory listing failed:', fallbackError)
      
      // Return minimal data
      return {
        currentPath: path,
        files: [],
        totalSize: 0
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'

    // Security validation
    if (path.includes('..') || path.startsWith('~')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      )
    }

    const directoryInfo = await getRealDirectoryInfo(path)

    return NextResponse.json({
      success: true,
      data: directoryInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch directory contents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch directory contents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, path, ...params } = body

    // Security validation
    if (path && (path.includes('..') || path.startsWith('~'))) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create':
        const { name, type } = params
        try {
          const newPath = join(path, name)
          
          if (type === 'directory') {
            await mkdir(newPath, { recursive: true })
          } else {
            await writeFile(newPath, '', 'utf8')
          }
          
          return NextResponse.json({
            success: true,
            message: `${type === 'directory' ? 'Directory' : 'File'} '${name}' created at ${path}`,
            action: 'create'
          })
        } catch (error) {
          console.error('Error creating item:', error)
          return NextResponse.json(
            { success: false, error: `Failed to create ${name}: ${error}` },
            { status: 500 }
          )
        }

      case 'delete':
        try {
          const stats = await stat(path)
          
          if (stats.isDirectory()) {
            await rmdir(path, { recursive: true })
          } else {
            await unlink(path)
          }
          
          return NextResponse.json({
            success: true,
            message: `Item at ${path} deleted`,
            action: 'delete'
          })
        } catch (error) {
          console.error('Error deleting item:', error)
          return NextResponse.json(
            { success: false, error: `Failed to delete item at ${path}: ${error}` },
            { status: 500 }
          )
        }

      case 'rename':
        const { newName } = params
        try {
          const newPath = join(dirname(path), newName)
          await rename(path, newPath)
          
          return NextResponse.json({
            success: true,
            message: `Item renamed from ${basename(path)} to ${newName}`,
            action: 'rename'
          })
        } catch (error) {
          console.error('Error renaming item:', error)
          return NextResponse.json(
            { success: false, error: `Failed to rename item: ${error}` },
            { status: 500 }
          )
        }

      case 'copy':
        const { destination } = params
        try {
          const destPath = join(destination, basename(path))
          const stats = await stat(path)
          
          if (stats.isDirectory()) {
            // For directories, use system copy command
            await execAsync(`cp -r "${path}" "${destination}"`)
          } else {
            // For files, read and write
            const content = await readFile(path)
            await writeFile(destPath, content)
          }
          
          return NextResponse.json({
            success: true,
            message: `Item copied from ${path} to ${destination}`,
            action: 'copy'
          })
        } catch (error) {
          console.error('Error copying item:', error)
          return NextResponse.json(
            { success: false, error: `Failed to copy item: ${error}` },
            { status: 500 }
          )
        }

      case 'move':
        const { newLocation } = params
        try {
          const newPath = join(newLocation, basename(path))
          await rename(path, newPath)
          
          return NextResponse.json({
            success: true,
            message: `Item moved from ${path} to ${newLocation}`,
            action: 'move'
          })
        } catch (error) {
          console.error('Error moving item:', error)
          return NextResponse.json(
            { success: false, error: `Failed to move item: ${error}` },
            { status: 500 }
          )
        }

      case 'read':
        try {
          const content = await readFile(path, 'utf8')
          return NextResponse.json({
            success: true,
            data: {
              content,
              path,
              size: content.length
            },
            action: 'read'
          })
        } catch (error) {
          console.error('Error reading file:', error)
          return NextResponse.json(
            { success: false, error: `Failed to read file: ${error}` },
            { status: 500 }
          )
        }

      case 'write':
        const { content } = params
        try {
          await writeFile(path, content, 'utf8')
          return NextResponse.json({
            success: true,
            message: `File written to ${path}`,
            action: 'write'
          })
        } catch (error) {
          console.error('Error writing file:', error)
          return NextResponse.json(
            { success: false, error: `Failed to write file: ${error}` },
            { status: 500 }
          )
        }

      case 'execute':
        const { command } = params
        try {
          // Execute system command with security restrictions
          const allowedCommands = ['ls', 'pwd', 'whoami', 'date', 'uname', 'df', 'du', 'free', 'top', 'ps']
          const cmdParts = command.split(' ')
          const baseCmd = cmdParts[0]
          
          if (!allowedCommands.includes(baseCmd)) {
            return NextResponse.json(
              { success: false, error: `Command '${baseCmd}' not allowed` },
              { status: 403 }
            )
          }
          
          const { stdout, stderr } = await execAsync(command, { timeout: 10000 })
          
          return NextResponse.json({
            success: true,
            data: {
              command,
              stdout,
              stderr: stderr || null,
              exitCode: 0
            },
            action: 'execute'
          })
        } catch (error: any) {
          console.error('Error executing command:', error)
          return NextResponse.json({
            success: false,
            error: `Failed to execute command: ${error.message}`,
            action: 'execute'
          }, { status: 500 })
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Failed to perform file operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform file operation' },
      { status: 500 }
    )
  }
}