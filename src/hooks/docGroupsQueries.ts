import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { CourseDocument, DocumentGroup } from '~/types/courseMaterials'

export function useGetDocumentGroups(course_name: string) {
  // USAGE:
  // const {
  //   data: documentGroups,
  //   isLoading: isLoadingDocumentGroups,
  //   isError: isErrorDocumentGroups,
  //   refetch: refetchDocumentGroups,
  // } = getDocumentGroups(course_name)

  return useQuery({
    queryKey: ['documentGroups', course_name],
    queryFn: async () => {
      // try {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDocumentGroups',
          courseName: course_name,
        }),
      })
      // console.log('response: ', response)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      const docGroups = data.documents

      return docGroups as DocumentGroup[]
    },
  })
}

// ------------- Mutations -------------

export function useCreateDocumentGroup(
  course_name: string,
  queryClient: QueryClient,
  page: number,
) {
  return useMutation(
    async ({ doc_group_name }: { doc_group_name: string }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createDocGroup',
          courseName: course_name,
          docGroup: doc_group_name,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create document group')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ doc_group_name }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        await queryClient.cancelQueries(['documents', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return [
              ...(old || []),
              {
                name: doc_group_name,
                enabled: true,
                doc_count: 1,
                course_name: course_name,
              },
            ]
          },
        )

        const previousDocuments = queryClient.getQueryData([
          'documents',
          course_name,
          page,
        ])
        queryClient.setQueryData(
          ['documents', course_name, page],
          (
            old:
              | { final_docs: CourseDocument[]; total_count: number }
              | undefined,
          ) => {
            if (!old) return
            // Perform the optimistic update
            const updatedDocuments = old?.final_docs.map((doc) => {
              return {
                ...doc,
                doc_groups: [...(doc.doc_groups || []), doc_group_name],
              }
            })
            return {
              ...old,
              final_docs: updatedDocuments,
            }
          },
        )

        return { previousDocumentGroups, previousDocuments }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
        queryClient.setQueryData(
          ['documents', course_name, page],
          context?.previousDocuments,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
        queryClient.invalidateQueries(['documents', course_name])
      },
    },
  )
}

export function useAppendToDocGroup(
  course_name: string,
  queryClient: QueryClient,
  page: number,
) {
  return useMutation({
    mutationFn: async ({
      record,
      appendedGroup,
    }: {
      record: CourseDocument
      appendedGroup: string
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'appendDocGroup',
          courseName: course_name,
          doc: record,
          docGroup: appendedGroup,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to append document group')
      }
      return response.json()
    },
    // Optimistically update the cache
    onMutate: async ({ record, appendedGroup }) => {
      await queryClient.cancelQueries(['documentGroups', course_name])
      await queryClient.cancelQueries(['documents', course_name])
      const previousDocumentGroups = queryClient.getQueryData([
        'documentGroups',
        course_name,
      ])
      queryClient.setQueryData(
        ['documentGroups', course_name],
        (old: DocumentGroup[] | undefined) => {
          // Perform the optimistic update
          const updatedDocumentGroups = old?.map((docGroup) => {
            if (docGroup.name === appendedGroup) {
              return { ...docGroup, doc_count: (docGroup.doc_count || 0) + 1 }
            }
            return docGroup
          })
          return updatedDocumentGroups
        },
      )

      const previousDocuments = queryClient.getQueryData([
        'documents',
        course_name,
        page,
      ])
      queryClient.setQueryData(
        ['documents', course_name, page],
        (
          old:
            | { final_docs: CourseDocument[]; total_count: number }
            | undefined,
        ) => {
          // Perform the optimistic update
          if (!old) return

          const updatedDocuments = old?.final_docs.map((doc) => {
            if (doc.url === record.url || doc.s3_path === record.s3_path) {
              return {
                ...doc,
                doc_groups: [...(doc.doc_groups || []), appendedGroup],
              }
            }
            return doc
          })
          return {
            ...old,
            updatedDocuments,
          }
        },
      )
      return { previousDocumentGroups, previousDocuments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['documentGroups', course_name],
        context?.previousDocumentGroups,
      )

      queryClient.setQueryData(
        ['documents', course_name, page],
        context?.previousDocuments,
      )
    },
    onSettled: () => {
      // Refetch after mutation or error
      queryClient.invalidateQueries(['documentGroups', course_name])
      queryClient.invalidateQueries(['documents', course_name])
    },
  })
}

export function useRemoveFromDocGroup(
  course_name: string,
  queryClient: QueryClient,
  page: number,
) {
  // USAGE:
  // removeFromDocGroup(course_name).mutate({
  //   record,
  //   removedGroup,
  // })

  return useMutation(
    async ({
      record,
      removedGroup,
    }: {
      record: CourseDocument
      removedGroup: string
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeDocGroup',
          courseName: course_name,
          doc: record,
          docGroup: removedGroup,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove document group')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ record, removedGroup }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        await queryClient.cancelQueries(['documents', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return old?.map((docGroup) => {
              if (docGroup.name === removedGroup) {
                return { ...docGroup, doc_count: (docGroup.doc_count || 0) - 1 }
              }
              return docGroup
            })
          },
        )

        const previousDocuments = queryClient.getQueryData([
          'documents',
          course_name,
          page,
        ])
        queryClient.setQueryData(
          ['documents', course_name, page],
          (
            old:
              | { final_docs: CourseDocument[]; total_count: number }
              | undefined,
          ) => {
            if (!old) return
            // Perform the optimistic update
            const updatedDocuments = old?.final_docs.map((doc) => {
              if (doc.url === record.url || doc.s3_path === record.s3_path) {
                return {
                  ...doc,
                  doc_groups: (doc.doc_groups || []).filter(
                    (group) => group !== removedGroup,
                  ),
                }
              }
              return doc
            })
            return {
              ...old,
              final_docs: updatedDocuments,
            }
          },
        )
        return { previousDocumentGroups, previousDocuments }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
        queryClient.setQueryData(
          ['documents', course_name, page],
          context?.previousDocuments,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
        queryClient.invalidateQueries(['documents', course_name])
      },
    },
  )
}

export function useUpdateDocGroup(
  course_name: string,
  queryClient: QueryClient,
) {
  return useMutation(
    async ({
      doc_group_obj,
      enabled,
    }: {
      doc_group_obj: DocumentGroup
      enabled: boolean
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDocGroupStatus',
          courseName: course_name,
          docGroup: doc_group_obj.name,
          enabled: enabled,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update document group status')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ doc_group_obj, enabled }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return old?.map((docGroup) => {
              if (docGroup.name === doc_group_obj.name) {
                return { ...docGroup, enabled }
              }
              return docGroup
            })
          },
        )
        return { previousDocumentGroups }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
      },
    },
  )
}
