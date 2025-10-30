import { IconCheck, IconClipboard, IconDownload } from '@tabler/icons-react'
import { FC, memo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { useTranslation } from 'next-i18next'

import {
  generateRandomString,
  programmingLanguages,
} from '@/utils/app/codeblock'

interface Props {
  language: string
  value: string
}

export const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { t } = useTranslation('markdown')
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const copyToClipboard = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    })
  }

  const downloadAsFile = () => {
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateRandomString(
      3,
      true,
    )}${fileExtension}`
    const fileName = window.prompt(
      t('Enter file name') || '',
      suggestedFileName,
    )

    if (!fileName) {
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="codeblock relative my-4 overflow-hidden rounded-lg border border-gray-700 bg-[#282c34] font-mono text-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#21252b] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {language}
        </span>

        <div className="flex items-center gap-2">
          <button
            className="flex max-h-8 max-w-fit items-center bg-transparent gap-1.5 rounded px-2 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            onClick={copyToClipboard}
            aria-label={isCopied ? t('Copied!')?.toString() : t('Copy code')?.toString()}
            type="button"
          >
            {isCopied ? <IconCheck size={16} /> : <IconClipboard size={16} />}
            <span>{isCopied ? t('Copied!') : t('Copy code')}</span>
          </button>
          <button
            className="flex max-h-8 max-w-fit items-center bg-transparent gap-1.5 rounded px-2 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            onClick={downloadAsFile}
            aria-label={t('Download')?.toString()}
            type="button"
          >
            <IconDownload size={16} />
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#282c34',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          showLineNumbers={false}
          wrapLines={false}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'