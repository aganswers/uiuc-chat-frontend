// upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const region = process.env.AWS_REGION

// S3 Client configuration
let s3Client: S3Client | null = null
if (region && process.env.AWS_KEY && process.env.AWS_SECRET) {
  s3Client = new S3Client({
    region: "auto",
    credentials: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    },
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    forcePathStyle: true, // Required for S3-compatible services
  })
}

// MinIO Client configuration
let vyriadMinioClient: S3Client | null = null
if (
  process.env.MINIO_KEY &&
  process.env.MINIO_SECRET &&
  process.env.MINIO_ENDPOINT
) {
  vyriadMinioClient = new S3Client({
    region: process.env.MINIO_REGION || 'us-east-1', // MinIO requires a region, but it can be arbitrary
    credentials: {
      accessKeyId: process.env.MINIO_KEY,
      secretAccessKey: process.env.MINIO_SECRET,
    },
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
  })
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, courseName } = req.body as {
      uniqueFileName: string
      courseName: string
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`
    console.log('s3_filepath', s3_filepath)

    // Using Cloudflare R2 (s3Client with Cloudflare endpoint)
    if (process.env.CLOUDFLARE_R2_ENDPOINT && s3Client) {
      // Create a presigned PUT URL for Cloudflare R2
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
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
    }
    // Using MinIO
    else if ((courseName === 'vyriad' || courseName === 'pubmed') && vyriadMinioClient) {
      const post = await createPresignedPost(vyriadMinioClient, {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })

      console.log('MinIO presigned post', post)

      return res.status(200).json({
        message: 'Presigned URL generated successfully',
        post,
        method: 'POST'
      })
    }
    // Use standard S3
    else if (s3Client) {
      const post = await createPresignedPost(s3Client, {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })

      console.log('S3 presigned post', post)

      return res.status(200).json({
        message: 'Presigned URL generated successfully',
        post,
        method: 'POST'
      })
    } else {
      throw new Error('No storage client available')
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default handler
