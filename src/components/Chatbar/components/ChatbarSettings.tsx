import { IconFileExport, IconSettings, IconRobot } from '@tabler/icons-react'
import { useContext, useState } from 'react'

import { useTranslation } from 'next-i18next'

import HomeContext from '~/pages/api/home/home.context'

import { SettingDialog } from '@/components/Settings/SettingDialog'

import { Import } from '../../Settings/Import'
import { Key } from '../../Settings/Key'
import { SidebarButton } from '../../Sidebar/SidebarButton'
import ChatbarContext from '../Chatbar.context'
import { ClearConversations } from './ClearConversations'
import { selectBestModel } from '~/utils/modelProviders/LLMProvider'
import { UserSettings } from '../../Chat/UserSettings'
// import { PluginKeys } from './PluginKeys'

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar')
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false)

  const {
    state: {
      apiKey,
      lightMode,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
      showModelSettings,
      llmProviders,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const {
    handleClearConversations,
    handleExportData,
    handleApiKeyChange,
    isExporting,
  } = useContext(ChatbarContext)

  const currentModel = selectBestModel(llmProviders)

  return (
    <div className="flex flex-col space-y-1 pt-2">
      {/* Model Selection Button */}
      <button
        onClick={() => {
          homeDispatch({
            field: 'showModelSettings',
            value: !showModelSettings,
          })
        }}
        className="flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-3 py-3 text-sm leading-3 text-gray-700 transition-colors duration-200 hover:bg-gray-50"
      >
        <IconRobot size={18} className="text-gray-500" />
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Model
          </span>
          <span className="w-full truncate text-sm font-medium text-gray-900">
            {currentModel?.name || 'Select Model'}
          </span>
        </div>
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Model Settings Panel */}
      {showModelSettings && (
        <div className="border-t border-gray-200 pt-2">
          <UserSettings />
        </div>
      )}

      {conversations.length > 0 ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <SidebarButton
        text={t('Export history')}
        icon={<IconFileExport size={18} />}
        onClick={() => handleExportData()}
        loading={isExporting}
      />

      {!serverSideApiKeyIsSet ? (
        <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      ) : null}

      {/* {!serverSidePluginKeysSet ? <PluginKeys /> : null} */}

      {/* Deprecate settings button for now... */}
      {/* <SidebarButton
        text={t('Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      /> */}
      {/* <SettingDialog
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false)
        }}
      /> */}
    </div>
  )
}
