import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface SystemSettings {
  siteName: string
  siteUrl: string
  adminEmail: string
  sessionTimeout: number
  maxLoginAttempts: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expireDays: number
  }
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    alertThresholds: {
      cpu: number
      memory: number
      disk: number
    }
  }
  monitoring: {
    interval: number
    retentionDays: number
    enableRealTime: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    primaryColor: string
    language: string
  }
}

const defaultSettings: SystemSettings = {
  siteName: 'Infrastructure Manager',
  siteUrl: 'https://localhost:3000',
  adminEmail: 'admin@system.com',
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expireDays: 90
  },
  notifications: {
    emailEnabled: true,
    pushEnabled: true,
    alertThresholds: {
      cpu: 80,
      memory: 85,
      disk: 90
    }
  },
  monitoring: {
    interval: 5,
    retentionDays: 30,
    enableRealTime: true
  },
  appearance: {
    theme: 'auto',
    primaryColor: '#3b82f6',
    language: 'en'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all settings from database
    const settings = await db.setting.findMany({
      orderBy: { category: 'asc' }
    })

    // Convert settings array to object
    const settingsObj: any = {}
    settings.forEach(setting => {
      try {
        settingsObj[setting.key] = JSON.parse(setting.value)
      } catch {
        settingsObj[setting.key] = setting.value
      }
    })

    // Merge with defaults for missing settings
    const mergedSettings = mergeWithDefaults(settingsObj)

    return NextResponse.json({
      success: true,
      data: mergedSettings,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to fetch settings:', error)
    
    // Return default settings if database fails
    return NextResponse.json({
      success: true,
      data: defaultSettings,
      timestamp: new Date().toISOString(),
      warning: 'Using default settings due to database error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    switch (action) {
      case 'update':
        return await updateSettings(data)
      
      case 'reset':
        return await resetSettings()
      
      case 'export':
        return await exportSettings()
      
      case 'import':
        return await importSettings(data)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to perform settings action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform settings action' },
      { status: 500 }
    )
  }
}

async function updateSettings(settingsData: any) {
  try {
    const updates = []

    // Flatten nested settings for database storage
    for (const [key, value] of Object.entries(settingsData)) {
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        for (const [subKey, subValue] of Object.entries(value as any)) {
          const fullKey = `${key}.${subKey}`
          updates.push({
            key: fullKey,
            value: JSON.stringify(subValue),
            category: key
          })
        }
      } else {
        // Handle simple values
        updates.push({
          key,
          value: JSON.stringify(value),
          category: 'general'
        })
      }
    }

    // Update or create settings in database
    for (const update of updates) {
      await db.setting.upsert({
        where: { key: update.key },
        update: {
          value: update.value,
          category: update.category
        },
        create: {
          key: update.key,
          value: update.value,
          category: update.category
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

async function resetSettings() {
  try {
    // Clear all settings
    await db.setting.deleteMany()

    // Reset to defaults
    const updates = []

    for (const [key, value] of Object.entries(defaultSettings)) {
      if (typeof value === 'object' && value !== null) {
        for (const [subKey, subValue] of Object.entries(value as any)) {
          const fullKey = `${key}.${subKey}`
          updates.push({
            key: fullKey,
            value: JSON.stringify(subValue),
            category: key
          })
        }
      } else {
        updates.push({
          key,
          value: JSON.stringify(value),
          category: 'general'
        })
      }
    }

    for (const update of updates) {
      await db.setting.create({
        data: update
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings reset to defaults successfully'
    })

  } catch (error) {
    console.error('Failed to reset settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset settings' },
      { status: 500 }
    )
  }
}

async function exportSettings() {
  try {
    const settings = await db.setting.findMany()
    
    const settingsObj: any = {}
    settings.forEach(setting => {
      try {
        settingsObj[setting.key] = JSON.parse(setting.value)
      } catch {
        settingsObj[setting.key] = setting.value
      }
    })

    const mergedSettings = mergeWithDefaults(settingsObj)

    return NextResponse.json({
      success: true,
      data: {
        settings: mergedSettings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    })

  } catch (error) {
    console.error('Failed to export settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export settings' },
      { status: 500 }
    )
  }
}

async function importSettings(importData: any) {
  try {
    const { settings } = importData

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid settings data'
      }, { status: 400 })
    }

    // Validate settings structure
    const validatedSettings = validateSettings(settings)

    // Update settings
    await updateSettings(validatedSettings)

    return NextResponse.json({
      success: true,
      message: 'Settings imported successfully'
    })

  } catch (error) {
    console.error('Failed to import settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import settings' },
      { status: 500 }
    )
  }
}

function mergeWithDefaults(settingsObj: any): SystemSettings {
  const result: any = { ...defaultSettings }

  // Helper function to deep merge
  function deepMerge(target: any, source: any) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {}
        deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
    return target
  }

  // Handle nested keys (e.g., "passwordPolicy.minLength")
  for (const [key, value] of Object.entries(settingsObj)) {
    if (key.includes('.')) {
      const [category, subKey] = key.split('.')
      if (!result[category]) result[category] = {}
      result[category][subKey] = value
    } else {
      result[key] = value
    }
  }

  return result as SystemSettings
}

function validateSettings(settings: any): SystemSettings {
  // Basic validation - ensure all required fields exist
  const validated = mergeWithDefaults(settings)
  
  // Validate numeric ranges
  if (validated.sessionTimeout < 1 || validated.sessionTimeout > 1440) {
    throw new Error('Session timeout must be between 1 and 1440 minutes')
  }
  
  if (validated.maxLoginAttempts < 1 || validated.maxLoginAttempts > 10) {
    throw new Error('Max login attempts must be between 1 and 10')
  }
  
  if (validated.passwordPolicy.minLength < 4 || validated.passwordPolicy.minLength > 32) {
    throw new Error('Password minimum length must be between 4 and 32 characters')
  }
  
  // Validate alert thresholds
  const thresholds = validated.notifications.alertThresholds
  if (thresholds.cpu < 1 || thresholds.cpu > 100) throw new Error('CPU threshold must be between 1 and 100')
  if (thresholds.memory < 1 || thresholds.memory > 100) throw new Error('Memory threshold must be between 1 and 100')
  if (thresholds.disk < 1 || thresholds.disk > 100) throw new Error('Disk threshold must be between 1 and 100')
  
  // Validate monitoring settings
  if (validated.monitoring.interval < 1 || validated.monitoring.interval > 3600) {
    throw new Error('Monitoring interval must be between 1 and 3600 seconds')
  }
  
  if (validated.monitoring.retentionDays < 1 || validated.monitoring.retentionDays > 365) {
    throw new Error('Data retention must be between 1 and 365 days')
  }
  
  // Validate theme
  if (!['light', 'dark', 'auto'].includes(validated.appearance.theme)) {
    throw new Error('Invalid theme value')
  }
  
  return validated
}