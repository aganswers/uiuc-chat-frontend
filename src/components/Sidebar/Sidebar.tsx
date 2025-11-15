import { IconFolderPlus, IconPlus } from '@tabler/icons-react'
import { ReactNode } from 'react'
import { useTranslation } from 'next-i18next'

import Search from '../Search'
import { CloseSidebarButton } from './components/OpenCloseButton'

interface Props<T> {
  isOpen: boolean
  addItemButtonTitle: string
  side: 'left' | 'right'
  items: T[]
  itemComponent: ReactNode
  folderComponent: ReactNode
  footerComponent: ReactNode
  searchTerm: string
  handleSearchTerm: (searchTerm: string) => void
  toggleOpen: () => void
  handleCreateItem: () => void
  handleCreateFolder: () => void
  handleDrop: (e: any) => void
  folders: any[]
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  folders,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
  onScroll,
}: Props<T>) => {
  const { t } = useTranslation('promptbar')

  const allowDrop = (e: any) => {
    e.preventDefault()
  }

  const highlightDrop = (e: any) => {
    e.target.style.background = '#f3f4f6'
  }

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none'
  }

  return isOpen ? (
    <div>
      <CloseSidebarButton onClick={toggleOpen} side={side} />
      <div
        className={`fixed top-16 ${side}-0 z-40 flex h-[calc(100vh-4rem)] w-[260px] flex-none flex-col space-y-2 border-r border-gray-200 bg-white p-4 text-sm transition-all sm:relative sm:top-0 sm:h-full`}
      >
        {/* Header with New Chat and New Folder buttons */}
        <div className="flex items-center gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50"
            onClick={() => {
              handleCreateItem()
              handleSearchTerm('')
              setTimeout(() => {
                const chatInput = document.querySelector(
                  'textarea.chat-input',
                ) as HTMLTextAreaElement
                if (chatInput) {
                  chatInput.focus()
                }
              }, 100)
            }}
          >
            <IconPlus size={16} />
            <span className="text-sm font-medium">{addItemButtonTitle}</span>
          </button>

          <button
            className="flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50"
            onClick={handleCreateFolder}
          >
            <IconFolderPlus size={16} />
          </button>
        </div>

        {/* Search */}
        <Search
          placeholder={t('Search...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto" onScroll={onScroll}>
          <div
            className="flex flex-col gap-1"
            onDrop={handleDrop}
            onDragOver={allowDrop}
            onDragEnter={highlightDrop}
            onDragLeave={removeHighlight}
          >
            {folderComponent}
            {itemComponent}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-2">{footerComponent}</div>
      </div>
    </div>
  ) : (
    <></>
  )
}

export default Sidebar
