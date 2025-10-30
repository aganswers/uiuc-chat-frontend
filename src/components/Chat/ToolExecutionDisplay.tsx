import React, { useState } from 'react'
import { IconCode, IconBrain, IconLoader, IconBolt, IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { ToolExecution } from '@/types/chat'
import { montserrat_paragraph } from 'fonts'
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '../Markdown/CodeBlock'

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
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't render if nothing to show
  if (!toolExecutions.length && !isThinking && !isRunningTool) {
    return null
  }

  const hasRunningTools = toolExecutions.some(t => t.status === 'running')
  const completedCount = toolExecutions.filter(t => t.status === 'completed').length

  return (
    <div className="mx-auto w-full mb-3 transition-all duration-300">
      {/* Tool chain header */}
      {toolExecutions.length > 0 && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <div className="transition-transform duration-200">
              {isExpanded ? (
                <IconChevronDown className="w-4 h-4" />
              ) : (
                <IconChevronRight className="w-4 h-4" />
              )}
            </div>
            <span className={`font-medium ${montserrat_paragraph.variable} font-montserratParagraph`}>
              {hasRunningTools 
                ? `Running tools (${completedCount}/${toolExecutions.length})` 
                : `Used ${toolExecutions.length} tool${toolExecutions.length !== 1 ? 's' : ''}`
              }
            </span>
            <div className="flex items-center gap-1">
              {toolExecutions.map((tool) => (
                <div 
                  key={tool.id} 
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    tool.status === 'completed' ? 'bg-green-500' : 
                    tool.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    tool.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`} 
                />
              ))}
            </div>
          </button>
          
          {/* Expanded tool details */}
          <div className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="space-y-6 pt-4 pl-2 pr-6 border-l-2 border-gray-100">
              {toolExecutions.map((tool) => (
                <div key={tool.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {tool.name === 'transfer_to_agent' || tool.name.includes('transfer') ? (
                      <>
                        <IconBolt className="w-3.5 h-3.5 text-purple-500" />
                        <span className={`font-medium text-gray-700 ${montserrat_paragraph.variable} font-montserratParagraph`}>
                          {tool.args.agent_name ? `Transferred to ${tool.args.agent_name}` : tool.name}
                        </span>
                      </>
                    ) : tool.name === 'run_code' || tool.name.includes('code') ? (
                      <>
                        <IconCode className="w-3.5 h-3.5 text-blue-500" />
                        <span className={`font-medium text-gray-700 ${montserrat_paragraph.variable} font-montserratParagraph`}>Ran code</span>
                      </>
                    ) : (
                      <>
                        <IconCode className="w-3.5 h-3.5 text-gray-500" />
                        <span className={`font-medium text-gray-700 ${montserrat_paragraph.variable} font-montserratParagraph`}>{tool.name}</span>
                      </>
                    )}
                    {tool.status === 'running' && (
                      <IconLoader className="w-3 h-3 text-blue-500 animate-spin" />
                    )}
                  </div>
                  
                  {/* Reasoning Section */}
                  {tool.args?.reasoning && (
                    <div className="mb-2 pl-2 border-l-2 border-gray-100">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Reasoning
                      </div>
                      <p className={`text-sm text-gray-600 italic ${montserrat_paragraph.variable} font-montserratParagraph`}>
                        {tool.args.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Code Section */}
                  {tool.args?.code && (
                    <div className="mb-2">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Code
                      </div>
                      <div className="text-sm">
                        <CodeBlock
                          language="python"
                          value={tool.args.code}
                        />
                      </div>
                    </div>
                  )}

                  {/* Other Arguments Section */}
                  {tool.args && !tool.args.code && !tool.args.reasoning && Object.keys(tool.args).length > 0 && (
                    <div className="mb-2">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Arguments
                      </div>
                      <div className="rounded border border-blue-200 bg-blue-50/50 p-2">
                        <p className={`text-xs text-gray-600 ${montserrat_paragraph.variable} font-montserratParagraph font-mono`}>
                          {JSON.stringify(tool.args, null, 2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Result Section */}
                  {tool.result && tool.status === 'completed' && tool.result !== 'Tool completed' && (
                    <div className="mb-2">
                      <div className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Result
                      </div>
                      <div className="text-sm">
                        <CodeBlock
                          language="bash"
                          value={tool.result}
                        />
                        <p className={`text-sm text-green-500 ${montserrat_paragraph.variable} font-montserratParagraph font-mono`}>Tool completed</p>
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {tool.result === 'Tool completed' && (
                    <div>
                      <p className={`text-sm text-green-500 ${montserrat_paragraph.variable} font-montserratParagraph font-mono`}>{tool.result}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Thinking indicator - only show if not running tools */}
      {isThinking && !hasRunningTools && toolExecutions.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <IconBrain size={16} className="animate-pulse text-orange-500" />
          <span className={`${montserrat_paragraph.variable} font-montserratParagraph`}>
            Analyzing your request...
          </span>
        </div>
      )}
    </div>
  )
}
