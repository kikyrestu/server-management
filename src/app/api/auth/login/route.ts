import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createSession } from '../verify/route'

const execAsync = promisify(exec)

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

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Validate username to prevent command injection
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Invalid username format' },
        { status: 400 }
      )
    }

      // Simple authentication for development/testing
  // In production, replace this with proper PAM authentication
  let userInfo: User | null = null
  try {
    // Check if user exists in the system
    const { stdout: passwdOutput } = await execAsync(`getent passwd ${username}`)
    
    if (!passwdOutput.trim()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }
    
    // For development purposes, accept any non-empty password for existing users
    // This allows testing the application without proper PAM setup
    // REMOVE THIS IN PRODUCTION!
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Allowing login for user ${username}`)
      console.log('WARNING: Using development authentication - NOT SECURE FOR PRODUCTION!')
    } else {
      // In production, you should implement proper PAM authentication here
      // For now, we'll use a simple check
      if (!password || password.length < 1) {
        return NextResponse.json(
          { success: false, error: 'Password required' },
          { status: 401 }
        )
      }
    }
    
    // Parse user info from passwd output
    const passwdFields = passwdOutput.trim().split(':')
    if (passwdFields.length >= 7) {
      userInfo = {
        username: passwdFields[0],
        uid: parseInt(passwdFields[2]),
        gid: parseInt(passwdFields[3]),
        home: passwdFields[5],
        shell: passwdFields[6]
      }
    } else {
      // Fallback user info
      userInfo = {
        username,
        uid: 1000,
        gid: 1000,
        home: `/home/${username}`,
        shell: '/bin/bash'
      }
    }
    
    console.log(`Login successful for user: ${userInfo.username} (UID: ${userInfo.uid})`)
    
  } catch (error: any) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication service unavailable' },
      { status: 500 }
    )
  }

  // Check if userInfo was successfully created
  if (!userInfo) {
    return NextResponse.json(
      { success: false, error: 'Failed to create user info' },
      { status: 500 }
    )
  }

  // Create session and store it
  const sessionId = await createSession(userInfo.username, userInfo.uid, userInfo.home)
    
  const response = NextResponse.json({
    success: true,
    message: 'Authentication successful',
    user: {
      username: userInfo.username,
      uid: userInfo.uid,
      home: userInfo.home
    },
    session: {
      id: sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }
  })
  
  // Set session cookie
  response.cookies.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
  
  return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}