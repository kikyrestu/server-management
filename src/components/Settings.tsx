"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database,
  Bell,
  Shield,
  Monitor,
  Palette,
  Globe,
  Server,
  Wifi,
  Key
} from "lucide-react"

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

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(data.data)
        } else {
          console.error('API error:', data.error)
          // Use default settings if API fails
          setSettings(defaultSettings)
        }
      } else {
        throw new Error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use default settings
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (path: string[], value: any) => {
    if (!settings) return
    
    setSettings(prev => {
      if (!prev) return prev
      const newSettings = { ...prev }
      let current: any = newSettings
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return newSettings
    })
    setHasChanges(true)
  }

  const saveSettings = async () => {
    if (!settings) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update', ...settings }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setHasChanges(false)
        } else {
          alert('Failed to save settings: ' + result.error)
        }
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'reset' }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            fetchSettings()
            setHasChanges(false)
          } else {
            alert('Failed to reset settings: ' + result.error)
          }
        } else {
          alert('Failed to reset settings')
        }
      } catch (error) {
        console.error('Failed to reset settings:', error)
        alert('Failed to reset settings')
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" onClick={resetSettings} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveSettings} disabled={!hasChanges || loading || !settings}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {loading || !settings ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Name</label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => updateSetting(['siteName'], e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Site URL</label>
                    <Input
                      value={settings.siteUrl}
                      onChange={(e) => updateSetting(['siteUrl'], e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Email</label>
                    <Input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) => updateSetting(['adminEmail'], e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                    <Input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting(['sessionTimeout'], parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => updateSetting(['maxLoginAttempts'], parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Password Policy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Minimum Length</label>
                      <Input
                        type="number"
                        value={settings.passwordPolicy.minLength}
                        onChange={(e) => updateSetting(['passwordPolicy', 'minLength'], parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Expire After (days)</label>
                      <Input
                        type="number"
                        value={settings.passwordPolicy.expireDays}
                        onChange={(e) => updateSetting(['passwordPolicy', 'expireDays'], parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Require Uppercase</label>
                      <Switch
                        checked={settings.passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) => updateSetting(['passwordPolicy', 'requireUppercase'], checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Require Numbers</label>
                      <Switch
                        checked={settings.passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) => updateSetting(['passwordPolicy', 'requireNumbers'], checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Require Special Characters</label>
                      <Switch
                        checked={settings.passwordPolicy.requireSpecialChars}
                        onCheckedChange={(checked) => updateSetting(['passwordPolicy', 'requireSpecialChars'], checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Email Notifications</label>
                      <Switch
                        checked={settings.notifications.emailEnabled}
                        onCheckedChange={(checked) => updateSetting(['notifications', 'emailEnabled'], checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Push Notifications</label>
                      <Switch
                        checked={settings.notifications.pushEnabled}
                        onCheckedChange={(checked) => updateSetting(['notifications', 'pushEnabled'], checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-3">Alert Thresholds (%)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">CPU Usage</label>
                      <Input
                        type="number"
                        value={settings.notifications.alertThresholds.cpu}
                        onChange={(e) => updateSetting(['notifications', 'alertThresholds', 'cpu'], parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Memory Usage</label>
                      <Input
                        type="number"
                        value={settings.notifications.alertThresholds.memory}
                        onChange={(e) => updateSetting(['notifications', 'alertThresholds', 'memory'], parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Disk Usage</label>
                      <Input
                        type="number"
                        value={settings.notifications.alertThresholds.disk}
                        onChange={(e) => updateSetting(['notifications', 'alertThresholds', 'disk'], parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Monitor className="w-5 h-5 mr-2" />
                    Monitoring Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Monitoring Interval (seconds)</label>
                      <Input
                        type="number"
                        value={settings.monitoring.interval}
                        onChange={(e) => updateSetting(['monitoring', 'interval'], parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Data Retention (days)</label>
                      <Input
                        type="number"
                        value={settings.monitoring.retentionDays}
                        onChange={(e) => updateSetting(['monitoring', 'retentionDays'], parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Real-time Monitoring</label>
                      <Switch
                        checked={settings.monitoring.enableRealTime}
                        onCheckedChange={(checked) => updateSetting(['monitoring', 'enableRealTime'], checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Theme</label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => updateSetting(['appearance', 'theme'], e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Color</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={settings.appearance.primaryColor}
                          onChange={(e) => updateSetting(['appearance', 'primaryColor'], e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.appearance.primaryColor}
                          onChange={(e) => updateSetting(['appearance', 'primaryColor'], e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => updateSetting(['appearance', 'language'], e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
            )}
        </CardContent>
      </Card>
    </div>
  )
}