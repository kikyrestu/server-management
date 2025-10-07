import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// File-based session storage for persistence across server restarts
const SESSION_DIR = join(process.cwd(), 'sessions')
const SESSION_FILE = join(SESSION_DIR, 'sessions.json')

interface SessionData {
  username: string
  uid: number
  home: string
  expiresAt: number
}

// Ensure sessions directory exists
if (!existsSync(SESSION_DIR)) {
  try {
    mkdir(SESSION_DIR, { recursive: true })
  } catch (e) {
    console.log('Failed to create sessions directory:', e)
  }
}

// Load sessions from file
async function loadSessions(): Promise<Map<string, SessionData>> {
  try {
    if (existsSync(SESSION_FILE)) {
      const data = await readFile(SESSION_FILE, 'utf-8')
      const sessions = JSON.parse(data)
      
      // Filter out expired sessions
      const now = Date.now()
      const validSessions = new Map<string, SessionData>()
      
      for (const [sessionId, session] of Object.entries(sessions)) {
        if ((session as SessionData).expiresAt > now) {
          validSessions.set(sessionId, session as SessionData)
        }
      }
      
      // Save back the filtered sessions
      await saveSessions(validSessions)
      return validSessions
    }
  } catch (error) {
    console.log('Failed to load sessions:', error)
  }
  return new Map<string, SessionData>()
}

// Save sessions to file
async function saveSessions(sessions: Map<string, SessionData>): Promise<void> {
  try {
    const sessionsObj = Object.fromEntries(sessions)
    await writeFile(SESSION_FILE, JSON.stringify(sessionsObj, null, 2))
  } catch (error) {
    console.log('Failed to save sessions:', error)
  }
}

// Clean up expired sessions
async function cleanupExpiredSessions(): Promise<void> {
  try {
    const sessions = await loadSessions()
    await saveSessions(sessions) // This already filters expired sessions
  } catch (error) {
    console.log('Failed to cleanup sessions:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie or authorization header
    const sessionId = request.cookies.get('session_id')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      )
    }
    
    // Load sessions from file
    const sessions = await loadSessions()
    const session = sessions.get(sessionId)
    
    if (!session || Date.now() > session.expiresAt) {
      // Clean up expired session
      sessions.delete(sessionId)
      await saveSessions(sessions)
      
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: {
        username: session.username,
        uid: session.uid,
        home: session.home
      },
      session: {
        id: sessionId,
        expiresAt: new Date(session.expiresAt).toISOString(),
        createdAt: new Date(session.expiresAt - 24 * 60 * 60 * 1000).toISOString()
      }
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to create session (used by login route)
export async function createSession(username: string, uid: number, home: string): Promise<string> {
  const sessionId = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString('base64')
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  
  const sessionData: SessionData = {
    username,
    uid,
    home,
    expiresAt
  }
  
  // Load existing sessions, add new session, and save back
  const sessions = await loadSessions()
  sessions.set(sessionId, sessionData)
  await saveSessions(sessions)
  
  return sessionId
}