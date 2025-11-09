"use client";

import * as React from "react";
import Image from "next/image";
import { useContext } from "react";
import HomeContext from "~/pages/api/home/home.context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

// Model configuration with proper naming logic
const MODEL_IDS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  // 'google/gemini-2.5-flash-lite',
  'openai/gpt-5-mini',
  // 'openai/gpt-5-nano-2025-08-07',
  'openai/gpt-5',
//   'openai/gpt-oss-20b',
//   'openai/gpt-oss-120b'
] as const;

type ModelId = typeof MODEL_IDS[number];

interface ModelConfig {
  id: ModelId;
  name: string;
  provider: string;
  tokenLimit: number;
  enabled: boolean;
  logo: string;
}

// Helper function to format model names
function formatModelName(modelId: string): string {
  // Remove provider prefix
  const parts = modelId.split('/');
  const withoutProvider = parts.length > 1 ? parts[1] : modelId;
  
  if (!withoutProvider) return modelId;
  
  // Handle special cases first
  const specialCases: Record<string, string> = {
    'gpt-5-mini': 'Gpt 5 Mini',
    'gpt-5': 'Gpt 5',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro'
  };
  
  if (specialCases[withoutProvider]) {
    return specialCases[withoutProvider];
  }
  
  // Fallback: replace hyphens with spaces and capitalize
  return withoutProvider
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get provider name
function getProviderName(modelId: string): string {
  const parts = modelId.split('/');
  const provider = parts.length > 0 ? parts[0] : modelId;
  
  if (!provider) return 'Unknown';
  
  const providerMap: Record<string, string> = {
    'openai': 'OpenAI',
    'google': 'Google',
  };
  
  return providerMap[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

// Generate model configurations
const MODELS: ModelConfig[] = MODEL_IDS.map(id => {
  const provider = getProviderName(id);
  const modelName = formatModelName(id);
  const providerLower = id.split('/')[0];
  
  return {
    id,
    name: `${provider} ${modelName}`,
    provider,
    tokenLimit: 250000,
    enabled: true,
    logo: `/media/models/${providerLower}.png`
  };
});

const DEFAULT_MODEL_ID: ModelId = 'google/gemini-2.5-flash';

export const ModelSelect: React.FC = () => {
  const {
    state: { selectedModel },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // Initialize with default model if none selected
  React.useEffect(() => {
    if (!selectedModel) {
      const defaultModel = MODELS.find(m => m.id === DEFAULT_MODEL_ID);
      if (defaultModel) {
        homeDispatch({
          field: 'selectedModel',
          value: defaultModel
        });
      }
    }
  }, [selectedModel, homeDispatch]);

  const handleModelChange = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    if (model) {
      homeDispatch({
        field: 'selectedModel',
        value: model
      });
    }
  };

  const currentModelId = selectedModel?.id || DEFAULT_MODEL_ID;
  const currentModel = MODELS.find(m => m.id === currentModelId);

  return (
    <div className="w-full max-w-[200px]">
      <Select value={currentModelId} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full text-left">
          <div className="flex items-center gap-2 min-w-0">
            {currentModel && (
              <>
                <Image
                  src={currentModel.logo}
                  alt={currentModel.provider}
                  width={16}
                  height={16}
                  className="shrink-0 rounded"
                />
                <span className="truncate text-sm font-medium text-gray-900">
                  {currentModel.name}
                </span>
              </>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Models</SelectLabel>
            {MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <Image
                    src={model.logo}
                    alt={model.provider}
                    width={16}
                    height={16}
                    className="shrink-0 rounded"
                  />
                  <span className="truncate">{model.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
