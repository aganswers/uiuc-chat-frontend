import { IconExternalLink } from '@tabler/icons-react'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { OpenAIModels, type OpenAIModel, OpenAIModelID } from '@/types/openai'
import HomeContext from '~/pages/api/home/home.context'
import { ModelParams } from './ModelParams'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Input, NativeSelect, Switch, Title, Tooltip } from '@mantine/core'
import Link from 'next/link'
import React from 'react'

export const ModelSelect = React.forwardRef<HTMLDivElement, any>(
  (props, ref) => {
    const {
      state: {
        selectedConversation,
        models,
        defaultModelId,
        // showModelSettings,
        prompts,
      },
      handleUpdateConversation,
      // dispatch: homeDispatch,
    } = useContext(HomeContext)

    const { t } = useTranslation('chat')

    const handleModelClick = (modelId: string) => {
      console.debug('handleModelClick clicked:', modelId)
      console.debug('handleModelClick avail models: ', models)

      // First try to use selectedconversation model, if not available, use default model
      const defaultModel =
        models.find(
          (model) =>
            model.id === 'gpt-4-from-canada-east' || model.id === 'gpt-4',
        ) || models[0]
      const model = models.find((model) => model.id === modelId) || defaultModel

      console.debug('handleModelClick SETTING IT TO: ', model)

      selectedConversation &&
        handleUpdateConversation(selectedConversation, {
          key: 'model',
          value: model as OpenAIModel,
        })
    }

    // Toggle to enable Fancy retrieval method: Multi-Query Retrieval
    const [useMQRetrieval, setUseMQRetrieval] = useState(
      localStorage.getItem('UseMQRetrieval') === 'true',
    )
    // Update localStorage whenever useMQRetrieval changes
    useEffect(() => {
      localStorage.setItem('UseMQRetrieval', useMQRetrieval ? 'true' : 'false')
    }, [useMQRetrieval])

    return (
      <div
        className="flex flex-col md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:w-[30rem] lg:max-w-2xl lg:px-0 xl:max-w-3xl"
        style={{ position: 'absolute', zIndex: 100, right: '10px' }}
      >
        <div className="flex h-full flex-col space-y-4 rounded-lg border-2 border-[rgba(42,42,120,1)] bg-[#1d1f33] p-4 dark:bg-[#1d1f33] md:rounded-lg">
          <div
            // THIS IS THE REFERENCE we use in TopBarChat.tsx to enable the "click away" behavior
            ref={ref as any}
          >
            <div className="flex flex-col">
              <Title
                className={`pb-0 pl-2 pt-4 ${montserrat_heading.variable} font-montserratHeading`}
                order={4}
              >
                Model
              </Title>
              <Input.Description className="p-2 text-left">
                <Link
                  href="https://platform.openai.com/docs/models"
                  target="_blank"
                  className="hover:underline"
                >
                  Read about each model{' '}
                  <IconExternalLink
                    size={13}
                    style={{ position: 'relative', top: '2px' }}
                    className={'mb-2 inline'}
                  />
                </Link>
              </Input.Description>

              <div tabIndex={0} className="relative w-full">
                <NativeSelect
                  className="menu absolute z-[1]"
                  value={selectedConversation?.model.id || defaultModelId} // selectedConversation?.model.id ||
                  onChange={(e) => handleModelClick(e.target.value)}
                  // onClick={(e) => handleModelClick((e.target as HTMLSelectElement).value)}
                  data={models.map((model) => ({
                    value: model.id,
                    label: model.name,
                  }))}
                />
              </div>
            </div>
            <div style={{ paddingTop: '47px' }}>
              <Tooltip
                multiline
                // color="#15162b"
                color="#CC65FF"
                arrowPosition="side"
                position="top-start"
                arrowSize={8}
                withArrow
                label="Multi-Query Retrieval is disabled for performance reasons, I'm working to bring it back ASAP."
              >
                <div>
                  <Title
                    className={`pb-0 pl-2 pt-4 ${montserrat_heading.variable} font-montserratHeading`}
                    order={4}
                  >
                    Fancy Retrieval
                  </Title>
                  <Switch
                    disabled={true}
                    // checked={useMQRetrieval}
                    checked={false}
                    className="pl-2 pt-2"
                    label={t(
                      'Multi Query Retrieval (slow 30 second response time)',
                    )}
                    onChange={(event) =>
                      setUseMQRetrieval(event.currentTarget.checked)
                    }
                    description={t(
                      'A LLM generates multiple queries based on your original for improved semantic search. Then every retrieved context is filtered by a smaller LLM (Mistral 7b) so that only high quality and relevant documents are included in the final GPT-4 call.',
                    )}
                    color="violet.7"
                  />
                </div>
              </Tooltip>
              <ModelParams
                selectedConversation={selectedConversation}
                prompts={prompts}
                handleUpdateConversation={handleUpdateConversation}
                t={t}
              />
            </div>
            <div className="flex h-full flex-col space-y-4 rounded-lg p-2">
              <Input.Description
                className={`text-left text-sm ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                <Link
                  href="https://platform.openai.com/account/usage"
                  target="_blank"
                  className="hover:underline"
                >
                  View account usage on OpenAI{' '}
                  <IconExternalLink
                    size={15}
                    style={{ position: 'relative', top: '2px' }}
                    className={'mb-2 inline'}
                  />
                </Link>
              </Input.Description>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

ModelSelect.displayName = 'ModelSelect'
