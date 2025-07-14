import { IconCheck, IconTrash, IconX } from '@tabler/icons-react'
import { FC, useState } from 'react'

import { useTranslation } from 'next-i18next'

import { SidebarButton } from '@/components/Sidebar/SidebarButton'

interface Props {
  onClearConversations: () => void
}

export const ClearConversations: FC<Props> = ({ onClearConversations }) => {
  const [isConfirming, setIsConfirming] = useState<boolean>(false)

  const { t } = useTranslation('sidebar')

  const handleClearConversations = () => {
    onClearConversations()
    setIsConfirming(false)
  }

  return isConfirming ? (
    <div className="flex w-full cursor-pointer items-center rounded-md px-3 py-3 text-gray-700 hover:bg-gray-50">
      <IconTrash size={18} className="text-gray-500" />

      <div className="ml-3 flex-1 text-left text-sm leading-3">
        {t('Are you sure?')}
      </div>

      <div className="flex w-[40px]">
        <IconCheck
          className="ml-auto mr-1 min-w-[20px] cursor-pointer text-gray-400 hover:text-green-600"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            handleClearConversations()
          }}
        />

        <IconX
          className="ml-auto min-w-[20px] cursor-pointer text-gray-400 hover:text-red-600"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            setIsConfirming(false)
          }}
        />
      </div>
    </div>
  ) : (
    <SidebarButton
      text={t('Clear conversations')}
      icon={<IconTrash size={18} />}
      onClick={() => setIsConfirming(true)}
    />
  )
}
