import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import posthog from 'posthog-js'

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({
        error: '❌❌ Request method not allowed',
      })
    }

    const { uniqueFileName, courseName, readableFilename } = req.body

    console.log(
      '👉 Submitting to ingest queue:',
      uniqueFileName,
      courseName,
      readableFilename,
    )

    if (!uniqueFileName || !courseName || !readableFilename) {
      console.error('Missing body parameters')
      return res.status(400).json({
        error: '❌❌ Missing body parameters',
      })
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

    // Track ingest progress immediately
    const { error } = await supabase.from('documents_in_progress').insert({
      s3_path: s3_filepath,
      course_name: courseName,
      readable_filename: readableFilename,
    })

    if (error) {
      console.error(
        '❌❌ Supabase failed to insert into `documents_in_progress`:',
        error,
      )
      posthog.capture('supabase_failure_insert_documents_in_progress', {
        s3_path: s3_filepath,
        course_name: courseName,
        readable_filename: readableFilename,
        error: error.message,
        beam_task_id: null,
      })
    }

    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'https://backend.aganswers.ai'

    const response = await fetch(`${backendUrl}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name: courseName,
        readable_filename: readableFilename,
        s3_path: s3_filepath,
      }),
    })

    const responseBody = await response.json().catch(() => ({}))
    if (!response.ok || responseBody?.success === false) {
      throw new Error(
        responseBody?.error ||
          `Backend ingest failed (${response.status} ${response.statusText})`,
      )
    }

    await supabase
      .from('documents_in_progress')
      .delete()
      .eq('course_name', courseName)
      .eq('s3_path', s3_filepath)

    return res.status(200).json(responseBody)
  } catch (error) {
    const err = `❌❌ -- /ingest failed to submit document: ${error}`
    console.error(err)
    return res.status(500).json({ error: err })
  }
}

export default handler
