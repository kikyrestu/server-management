import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookie or authorization header
    const sessionId = request.cookies.get('session_id')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify session (simplified - in production, use proper session management)
    const { username } = await request.json()
    const { oldPassword, newPassword } = await request.json()
    
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Old password and new password are required' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
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
    
    // Change password using passwd command
    // Note: This requires proper sudo configuration and may need additional setup
    try {
      // This is a simplified approach - in production, you'd want to use a more secure method
      const { stdout, stderr } = await execAsync(
        `echo '${username}:${oldPassword}' | sudo chpasswd`,
        { timeout: 10000 }
      )
      
      if (stderr) {
        console.error('Password change stderr:', stderr)
        return NextResponse.json(
          { success: false, error: 'Failed to change password' },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to change password' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}