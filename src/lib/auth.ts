import { NextRequest, NextResponse } from 'next/server'
import * as pam from 'simple-pam'

interface User {
  username: string
  uid: number
  gid: number
  home: string
  shell: string
}

interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export class PAMAuth {
  private static instance: PAMAuth
  
  static getInstance(): PAMAuth {
    if (!PAMAuth.instance) {
      PAMAuth.instance = new PAMAuth()
    }
    return PAMAuth.instance
  }

  async authenticate(username: string, password: string): Promise<AuthResult> {
    try {
      // Use PAM to authenticate against system users
      const authResult = await new Promise<boolean>((resolve, reject) => {
        pam.authenticate(username, password, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })

      if (!authResult) {
        return {
          success: false,
          error: 'Invalid username or password'
        }
      }

      // Get user info from system
      const userInfo = await this.getUserInfo(username)
      
      return {
        success: true,
        user: userInfo
      }
    } catch (error) {
      console.error('PAM authentication error:', error)
      return {
        success: false,
        error: 'Authentication failed'
      }
    }
  }

  private async getUserInfo(username: string): Promise<User> {
    // This would typically read from /etc/passwd or use system calls
    // For now, we'll return a basic user structure
    // In production, you'd want to use proper system calls to get real user data
    
    return {
      username,
      uid: 1000, // Default UID
      gid: 1000, // Default GID
      home: `/home/${username}`,
      shell: '/bin/bash'
    }
  }

  async checkPermission(username: string, service: string): Promise<boolean> {
    try {
      // Check if user has permission to access specific service
      // This could use PAM's account management or check group membership
      return await new Promise<boolean>((resolve, reject) => {
        pam.checkAccount(username, service, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      return await new Promise<boolean>((resolve, reject) => {
        pam.changePassword(username, oldPassword, newPassword, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })
      })
    } catch (error) {
      console.error('Password change error:', error)
      return false
    }
  }
}

// Session management
export interface Session {
  id: string
  username: string
  user: User
  createdAt: Date
  expiresAt: Date
  isActive: boolean
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map()
  private static instance: SessionManager
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  createSession(user: User): Session {
    const sessionId = this.generateSessionId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    
    const session: Session = {
      id: sessionId,
      username: user.username,
      user,
      createdAt: now,
      expiresAt,
      isActive: true
    }
    
    this.sessions.set(sessionId, session)
    return session
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }
    
    return session
  }

  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  cleanupExpiredSessions(): void {
    const now = new Date()
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId)
      }
    }
  }

  private generateSessionId(): string {
    return Buffer.from(crypto.randomUUID()).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
  }
}

// Middleware for protecting routes
export async function requireAuth(request: NextRequest): Promise<NextResponse | Session> {
  const authHeader = request.headers.get('authorization')
  const sessionId = authHeader?.replace('Bearer ', '')
  
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  const sessionManager = SessionManager.getInstance()
  const session = sessionManager.getSession(sessionId)
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired session' },
      { status: 401 }
    )
  }
  
  return session
}

// Role-based access control
export const PERMISSIONS = {
  SERVER_MANAGE: 'server:manage',
  VM_MANAGE: 'vm:manage',
  STORAGE_MANAGE: 'storage:manage',
  NETWORK_MANAGE: 'network:manage',
  FILE_MANAGE: 'file:manage',
  USER_MANAGE: 'user:manage',
  SYSTEM_ADMIN: 'system:admin'
}

export async function requirePermission(session: Session, permission: string): Promise<boolean> {
  // For now, we'll check if user is in specific groups
  // In production, this would integrate with system groups or PAM policies
  
  const username = session.username
  
  // Admin users (root or sudo group) have all permissions
  if (username === 'root' || await this.isUserInGroup(username, 'sudo') || await this.isUserInGroup(username, 'admin')) {
    return true
  }
  
  // Check specific permissions based on groups
  const permissionGroups: { [key: string]: string[] } = {
    [PERMISSIONS.SERVER_MANAGE]: ['servers', 'admin'],
    [PERMISSIONS.VM_MANAGE]: ['vm', 'admin'],
    [PERMISSIONS.STORAGE_MANAGE]: ['storage', 'admin'],
    [PERMISSIONS.NETWORK_MANAGE]: ['network', 'admin'],
    [PERMISSIONS.FILE_MANAGE]: ['users', 'admin'],
  }
  
  const requiredGroups = permissionGroups[permission] || []
  
  for (const group of requiredGroups) {
    if (await this.isUserInGroup(username, group)) {
      return true
    }
  }
  
  return false
}

async function isUserInGroup(username: string, group: string): Promise<boolean> {
  // This would typically check /etc/group or use system calls
  // For now, return a simple implementation
  try {
    const { exec } = await import('child_process')
    return new Promise((resolve) => {
      exec(`groups ${username}`, (error: any, stdout: string) => {
        if (error) {
          resolve(false)
          return
        }
        resolve(stdout.includes(group))
      })
    })
  } catch (error) {
    console.error('Group check error:', error)
    return false
  }
}