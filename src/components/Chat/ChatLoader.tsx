import { IconRobot, IconBrain, IconTool } from '@tabler/icons-react'
import { FC, useContext } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { montserrat_paragraph } from 'fonts'

interface Props { }

export const ChatLoader: FC<Props> = () => {
  const {
    state: { isRouting, isRunningTool, isImg2TextLoading, isRetrievalLoading },
  } = useContext(HomeContext)

  const getLoadingState = () => {
    if (isImg2TextLoading) {
      return { icon: IconBrain, text: 'Processing image...', color: 'text-blue-500' }
    }
    if (isRetrievalLoading) {
      return { icon: IconBrain, text: 'Searching knowledge base...', color: 'text-purple-500' }
    }
    if (isRouting) {
      return { icon: IconBrain, text: 'Thinking...', color: 'text-orange-500' }
    }
    if (isRunningTool) {
      return { icon: IconTool, text: 'Running tools...', color: 'text-green-500' }
    }
    return { icon: IconRobot, text: 'Generating response...', color: 'text-gray-500' }
  }

  const { icon: LoadingIcon, text, color } = getLoadingState()

  return (
    <div
      className="group border-b border-adaptive bg-adaptive text-adaptive"
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="relative flex w-full gap-3 px-4 py-6 text-base md:mx-auto md:max-w-4xl md:px-6">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
          <LoadingIcon size={20} className={`${color} animate-pulse`} />
        </div>
        <div className="flex items-center gap-2 text-adaptive">
          <span className={`${montserrat_paragraph.variable} font-montserratParagraph text-sm ${color}`}>
            {text}
          </span>
          <span className="mt-1 animate-pulse cursor-default text-adaptive">▍</span>
        </div>
      </div>
    </div>
  )
}
