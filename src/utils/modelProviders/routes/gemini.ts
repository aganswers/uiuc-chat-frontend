import { GeminiProvider, ProviderNames } from '../LLMProvider'
import {
  GeminiModel,
  GeminiModelID,
  GeminiModels,
} from '../types/gemini'

export const getGeminiModels = async (
  geminiProvider: GeminiProvider,
): Promise<GeminiProvider> => {
  geminiProvider.provider = ProviderNames.Gemini
  delete geminiProvider.error // Clear any previous errors

  if (!geminiProvider.apiKey || geminiProvider.apiKey === '') {
    // Don't show any error here... too confusing for users.
    geminiProvider.models = []
    return geminiProvider
  }

  // If no models, return default models sorted by our preference
  if (!geminiProvider.models || geminiProvider.models.length === 0) {
    const preferredGeminiModelIds = [
      GeminiModelID.Gemini_Pro,
      GeminiModelID.Gemini_Pro_Vision,
      GeminiModelID.Gemini_Ultra,
    ]

    geminiProvider.models = Object.values(GeminiModels).sort((a, b) => {
      const indexA = preferredGeminiModelIds.indexOf(a.id as GeminiModelID)
      const indexB = preferredGeminiModelIds.indexOf(b.id as GeminiModelID)
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    }) as GeminiModel[]
  }

  // Return these from API, not just all enabled...
  return geminiProvider
} 