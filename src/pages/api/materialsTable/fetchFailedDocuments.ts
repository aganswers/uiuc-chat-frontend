import { supabase } from '@/utils/supabaseClient'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function fetchFailedDocuments(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    from: fromStr,
    to: toStr,
    course_name,
    filter_key: search_key,
    filter_value: search_value,
    sort_column: rawSortColumn,
    sort_direction: rawSortDir,
  } = req.query as {
    from: string
    to: string
    course_name: string
    filter_key?: string
    filter_value?: string
    sort_column?: string
    sort_direction?: string
  }

  let sort_column = rawSortColumn ?? 'created_at'
  const sort_direction = rawSortDir === 'asc'

  if (!fromStr || !toStr) {
    return res
      .status(400)
      .json({ error: 'Missing required query parameters: from and to' })
  }

  const from = parseInt(fromStr)
  const to = parseInt(toStr)

  try {
    let failedDocs
    let finalError

    if (search_key && search_value) {
      const { data, error } = await supabase
        .from('documents_failed')
        .select(
          'id,course_name,readable_filename,s3_path,url,base_url,created_at,error',
        )
        .match({ course_name })
        .ilike(search_key, `%${search_value}%`)
        .order(sort_column, { ascending: sort_direction })
        .range(from, to)

      failedDocs = data
      finalError = error
    } else {
      const { data, error } = await supabase
        .from('documents_failed')
        .select(
          'id,course_name,readable_filename,s3_path,url,base_url,created_at,error',
        )
        .match({ course_name })
        .order(sort_column, { ascending: sort_direction })
        .range(from, to)

      failedDocs = data
      finalError = error
    }

    if (finalError) throw finalError

    if (!failedDocs) throw new Error('Failed to fetch failed documents')

    // total count
    let totalCount = 0
    if (search_key && search_value) {
      const { count, error } = await supabase
        .from('documents_failed')
        .select('id', { count: 'exact', head: true })
        .match({ course_name })
        .ilike(search_key, `%${search_value}%`)
      if (error) throw error
      totalCount = count ?? 0
    } else {
      const { count, error } = await supabase
        .from('documents_failed')
        .select('id', { count: 'exact', head: true })
        .match({ course_name })
      if (error) throw error
      totalCount = count ?? 0
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { count: recentFailCount, error: recentFailError } = await supabase
      .from('documents_failed')
      .select('id', { count: 'exact', head: true })
      .match({ course_name })
      .gte('created_at', oneDayAgo.toISOString())

    if (recentFailError) throw recentFailError

    return res.status(200).json({
      final_docs: failedDocs,
      total_count: totalCount,
      recent_fail_count: recentFailCount ?? 0,
    })
  } catch (error: any) {
    console.error('fetchFailedDocuments error:', error)
    return res.status(500).json({ error: error.message || 'Internal Error' })
  }
}
