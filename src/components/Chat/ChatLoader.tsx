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
      className="group border-b border-black/10 bg-gray-50 text-gray-800 border-adaptive/50 bg-adaptive dark:text-gray-100"
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className="min-w-[40px] items-end">
          <LoadingIcon size={30} className={`${color} animate-pulse`} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`${montserrat_paragraph.variable} font-montserratParagraph text-sm ${color}`}>
            {text}
          </span>
          <span className="mt-1 animate-pulse cursor-default">▍</span>
        </div>
      </div>
    </div>
  )
}
