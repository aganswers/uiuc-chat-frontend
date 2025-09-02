import React from 'react'
import { IconTool, IconBrain, IconCheck, IconX, IconLoader } from '@tabler/icons-react'
import { Badge, Text } from '@mantine/core'
import { ToolExecution } from '@/types/chat'
import { montserrat_paragraph } from 'fonts'

interface Props {
  toolExecutions: ToolExecution[]
  isThinking?: boolean
  isRunningTool?: boolean
}

export const ToolExecutionDisplay: React.FC<Props> = ({ 
  toolExecutions, 
  isThinking, 
  isRunningTool 
}) => {
  // Don't render if nothing to show
  if (!toolExecutions.length && !isThinking && !isRunningTool) {
    return null
  }

  // Track which tools are already completed to avoid showing running state for completed tools
  const hasRunningTools = toolExecutions.some(t => t.status === 'running')
  const showThinking = isThinking && !hasRunningTools // Only show thinking if no tools are running

  return (
    <div className="mb-4 space-y-2">
      {/* Thinking indicator - only show if not running tools */}
      {showThinking && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
          <IconBrain size={16} className="animate-pulse text-orange-500" />
          <span className={`text-sm text-orange-700 dark:text-orange-300 ${montserrat_paragraph.variable} font-montserratParagraph`}>
            Analyzing your request...
          </span>
        </div>
      )}

      {/* Tool executions */}
      {toolExecutions.map((tool) => (
        <div
          key={tool.id}
          className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconTool size={16} className="text-blue-500" />
              <span className={`text-sm font-medium ${montserrat_paragraph.variable} font-montserratParagraph`}>
                {tool.name}
              </span>
              <Badge
                size="xs"
                color={
                  tool.status === 'completed' ? 'green' :
                  tool.status === 'running' ? 'orange' :
                  tool.status === 'error' ? 'red' : 'gray'
                }
                leftSection={
                  tool.status === 'running' ? (
                    <IconLoader size={10} className="animate-spin" />
                  ) : tool.status === 'completed' ? (
                    <IconCheck size={10} />
                  ) : tool.status === 'error' ? (
                    <IconX size={10} />
                  ) : null
                }
              >
                {tool.status}
              </Badge>
            </div>
          </div>
          
          {/* Tool arguments */}
          {tool.args && Object.keys(tool.args).length > 0 && (
            <div className="mt-2 rounded border border-blue-200 bg-blue-50/50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
              <Text size="xs" className={`text-blue-600 dark:text-blue-400 ${montserrat_paragraph.variable} font-montserratParagraph font-medium`}>
                Request:
              </Text>
              <Text size="xs" className={`mt-1 text-gray-600 dark:text-gray-300 ${montserrat_paragraph.variable} font-montserratParagraph`}>
                {tool.args.request || JSON.stringify(tool.args, null, 2).slice(0, 300)}
                {JSON.stringify(tool.args, null, 2).length > 300 && '...'}
              </Text>
            </div>
          )}
          
          {/* Tool result */}
          {tool.result && tool.status === 'completed' && (
            <div className="mt-2 rounded border border-green-200 bg-green-50/50 p-2 dark:border-green-800 dark:bg-green-900/20">
              <Text size="sm" className={`text-green-700 dark:text-green-300 ${montserrat_paragraph.variable} font-montserratParagraph`}>
                ✓ {tool.result}
              </Text>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
