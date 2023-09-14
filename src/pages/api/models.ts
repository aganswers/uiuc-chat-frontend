import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt } from '~/utils/crypto'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
  let apiKey = ''
  try {
    const { key } = (await req.json()) as {
      key: string
    }
    apiKey = key ? key : (process.env.OPENAI_API_KEY as string)

    // Check if the key starts with 'sk-' (indicating it's not encrypted)
    if (key && !key.startsWith('sk-')) {
      // Decrypt the key
      const decryptedText = await decrypt(
        key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      apiKey = decryptedText as string
      // console.log('models.ts Decrypted api key: ', apiKey)
    }
    // console.log('models.ts Final openai key: ', apiKey)

    if (!apiKey) {
      return new Response('Warning: OpenAI Key was not found', { status: 400 })
    }

    let url = `${OPENAI_API_HOST}/v1/models`
    if (OPENAI_API_TYPE === 'azure') {
      url = `${OPENAI_API_HOST}/openai/deployments?api-version=${OPENAI_API_VERSION}`
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(OPENAI_API_TYPE === 'openai' && {
          Authorization: `Bearer ${apiKey}`,
        }),
        ...(OPENAI_API_TYPE === 'azure' && {
          'api-key': `${apiKey}`,
        }),
        ...(OPENAI_API_TYPE === 'openai' &&
          OPENAI_ORGANIZATION && {
            'OpenAI-Organization': OPENAI_ORGANIZATION,
          }),
      },
    })

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      })
    } else if (response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${
          response.status
        }: ${await response.text()}`,
      )
      throw new Error('OpenAI API returned an error')
    }

    const json = await response.json()

    const models: OpenAIModel[] = json.data
      .map((model: any) => {
        const model_name = OPENAI_API_TYPE === 'azure' ? model.model : model.id
        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model_name) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
            }
          }
        }
      })
      .filter(Boolean)

    return new Response(JSON.stringify(models), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler
