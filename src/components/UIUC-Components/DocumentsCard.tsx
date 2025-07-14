import { useState } from 'react'
import { useRouter } from 'next/router'
import { IconFileExport } from '@tabler/icons-react'
import { ProjectFilesTable } from './ProjectFilesTable'
import { type CourseMetadata } from '~/types/courseMetadata'
import { handleExport } from '~/pages/api/UIUC-api/exportAllDocuments'

function DocumentsCard({
  course_name,
  metadata,
}: {
  course_name: string
  metadata: CourseMetadata
}) {
  const [tabValue, setTabValue] = useState<string | null>('success')
  const [failedCount, setFailedCount] = useState<number>(0)
  const [exportModalOpened, setExportModalOpened] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.asPath.slice(1).split('/')[0] as string
  }

  const handleExportClick = async () => {
    setIsExporting(true)
    try {
      const result = await handleExport(getCurrentPageName())
      if (result && result.message) {
        // Show success message
        console.log('Export completed:', result.message)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Export Confirmation Modal */}
      {exportModalOpened && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Confirm Export
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to export all the documents and embeddings?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setExportModalOpened(false)}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setExportModalOpened(false)
                  handleExportClick()
                }}
                disabled={isExporting}
                className="rounded-md bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Project Files</h2>

          <button
            onClick={() => setExportModalOpened(true)}
            disabled={isExporting}
            className="flex items-center space-x-2 rounded-md bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <IconFileExport size={18} />
            <span className="hidden sm:inline">
              Export All Documents & Embeddings
            </span>
            <span className="inline sm:hidden">Export All</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {metadata && (
          <ProjectFilesTable
            course_name={course_name}
            setFailedCount={setFailedCount}
            tabValue={tabValue as string}
            onTabChange={(value) => setTabValue(value)}
            failedCount={failedCount}
          />
        )}
      </div>
    </div>
  )
}

export default DocumentsCard
