import {
  OllamaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
  enabled: boolean
  default?: boolean
  temperature?: number
}

export enum OllamaModelIDs {
  // Use "official" IDs from the Ollama API. Human-readable names in 'OllamaModels' below.
  LLAMA31_8b = 'llama3.1:8b',
  LLAMA31_latest = 'llama3.1:latest', // maps to LLAMA31_8b
  LLAMA31_70b = 'llama3.1:70b',
  LLAMA31_405b = 'llama3.1:405b',
  LLAMA31_8b_instruct_fp16 = 'llama3.1:8b-instruct-fp16',
  LLAMA31_70b_instruct_fp16 = 'llama3.1:70b-instruct-fp16',

  DEEPSEEK_R1_14b_qwen_fp16 = 'deepseek-r1:14b-qwen-distill-fp16',

  QWEN25_14b_fp16 = 'qwen2.5:14b-instruct-fp16',
}

export const OllamaModels: Record<OllamaModelIDs, OllamaModel> = {
  [OllamaModelIDs.QWEN25_14b_fp16]: {
    id: OllamaModelIDs.QWEN25_14b_fp16,
    name: 'Qwen 14b (FP16)',
    parameterSize: '14b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16]: {
    id: OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16,
    name: 'Deepseek R1 14b (Qwen FP16)',
    parameterSize: '14b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_70b_instruct_fp16]: {
    id: OllamaModelIDs.LLAMA31_70b_instruct_fp16,
    name: 'Llama 3.1 70b (FP16)',
    parameterSize: '70b', // Fixed parameter size from 8b to 70b
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_8b_instruct_fp16]: {
    id: OllamaModelIDs.LLAMA31_8b_instruct_fp16,
    name: 'Llama 3.1 8b (FP16)',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_8b]: {
    id: OllamaModelIDs.LLAMA31_8b,
    name: 'Llama 3.1 8b (quantized)',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_latest]: {
    id: OllamaModelIDs.LLAMA31_latest,
    name: 'Llama 3.1 8b (quantized)',
    parameterSize: '8b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_70b]: {
    id: OllamaModelIDs.LLAMA31_70b,
    name: 'Llama 3.1 70b (Quantized, Poor Quality Model)',
    parameterSize: '70b',
    tokenLimit: 128000,
    enabled: true,
  },
  [OllamaModelIDs.LLAMA31_405b]: {
    id: OllamaModelIDs.LLAMA31_405b,
    name: 'Llama 3.1 405b (quantized)',
    parameterSize: '405b',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getOllamaModels = async (
  ollamaProvider: OllamaProvider,
): Promise<OllamaProvider> => {
  delete ollamaProvider.error // Remove the error property if it exists
  ollamaProvider.provider = ProviderNames.Ollama
  try {
    if (!ollamaProvider.baseUrl) {
      // Don't error here, too confusing for users.
      // ollamaProvider.error = `Ollama Base Url is not defined, please set it to the URL that points to your Ollama instance.`
      ollamaProvider.models = [] // clear any previous models.
      return ollamaProvider as OllamaProvider
    }

    const response = await fetch(ollamaProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      ollamaProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ollamaProvider.models = [] // clear any previous models.
      return ollamaProvider as OllamaProvider
    }
    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      .filter((model: any) =>
        Object.values(OllamaModelIDs).includes(model.model),
      )
      .map((model: any): OllamaModel => {
        return OllamaModels[model.model as OllamaModelIDs]
      })

    ollamaProvider.models = ollamaModels
    return ollamaProvider as OllamaProvider
  } catch (error: any) {
    ollamaProvider.error = error.message
    console.warn('ERROR in getOllamaModels', error)
    ollamaProvider.models = [] // clear any previous models.
    return ollamaProvider as OllamaProvider
  }
}
