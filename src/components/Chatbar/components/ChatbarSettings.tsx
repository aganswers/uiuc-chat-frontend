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
import { ModelSelect } from './ModelSelect'
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
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const {
    handleClearConversations,
    handleExportData,
    handleApiKeyChange,
    isExporting,
  } = useContext(ChatbarContext)

  return (
    <div className="flex flex-col space-y-1 pt-2">
      {/* Model Selection */}
      <div className="flex w-full items-center gap-3 rounded-md px-3 py-3 min-w-0">
        <IconRobot size={18} className="text-gray-500 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Model
          </span>
          <div className="w-full min-w-0">
            <ModelSelect />
          </div>
        </div>
      </div>

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
