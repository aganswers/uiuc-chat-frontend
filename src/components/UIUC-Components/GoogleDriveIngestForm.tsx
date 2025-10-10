import React, { useState } from 'react'
import { Text, Card, Button, Alert } from '@mantine/core'
import { IconArrowRight, IconBrandGoogle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'

export default function GoogleDriveIngestForm({
  group_email,
}: {
  group_email: string | null
}): JSX.Element {
  const [open, setOpen] = useState(false)

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
            {group_email ? (
              <>
                <p className="text-gray-600">
                  To give this project's agent access to the right Google Drive files,
                  please share them directly with the secret project email below:
                </p>

                <div className="rounded-xl border border-dashed border-indigo-400 bg-indigo-50 p-4 m-4">
                  <p className="text-lg font-mono font-semibold text-indigo-700 break-all text-center">
                    {group_email}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 m-4">
                <p className="text-sm text-yellow-800 text-center">
                  Loading project email...
                </p>
              </div>
            )}

            <ol className="text-left text-gray-700 space-y-2 list-decimal list-inside">
              <li>Open the file or folder in Google Drive.</li>
              <li>Click <span className="font-semibold">Share</span>.</li>
              <li>Paste the email above and give it <span className="font-semibold">Viewer</span> or <span className="font-semibold text-red-400">Editor</span> access.</li>
              <li>Click <span className="font-semibold">Send</span>.</li>
            </ol>

            <Alert
              color="yellow"
              radius="md"
              className="mb-2 mt-4"
              icon={<span className="text-lg">⚠️</span>}
              styles={{
                root: { background: '#fef9c3', color: '#854d0e', border: 'none' },
                title: { fontWeight: 600 },
              }}
            >
              Files are only visible to agents when shared to this project’s email. They will not be accessible to other projects.
            </Alert>
            <Alert
              color="red"
              radius="md"
              icon={<span className="text-lg">🚫</span>}
              styles={{
                root: { background: '#fee2e2', color: '#991b1b', border: 'none' },
                title: { fontWeight: 600 },
              }}
            >
              Do not share this email: Files shared with this email will be integrated into this project's agent.
            </Alert>
          </div>
          {/* Action buttons */}
          <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
