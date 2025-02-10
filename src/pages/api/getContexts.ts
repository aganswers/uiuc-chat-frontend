import { ContextWithMetadata } from '~/types/chat'



export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
): Promise<ContextWithMetadata[]> => {
  const requestBody = {
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit,
    doc_groups: doc_groups,
  }

  // UESFUL FOR TESTING -- SHORTEN CONTEXTS
  // const dummyContexts: ContextWithMetadata[] = [
  //   {
  //     id: 1,
  //     text: 'This is a dummy context',
  //     readable_filename: 'dummy_filename_1.pdf',
  //     course_name: 'dummy course 1',
  //     'course_name ': 'dummy course 1',
  //     s3_path: 'dummy_s3_path_1',
  //     pagenumber: '1',
  //     url: 'dummy_url_1',
  //     base_url: 'dummy_base_url_1',
  //   },
  //   {
  //     id: 2,
  //     text: 'This is another dummy context',
  //     readable_filename: 'dummy_filename_2.pdf',
  //     course_name: 'dummy course 2',
  //     'course_name ': 'dummy course 2',
  //     s3_path: 'dummy_s3_path_2',
  //     pagenumber: '2',
  //     url: 'dummy_url_2',
  //     base_url: 'dummy_base_url_2',
  //   },
  // ]
  // return dummyContexts

  const url = `https://flask-production-751b.up.railway.app/getTopContexts`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('Failed to fetch contexts. Err status:', response.status)
      throw new Error('Failed to fetch contexts. Err status:' + response.status)
    }
    const data: ContextWithMetadata[] = await response.json()
    // console.log('\n=== COMPLETE CONTEXT FETCH DETAILS ===')
    // console.log('Raw response from backend (full objects):', JSON.stringify(data, null, 2))
    // console.log('\nNumber of contexts:', data.length)
    
    // // Detailed analysis of each context
    // data.forEach((context, index) => {
    //   console.log(`\nContext ${index + 1} Complete Analysis:`)
    //   console.log('Full raw object:', context)
    //   console.log('All available fields:', {
    //     ...context,
    //     _allKeys: Object.keys(context),
    //     _hasPageNumber: 'pagenumber' in context,
    //     _hasPageNumberOrTimestamp: 'pagenumber_or_timestamp' in context,
    //     _textPreview: context.text?.substring(0, 100) + '...',
    //     _metadataAnalysis: {
    //       totalFields: Object.keys(context).length,
    //       allFieldTypes: Object.entries(context).reduce((acc, [key, value]) => {
    //         acc[key] = typeof value
    //         return acc
    //       }, {} as Record<string, string>)
    //     }
    //   })
    // })
    // console.log('\n=== END COMPLETE CONTEXT FETCH DETAILS ===\n')
    
    return data
  } catch (error) {
    console.error(error)
    return []
  }
}
export default fetchContexts

