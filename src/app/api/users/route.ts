import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { ActivityLog } from '@prisma/client'

interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: 'ADMIN' | 'USER' | 'VIEWER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastLogin?: string
  phone?: string
  department?: string
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role !== 'all') {
      where.role = role
    }
    
    if (status !== 'all') {
      where.status = status
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          lastLogin: true,
          phone: true,
          department: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.user.count({ where })
    ])

    // Format users for response
    const formattedUsers: User[] = users.map(user => ({
      ...user,
      role: user.role as 'ADMIN' | 'USER' | 'VIEWER',
      status: user.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      lastLogin: user.lastLogin?.toISOString() || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    switch (action) {
      case 'create':
        return await createUser(data, clientIP, userAgent)
      
      case 'update':
        return await updateUser(data, clientIP, userAgent)
      
      case 'delete':
        return await deleteUser(data, clientIP, userAgent)
      
      case 'change_status':
        return await changeUserStatus(data, clientIP, userAgent)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to perform user action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform user action' },
      { status: 500 }
    )
  }
}

async function createUser(userData: any, clientIP: string, userAgent: string) {
  try {
    const { username, email, fullName, role = 'USER', status = 'ACTIVE', phone, department, password } = userData

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this username or email already exists'
      }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password || 'defaultPassword123', 10)

    // Create user
    const user = await db.user.create({
      data: {
        username,
        email,
        fullName,
        role,
        status,
        phone,
        department,
        passwordHash
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        phone: true,
        department: true,
        createdAt: true
      }
    })

    // Log activity
    await logActivity('CREATE_USER', 'users', `Created user: ${username}`, clientIP, userAgent)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        ...user,
        createdAt: user.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

async function updateUser(userData: any, clientIP: string, userAgent: string) {
  try {
    const { id, username, email, fullName, role, status, phone, department } = userData

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Check for username/email conflicts (excluding current user)
    const conflictUser = await db.user.findFirst({
      where: {
        OR: [
          { username, NOT: { id } },
          { email, NOT: { id } }
        ]
      }
    })

    if (conflictUser) {
      return NextResponse.json({
        success: false,
        error: 'Username or email already in use by another user'
      }, { status: 400 })
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: {
        username,
        email,
        fullName,
        role,
        status,
        phone,
        department
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        phone: true,
        department: true,
        updatedAt: true
      }
    })

    // Log activity
    await logActivity('UPDATE_USER', 'users', `Updated user: ${username}`, clientIP, userAgent)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: {
        ...user,
        updatedAt: user.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

async function deleteUser(userData: any, clientIP: string, userAgent: string) {
  try {
    const { id } = userData

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Don't allow deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete the last active admin user'
        }, { status: 400 })
      }
    }

    // Delete user
    await db.user.delete({
      where: { id }
    })

    // Log activity
    await logActivity('DELETE_USER', 'users', `Deleted user: ${user.username}`, clientIP, userAgent)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

async function changeUserStatus(userData: any, clientIP: string, userAgent: string) {
  try {
    const { id, status } = userData

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Don't allow deactivating the last admin
    if (user.role === 'ADMIN' && status !== 'ACTIVE') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({
          success: false,
          error: 'Cannot deactivate the last active admin user'
        }, { status: 400 })
      }
    }

    // Update user status
    const updatedUser = await db.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        username: true,
        status: true,
        updatedAt: true
      }
    })

    // Log activity
    await logActivity('CHANGE_USER_STATUS', 'users', `Changed status of user ${user.username} to ${status}`, clientIP, userAgent)

    return NextResponse.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        ...updatedUser,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Failed to change user status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change user status' },
      { status: 500 }
    )
  }
}

async function logActivity(action: string, resource: string, details: string, ipAddress: string, userAgent: string) {
  try {
    await db.activityLog.create({
      data: {
        action,
        resource,
        details,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}