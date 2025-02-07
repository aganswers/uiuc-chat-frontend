import { IconArrowBarRight } from '@tabler/icons-react'
import { ContextWithMetadata } from '~/types/chat'
import { Text } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useRouter } from 'next/router'
import { useEffect, useContext } from 'react'
import { CitationCard } from './CitationCard'
import HomeContext from '~/pages/api/home/home.context'

interface Props {
  isOpen: boolean
  contexts: ContextWithMetadata[]
  onClose: () => void
  hideRightSidebarIcon?: () => boolean
  courseName: string
  /**
   * Optional list of one‐based citation indices (as extracted from the in–line
   * message via your citation replacement logic) that determine which sources were cited.
   * For example, [1,3] means that contexts at positions 0 and 2 (i.e. citation 1 and 3)
   * were cited.
   */
  citedSourceIndices?: number[]
}

const SourcesSidebar = ({
  isOpen,
  contexts,
  onClose,
  hideRightSidebarIcon,
  courseName,
  citedSourceIndices,
}: Props) => {
  const router = useRouter()
  const { dispatch: homeDispatch } = useContext(HomeContext)

  // New effect: Close the promptbar when sources sidebar is opened
  useEffect(() => {
    if (isOpen) {
      homeDispatch({ field: 'showPromptbar', value: false })
    }
  }, [isOpen, homeDispatch])

  // Modified effect: Always hide both promptbar icons when SourcesSidebar is open
  useEffect(() => {
    const hideElements = () => {
      // Hide all instances of the icon in the navbar
      const rightSidebarIcons = document.querySelectorAll('[data-right-sidebar-icon]')
      rightSidebarIcons.forEach(icon => {
        icon.classList.add('hidden')
      })

      // Hide all instances of the open sidebar button for right promptbar
      const openSidebarBtns = document.querySelectorAll('[data-promptbar-open-button="true"]')
      openSidebarBtns.forEach(btn => {
        btn.classList.add('hidden')
      })

      // Ensure the margin stays consistent during transition
      const mainContent = document.querySelector('.overflow-wrap')
      if (mainContent) {
        mainContent.classList.add('maintain-margin')
      }
    }

    if (isOpen) {
      // Initial hide
      hideElements()

      // Set up an interval to keep checking and hiding the elements
      // This ensures they stay hidden even if the DOM updates
      const intervalId = setInterval(hideElements, 100)

      return () => {
        clearInterval(intervalId)
        // Show the icons in the navbar
        const rightSidebarIcons = document.querySelectorAll('[data-right-sidebar-icon]')
        rightSidebarIcons.forEach(icon => {
          icon.classList.remove('hidden')
        })

        // Show the open sidebar buttons
        const openSidebarBtns = document.querySelectorAll('[data-promptbar-open-button="true"]')
        openSidebarBtns.forEach(btn => {
          btn.classList.remove('hidden')
        })

        // Remove the maintain-margin class after a short delay
        setTimeout(() => {
          const mainContent = document.querySelector('.overflow-wrap')
          if (mainContent) {
            mainContent.classList.remove('maintain-margin')
          }
        }, 200) // Match this with the transition duration
      }
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
    const query = new URLSearchParams(window.location.search)
    if (query.get('rightSidebar') === 'true') {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('rightSidebar', 'true')
      router.replace(newUrl.pathname + newUrl.search)
    }
  }

  const getReadableFilename = (context: ContextWithMetadata): string => {
    console.log('Getting readable filename for context:', {
      readable_filename: context.readable_filename,
      s3_path: context.s3_path,
      url: context.url,
    })
    return context.readable_filename || 'Unknown'
  }

  // Group contexts so that any source cited (as per citedSourceIndices) is rendered first
  const renderContent = () => {
    if (!contexts?.length) {
      return (
        <div className="mt-8 select-none text-center text-white opacity-50">
          <span className={`text-sm ${montserrat_paragraph.variable} font-montserratParagraph`}>
            No sources available.
          </span>
        </div>
      )
    }

    let citedContexts: { context: ContextWithMetadata; displayIndex: number }[] = []
    let remainingContexts: { context: ContextWithMetadata; displayIndex: number }[] = []

    if (citedSourceIndices && citedSourceIndices.length > 0) {
      const uniqueCited = Array.from(new Set(citedSourceIndices))
      const citedSet = new Set(uniqueCited)
      citedContexts = uniqueCited
        .map(citationNum => {
          const ctx = contexts[citationNum - 1]
          return ctx ? { context: ctx, displayIndex: citationNum } : null
        })
        .filter((item): item is { context: ContextWithMetadata; displayIndex: number } => item !== null)

      remainingContexts = contexts
        .map((ctx, idx) => ({ context: ctx, displayIndex: idx + 1 }))
        .filter(item => !citedSet.has(item.displayIndex))
    } else {
      // If no citations, show all sources in a single section
      remainingContexts = contexts.map((ctx, idx) => ({ context: ctx, displayIndex: idx + 1 }))
    }

    return (
      <div className="flex flex-col">
        {citedContexts.length > 0 && (
          <div>
            <div className="sticky top-0 z-10 bg-[#131426] border-b border-white/10 px-4 py-3">
              <Text
                className={`text-sm font-semibold uppercase tracking-wider text-white/60 ${montserrat_heading.variable} font-montserratHeading`}
              >
                Citations {citedContexts.length === contexts.length && '(All Sources)'}
              </Text>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {citedContexts.map(({ context, displayIndex }) => (
                <div key={`cited-${displayIndex}`} className="w-full">
                  <CitationCard
                    readable_filename={getReadableFilename(context)}
                    course_name={courseName}
                    s3_path={context.s3_path}
                    url={context.url}
                    page_number={context.pagenumber}
                    pagenumber={context.pagenumber}
                    pagenumber_or_timestamp={context.pagenumber_or_timestamp}
                    index={displayIndex - 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {remainingContexts.length > 0 && (
          <div>
            <div className="sticky top-0 z-10 bg-[#131426] border-b border-white/10 px-4 py-3">
              <Text
                className={`text-sm font-semibold uppercase tracking-wider text-white/60 ${montserrat_heading.variable} font-montserratHeading`}
              >
                {citedContexts.length === 0 ? 'All Sources' : 'More Sources'}
              </Text>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {remainingContexts.map(({ context, displayIndex }) => (
                <div key={`remaining-${displayIndex}`} className="w-full">
                  <CitationCard
                    readable_filename={getReadableFilename(context)}
                    course_name={courseName}
                    s3_path={context.s3_path}
                    url={context.url}
                    page_number={context.pagenumber}
                    pagenumber={context.pagenumber}
                    pagenumber_or_timestamp={context.pagenumber_or_timestamp}
                    index={displayIndex - 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return isOpen ? (
    <>
      <div className="fixed right-0 top-0 bottom-0 z-40 flex h-screen w-[260px] flex-col bg-[#131426] shadow-lg">
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        <button
          className={`fixed top-5 right-[270px] z-50 h-7 w-7 hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-0.5 sm:h-8 sm:w-8 sm:text-neutral-700`}
          onClick={handleClose}
        >
          <IconArrowBarRight />
        </button>
      </div>

      <style jsx global>{`
        .overflow-wrap {
          margin-right: ${isOpen ? '260px' : '0'};
          transition: margin-right 0.2s ease-in-out;
        }
        .maintain-margin {
          margin-right: 260px !important;
        }
      `}</style>
    </>
  ) : null
}

export default SourcesSidebar 