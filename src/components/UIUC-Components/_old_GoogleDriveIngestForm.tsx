import React, { useEffect, useState } from 'react'
import { Text, Card, Button, Loader, Checkbox, Group, Stack } from '@mantine/core'
import { IconArrowRight, IconBrandGoogle, IconFolder, IconFile, IconRefresh } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
import { FileUpload } from './UploadNotification'
import { QueryClient } from '@tanstack/react-query'

type DriveFile = {
  id: string
  name: string
  isFolder: boolean
  mimeType?: string
  modifiedTime?: string
  size?: string
}

type GoogleDriveState = 'disconnected' | 'connecting' | 'connected' | 'browsing' | 'selecting'

export default function GoogleDriveIngestForm({
  project_name,
  setUploadFiles,
}: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  queryClient: QueryClient
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<GoogleDriveState>('disconnected')
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Record<string, DriveFile>>({})
  const [currentFolder, setCurrentFolder] = useState('root')
  const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'My Drive'}])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const connectGoogleDrive = async () => {
    try {
      setState('connecting')
      setError(null)
      
      // Get auth URL
      const authResponse = await fetch('/api/UIUC-api/googleDrive/authUrl')
      if (!authResponse.ok) {
        throw new Error('Failed to get auth URL')
      }
      
      const { url: authUrl } = await authResponse.json()
      
      // Open OAuth popup
      const popup = window.open(authUrl, 'google-oauth', 'width=520,height=680')
      
      // Poll for popup closure
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          // Try to connect to project
          connectToProject()
        }
      }, 1000)
      
    } catch (error) {
      console.error('Connect error:', error)
      setError('Failed to connect to Google Drive')
      setState('disconnected')
    }
  }

  const connectToProject = async () => {
    try {
      const response = await fetch('/api/UIUC-api/googleDrive/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_name: project_name })
      })
      
      if (response.ok) {
        setState('connected')
        loadFiles('root')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to connect to project')
        setState('disconnected')
      }
    } catch (error) {
      console.error('Project connect error:', error)
      setError('Failed to connect to project')
      setState('disconnected')
    }
  }

  const loadFiles = async (folderId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        course_name: project_name,
        folder_id: folderId
      })
      
      const response = await fetch(`/api/UIUC-api/googleDrive/list?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
        setState('browsing')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to load files')
      }
    } catch (error) {
      console.error('Load files error:', error)
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folder: DriveFile) => {
    setCurrentFolder(folder.id)
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }])
    loadFiles(folder.id)
  }

  const navigateUp = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1)
      const parentFolder = newPath[newPath.length - 1]
      if (parentFolder) {
        setFolderPath(newPath)
        setCurrentFolder(parentFolder.id)
        loadFiles(parentFolder.id)
      }
    }
  }

  const toggleFileSelection = (file: DriveFile) => {
    setSelectedFiles(prev => {
      const newSelected = { ...prev }
      if (newSelected[file.id]) {
        delete newSelected[file.id]
      } else {
        newSelected[file.id] = file
      }
      return newSelected
    })
  }

  const pollIngestionStatus = async () => {
    try {
      const response = await fetch(`/api/UIUC-api/googleDrive/ingestionStatus?course_name=${project_name}`)
      
      if (response.ok) {
        const data = await response.json()
        const ingestions = data.ingestions || []
        
        // Update upload file statuses based on ingestion records
        setUploadFiles(prev => 
          prev.map(file => {
            if (file.type !== 'googledrive') return file
            
            const ingestion = ingestions.find((ing: any) => ing.readable_filename === file.name)
            if (ingestion) {
              if (ingestion.status === 'succeeded') {
                return { ...file, status: 'complete' as const }
              } else if (ingestion.status === 'failed') {
                return { ...file, status: 'error' as const, error: ingestion.error_message }
              } else if (ingestion.status === 'queued') {
                return { ...file, status: 'ingesting' as const }
              }
            }
            return file
          })
        )
        
        // Check if all Google Drive files are completed (succeeded or failed)
        setUploadFiles(currentFiles => {
          const driveFiles = currentFiles.filter(f => f.type === 'googledrive')
          const allCompleted = driveFiles.every(f => f.status === 'complete' || f.status === 'error')
          
          if (allCompleted && driveFiles.length > 0 && pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          
          return currentFiles
        })
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }

  const saveSelections = async () => {
    try {
      setLoading(true)
      const selectedItems = Object.values(selectedFiles)
      
      if (selectedItems.length === 0) {
        setOpen(false)
        return
      }

      // Add to upload notifications
      selectedItems.forEach(item => {
        const uploadFile: FileUpload = {
          name: item.name,
          status: 'uploading',
          type: 'googledrive'
        }
        setUploadFiles(prev => [...prev, uploadFile])
      })

      // Call backend to save selections and start sync
      const response = await fetch('/api/UIUC-api/googleDrive/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name: project_name,
          items: selectedItems
        })
      })

      if (response.ok) {
        // Update upload status to ingesting
        selectedItems.forEach(item => {
          setUploadFiles(prev => 
            prev.map(file => 
              file.name === item.name && file.type === 'googledrive'
                ? { ...file, status: 'ingesting' }
                : file
            )
          )
        })
        
        // Start polling for completion status
        const interval = setInterval(pollIngestionStatus, 5000) // Poll every 5 seconds
        setPollingInterval(interval)
        
        setOpen(false)
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to save selections')
      }
    } catch (error) {
      console.error('Save selections error:', error)
      setError('Failed to save selections')
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setState('disconnected')
    setFiles([])
    setSelectedFiles({})
    setCurrentFolder('root')
    setFolderPath([{id: 'root', name: 'My Drive'}])
    setError(null)
    setLoading(false)
    
    // Clean up polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  return (
    <motion.div layout>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <IconBrandGoogle className="h-8 w-8 text-green-600" />
                </div>
                <Text className="text-xl font-semibold text-gray-900">
                  Google Drive
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-gray-600">
              Import content from Google Drive, including documents, sheets,
              presentations, and shared folders.
            </Text>
            <div className="mt-auto flex items-center text-sm text-green-600">
              <span>Connect & Import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto h-auto w-[95%] max-w-4xl !rounded-2xl border-0 bg-white px-4 py-6 text-gray-900 sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-left text-xl font-bold flex items-center gap-2">
              <IconBrandGoogle className="h-6 w-6 text-green-600" />
              Google Drive Integration
            </DialogTitle>
          </DialogHeader>

          <div className="border-t border-gray-200 pt-4">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4">
                <Text className="text-sm text-red-800">{error}</Text>
              </div>
            )}

            {state === 'disconnected' && (
              <div className="text-center py-8">
                <IconBrandGoogle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <Text className="text-lg font-semibold mb-2">Connect Google Drive</Text>
                <Text className="text-gray-600 mb-6">
                  Connect your Google Drive to import documents, sheets, and presentations
                </Text>
                <Button
                  onClick={connectGoogleDrive}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Connect Google Drive
                </Button>
              </div>
            )}

            {state === 'connecting' && (
              <div className="text-center py-8">
                <Loader size="lg" className="mb-4" />
                <Text className="text-lg font-semibold">Connecting to Google Drive...</Text>
                <Text className="text-gray-600">Please complete authentication in the popup window</Text>
              </div>
            )}

            {(state === 'browsing' || state === 'connected') && (
              <div className="space-y-4">
                {/* Breadcrumb navigation */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Path:</span>
                  {folderPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      {index > 0 && <span className="text-gray-400">/</span>}
                      <button
                        onClick={() => {
                          const newPath = folderPath.slice(0, index + 1)
                          setFolderPath(newPath)
                          setCurrentFolder(folder.id)
                          loadFiles(folder.id)
                        }}
                        className="text-green-600 hover:text-green-700 hover:underline"
                      >
                        {folder.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* File list */}
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader />
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {files.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No files found in this folder
                      </div>
                    ) : (
                      <Stack spacing={0}>
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >
                            {file.isFolder ? (
                              <button
                                onClick={() => navigateToFolder(file)}
                                className="flex items-center gap-3 flex-1 text-left"
                              >
                                <IconFolder className="h-5 w-5 text-blue-500" />
                                <span className="font-medium text-blue-600 hover:underline">
                                  {file.name}
                                </span>
                              </button>
                            ) : (
                              <>
                                <Checkbox
                                  checked={!!selectedFiles[file.id]}
                                  onChange={() => toggleFileSelection(file)}
                                />
                                <IconFile className="h-5 w-5 text-gray-500" />
                                <div className="flex-1">
                                  <div className="font-medium">{file.name}</div>
                                  {file.size && (
                                    <div className="text-xs text-gray-500">
                                      {(parseInt(file.size) / 1024 / 1024).toFixed(1)} MB
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </Stack>
                    )}
                  </div>
                )}

                {/* Selection summary */}
                {Object.keys(selectedFiles).length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Text className="font-semibold text-green-800">
                      {Object.keys(selectedFiles).length} files selected
                    </Text>
                    <Text className="text-sm text-green-600">
                      Selected files will be imported and processed for search
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between">
            <div>
              {folderPath.length > 1 && state === 'browsing' && (
                <Button variant="outline" onClick={navigateUp}>
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              {state === 'browsing' && (
                <Button
                  onClick={saveSelections}
                  disabled={Object.keys(selectedFiles).length === 0 || loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Importing...' : `Import ${Object.keys(selectedFiles).length} Files`}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
