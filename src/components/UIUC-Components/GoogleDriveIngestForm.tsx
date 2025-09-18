import React, { useEffect, useState } from 'react'
import { Text, Card, Button, Input } from '@mantine/core'
import { IconArrowRight, IconBrandGoogle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
import NextLink from 'next/link'
import { FileUpload } from './UploadNotification'
import { QueryClient } from '@tanstack/react-query'

export default function GoogleDriveIngestForm({
  project_name,
  setUploadFiles,
}: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  queryClient: QueryClient
}): JSX.Element {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }

  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/drive\.google\.com\/.*/
    return regex.test(input)
  }

  const handleIngest = () => {
    setOpen(false)
    if (isUrlValid) {
      const newFile: FileUpload = {
        name: url,
        status: 'uploading',
        type: 'googledrive',
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])
      setUploadFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.name === url ? { ...file, status: 'ingesting' } : file,
        ),
      )
      // TODO: Implement Google Drive integration
      console.log('Google Drive integration coming soon!')
    } else {
      alert('Invalid URL (please include https://)')
    }
  }

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  return (
    <motion.div layout>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setUrl('')
            setIsUrlValid(false)
            setIsUrlUpdated(false)
          }
        }}
      >
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-900/30">
                  <IconBrandGoogle className="h-8 w-8" />
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
            <div className="mt-auto flex items-center text-sm text-green-400">
              <span>Configure import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto h-auto w-[95%] max-w-2xl !rounded-2xl border-0 bg-white px-4 py-6 text-gray-900 sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-left text-xl font-bold">
              Ingest Google Drive Content
            </DialogTitle>
          </DialogHeader>
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-4">
              <div>
                <div className="break-words text-sm sm:text-base">
                  <strong>For Google Drive</strong>, enter a Google Drive URL
                  like{' '}
                  <code className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 font-mono text-xs sm:text-sm">
                    drive.google.com/drive/folders/...
                  </code>{' '}
                  , for example:{' '}
                  <span className="break-all text-green-600">
                    <NextLink
                      target="_blank"
                      rel="noreferrer"
                      href={
                        'https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL'
                      }
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL
                    </NextLink>
                  </span>
                  .
                </div>
                <div className="py-3"></div>
                <Input
                  icon={
                    <IconBrandGoogle className="h-8 w-8" />
                  }
                  className="w-full rounded-full"
                  styles={{
                    input: {
                      backgroundColor: '#f9fafb',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      '&:focus': {
                        borderColor: '#16a34a',
                      },
                    },
                    wrapper: {
                      width: '100%',
                    },
                  }}
                  placeholder="Enter Google Drive URL..."
                  radius="xl"
                  type="url"
                  value={url}
                  size="lg"
                  onChange={(e) => {
                    handleUrlChange(e)
                  }}
                />
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <Text className="text-sm text-green-800">
                  <strong>Coming Soon:</strong> Google Drive integration is currently in development. 
                  This feature will allow you to import documents, sheets, presentations, and shared folders 
                  directly from your Google Drive.
                </Text>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-2">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-green-600 text-white transition-colors hover:bg-green-700"
            >
              Ingest Google Drive Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
