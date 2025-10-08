"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  HardDrive, 
  Upload, 
  Download,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Move,
  ArrowLeft,
  Search,
  MoreHorizontal
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

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

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    loadDirectory(currentPath)
  }, [currentPath])

  const loadDirectory = async (path: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.data.files || [])
      }
    } catch (error) {
      console.error('Failed to load directory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileAction = async (action: string, path: string, params?: any) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, path, ...params }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result.message)
        loadDirectory(currentPath) // Refresh directory
      }
    } catch (error) {
      console.error('Failed to perform file action:', error)
    }
  }

  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSelectedItems([])
  }

  const navigateUp = () => {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
    navigateTo(parentPath)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelection = (path: string) => {
    setSelectedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    )
  }

  const handleCreate = (type: 'file' | 'directory') => {
    const name = prompt(`Enter ${type} name:`)
    if (name) {
      handleFileAction('create', currentPath, { name, type })
    }
  }

  const handleDelete = () => {
    if (selectedItems.length === 0) return
    if (confirm(`Delete ${selectedItems.length} item(s)?`)) {
      selectedItems.forEach(path => {
        handleFileAction('delete', path)
      })
      setSelectedItems([])
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>File Manager</CardTitle>
            <CardDescription>Browse and manage files across your systems</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleCreate('directory')}>
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCreate('file')}>
              <FileText className="w-4 h-4 mr-2" />
              New File
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={selectedItems.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedItems.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Navigation Bar */}
        <div className="flex items-center space-x-2 mb-4 p-2 bg-muted rounded-lg">
          <Button variant="ghost" size="sm" onClick={navigateUp} disabled={currentPath === '/'}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 flex items-center space-x-1 text-sm">
            <span className="text-muted-foreground">Path:</span>
            <span className="font-mono">{currentPath}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No files found matching your search.' : 'This directory is empty.'}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.path}
                className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer ${
                  selectedItems.includes(file.path) ? 'bg-muted' : ''
                }`}
                onClick={() => toggleSelection(file.path)}
                onDoubleClick={() => {
                  if (file.type === 'directory') {
                    navigateTo(file.path)
                  }
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {file.type === 'directory' ? (
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.type === 'directory' ? 'Folder' : 'File'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.modified)}</span>
                      <span className="font-mono">{file.permissions}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFileAction('download', file.path)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newName = prompt('Enter new name:', file.name)
                        if (newName) handleFileAction('rename', file.path, { newName })
                      }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const destination = prompt('Enter destination path:', currentPath)
                        if (destination) handleFileAction('copy', file.path, { destination })
                      }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const newLocation = prompt('Enter new location:', currentPath)
                        if (newLocation) handleFileAction('move', file.path, { newLocation })
                      }}>
                        <Move className="w-4 h-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleFileAction('delete', file.path)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div>
            {filteredFiles.length} item(s) • {selectedItems.length} selected
          </div>
          <div>
            Total size: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}