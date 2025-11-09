// upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextApiRequest, NextApiResponse } from 'next'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 Client configuration
const s3Client = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: process.env.AWS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!,
  },
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  forcePathStyle: true,
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, courseName } = req.body as {
      uniqueFileName: string
      courseName: string
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`
    console.log('s3_filepath', s3_filepath)

    const bucket =
      process.env.AGANSWERS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME!
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3_filepath,
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 60, // 1 hour
    })

    console.log('Cloudflare R2 signed URL', signedUrl)

    return res.status(200).json({
      message: 'Signed URL generated successfully',
      url: signedUrl,
      method: 'PUT',
      filepath: s3_filepath
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default handler
