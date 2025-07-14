import React, { useEffect, useState } from 'react'
import { Text, Card, Button, Input } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
// import { Checkbox } from '@radix-ui/react-checkbox'
import NextLink from 'next/link'
import Image from 'next/image'
export default function CourseraIngestForm(): JSX.Element {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [url, setUrl] = useState('')
  const [maxUrls, setMaxUrls] = useState('50')
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
    return regex.test(input)
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  const handleIngest = () => {
    setOpen(false)
    if (url.includes('coursera.org')) {
      // TODO: coursera ingest
      alert(
        'Coursera ingest is not yet automated (auth is hard). Please email kvday2@illinois.edu to do it for you',
      )
    }
  }
  // if (isLoading) {
  //   return <Skeleton height={200} width={330} radius={'lg'} />
  // }

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
            setMaxUrls('50')
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
                  <Image
                    src="/media/coursera_logo_cutout.png"
                    alt="Coursera Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <Text className="text-xl font-semibold text-gray-900">
                  Coursera
                </Text>
              </div>
            </div>
            <Text className="mb-4 text-sm leading-relaxed text-gray-600">
              Import content from Coursera courses, including lectures,
              assignments, and course materials.
            </Text>
            <div className="mt-auto flex items-center text-sm text-orange-400">
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
              Ingest Coursera Course
            </DialogTitle>
          </DialogHeader>
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-4">
              <div>
                <div className="break-words text-sm sm:text-base">
                  <strong>For Coursera</strong>, just enter a URL like{' '}
                  <code className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 font-mono text-xs sm:text-sm">
                    coursera.org/learn/COURSE_NAME
                  </code>
                  , for example:{' '}
                  <span className="break-all text-orange-600">
                    <NextLink
                      target="_blank"
                      rel="noreferrer"
                      href={'https://www.coursera.org/learn/machine-learning'}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      https://www.coursera.org/learn/machine-learning
                    </NextLink>
                  </span>
                  .
                </div>
                <div className="py-3"></div>
                <Input
                  icon={
                    <Image
                      src="/media/coursera_logo_cutout.png"
                      alt="Coursera Logo"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  }
                  className="w-full rounded-full"
                  styles={{
                    input: {
                      backgroundColor: '#f9fafb',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      '&:focus': {
                        borderColor: '#ea580c',
                      },
                    },
                    wrapper: {
                      width: '100%',
                    },
                  }}
                  placeholder="Enter URL..."
                  radius="xl"
                  type="url"
                  value={url}
                  size="lg"
                  onChange={(e) => {
                    handleUrlChange(e)
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-2">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-orange-600 text-gray-900 transition-colors hover:bg-orange-700"
            >
              Ingest Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
