import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconInfoCircle } from '@tabler/icons-react'
import { DocGroupsTable } from './DocGroupsTable'

function DocumentGroupsCard({ course_name }: { course_name: string }) {
  const [accordionOpened, setAccordionOpened] = useState(false)

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Document Groups
            </h2>
            <button
              onClick={() => setAccordionOpened(!accordionOpened)}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="More info on document groups"
            >
              <IconInfoCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence>
          {accordionOpened && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="mb-3 text-gray-700">
                  Document Groups help you organize and control your content:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 font-medium text-blue-600">•</span>
                    <span>
                      <strong>Organize</strong> documents into clear categories
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-medium text-blue-600">•</span>
                    <span>
                      <strong>Enable/disable</strong> groups to control
                      visibility
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 font-medium text-blue-600">•</span>
                    <span>
                      <strong>Filter chats</strong> to specific document groups
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DocGroupsTable course_name={course_name} />
      </div>
    </div>
  )
}

export default DocumentGroupsCard
