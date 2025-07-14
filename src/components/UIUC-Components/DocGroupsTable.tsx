'use client'

import { useMemo, useState } from 'react'
import { IconHelp, IconSearch } from '@tabler/icons-react'
import {
  useGetDocumentGroups,
  useUpdateDocGroup,
} from '~/hooks/docGroupsQueries'
import { useQueryClient } from '@tanstack/react-query'

export function DocGroupsTable({ course_name }: { course_name: string }) {
  const queryClient = useQueryClient()
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

  const updateDocGroup = useUpdateDocGroup(course_name, queryClient)

  const {
    data: documentGroups,
    isLoading: isLoadingDocumentGroups,
    isError: isErrorDocumentGroups,
    refetch: refetchDocumentGroups,
  } = useGetDocumentGroups(course_name)

  // Logic to filter doc_groups based on the search query
  const filteredDocumentGroups = useMemo(() => {
    if (!documentGroups) {
      return []
    }

    return [...documentGroups].filter((doc_group_obj) =>
      doc_group_obj.name
        ?.toLowerCase()
        .includes(documentGroupSearch?.toLowerCase()),
    )
  }, [documentGroups, documentGroupSearch])

  // Handle doc_group search change
  const handleDocumentGroupSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDocumentGroupSearch(event.target.value)
  }

  if (isLoadingDocumentGroups) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[orange-500]"></div>
      </div>
    )
  }

  if (isErrorDocumentGroups) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">Error loading document groups</p>
        <button
          onClick={() => refetchDocumentGroups()}
          className="mt-2 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IconSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by Document Group"
          value={documentGroupSearch}
          onChange={handleDocumentGroupSearchChange}
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:border-[orange-500] focus:outline-none focus:ring-1 focus:ring-[orange-500]"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Document Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Number of Docs
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Enabled</span>
                    <div className="group relative">
                      <IconHelp size={14} className="text-gray-400" />
                      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                        <div className="max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs text-white">
                          If a document is included in ANY enabled group, it
                          will be included in chatbot results. Enabled groups
                          take precedence over disabled groups.
                          <div className="absolute left-1/2 top-full -translate-x-1/2 transform border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDocumentGroups.map((doc_group_obj, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {doc_group_obj.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {doc_group_obj.doc_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={doc_group_obj.enabled}
                        onChange={(event) =>
                          updateDocGroup.mutate({
                            doc_group_obj,
                            enabled: event.currentTarget.checked,
                          })
                        }
                        className="sr-only"
                      />
                      <div
                        className={`h-6 w-11 rounded-full transition-colors ${
                          doc_group_obj.enabled
                            ? 'bg-orange-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                            doc_group_obj.enabled
                              ? 'translate-x-5'
                              : 'translate-x-0.5'
                          } mt-0.5`}
                        ></div>
                      </div>
                    </label>
                  </td>
                </tr>
              ))}
              {filteredDocumentGroups.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {documentGroupSearch
                      ? 'No document groups found matching your search'
                      : 'No document groups found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
