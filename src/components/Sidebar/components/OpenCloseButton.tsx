import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react'

interface Props {
  onClick: any
  side: 'left' | 'right'
}

export const CloseSidebarButton = ({ onClick, side }: Props) => {
  return (
    <>
      <button
        className={`fixed top-20 ${
          side === 'right' ? 'right-[270px]' : 'left-[270px]'
        } z-50 h-8 w-8 rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 flex items-center justify-center`}
        onClick={onClick}
        title={`Hide ${side} sidebar`}
      >
        {side === 'right' ? (
          <IconArrowBarRight size={16} />
        ) : (
          <IconArrowBarLeft size={16} />
        )}
      </button>
      <div
        onClick={onClick}
        className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-50 sm:hidden"
      ></div>
    </>
  )
}

export const OpenSidebarButton = ({ onClick, side }: Props) => {
  return (
    <button
      data-promptbar-open-button={side === 'right' ? 'true' : 'false'}
      className={`fixed top-20 ${
        side === 'right' ? 'right-2' : 'left-2'
      } z-50 h-8 w-8 rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 flex items-center justify-center`}
      onClick={onClick}
      title={`Show ${side} sidebar`}
    >
      {side === 'right' ? (
        <IconArrowBarLeft size={16} />
      ) : (
        <IconArrowBarRight size={16} />
      )}
    </button>
  )
}
