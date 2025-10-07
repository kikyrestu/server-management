"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Server, LogIn } from "lucide-react"

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onLogin({ username, password })
      // Parent will handle the actual login logic
      setUsername('')
      setPassword('')
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Server className="h-12 w-12 text-primary" />
              <Shield className="h-6 w-6 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Infrastructure Management</h1>
          <p className="text-muted-foreground">Secure access with PAM authentication</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LogIn className="h-5 w-5" />
              <span>System Login</span>
            </CardTitle>
            <CardDescription>
              Enter your system credentials to access the infrastructure management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your system username"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your system password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-xs text-muted-foreground">
              <div className="space-y-1">
                <p>• Authentication uses PAM (Pluggable Authentication Modules)</p>
                <p>• Your system credentials are required</p>
                <p>• Sessions are secure and automatically expire</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}