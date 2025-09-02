/**
 * ADK Event streaming utilities for real-time agent transparency
 */

export interface ADKEvent {
    id: string;
    invocationId: string;
    author: string;
    timestamp: number;
    partial: boolean;
    content?: {
      role: string;
      parts: Array<{
        text?: string;
        thought?: boolean;
        functionCall?: {
          name: string;
          args: Record<string, any>;
        };
        functionResponse?: {
          name: string;
          response: any;
        };
        inlineData?: {
          mimeType: string;
          data: string;
          displayName?: string;
        };
        codeExecutionResult?: {
          outcome: string;
          output?: string;
        };
        executableCode?: {
          language: string;
          code: string;
        };
      }>;
    };
    actions?: {
      stateDelta?: Record<string, any>;
      artifactDelta?: Record<string, number>;
      transferToAgent?: string;
      skipSummarization?: boolean;
    };
    longRunningToolIds?: string[];
  }
  
  export interface StreamingMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
    isThought?: boolean;
    functionCalls?: Array<{
      name: string;
      args: Record<string, any>;
      status: 'pending' | 'completed' | 'error';
    }>;
    artifacts?: Array<{
      type: string;
      data: string;
      filename?: string;
    }>;
    eventIds?: string[];
  }
  
  export class ADKStreamProcessor {
    private currentMessage: StreamingMessage | null = null;
    private messageBuffer: string = '';
    private thoughtBuffer: string = '';
    private onMessageUpdate: (message: StreamingMessage) => void;
    private onComplete: () => void;
    private onError: (error: string) => void;
  
    constructor(
      onMessageUpdate: (message: StreamingMessage) => void,
      onComplete: () => void,
      onError: (error: string) => void
    ) {
      this.onMessageUpdate = onMessageUpdate;
      this.onComplete = onComplete;
      this.onError = onError;
    }
  
    processEvent(event: ADKEvent) {
      try {
        // Initialize message if needed
        if (!this.currentMessage) {
          this.currentMessage = {
            id: event.id,
            role: 'assistant',
            content: '',
            isStreaming: true,
            eventIds: []
          };
        }
  
        this.currentMessage.eventIds?.push(event.id);
  
        // Process content parts
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.text) {
              if (part.thought) {
                // Handle thought streaming
                this.thoughtBuffer += part.text;
                this.currentMessage.isThought = true;
                this.currentMessage.content = this.thoughtBuffer;
              } else {
                // Handle regular text streaming
                this.messageBuffer += part.text;
                this.currentMessage.isThought = false;
                this.currentMessage.content = this.messageBuffer;
                
                // Clear thought buffer when switching to regular text
                if (this.thoughtBuffer) {
                  this.thoughtBuffer = '';
                }
              }
            } else if (part.functionCall) {
              // Handle function calls
              if (!this.currentMessage.functionCalls) {
                this.currentMessage.functionCalls = [];
              }
              this.currentMessage.functionCalls.push({
                name: part.functionCall.name,
                args: part.functionCall.args,
                status: 'pending'
              });
            } else if (part.functionResponse) {
              // Update function call status
              if (this.currentMessage.functionCalls) {
                const funcCall = this.currentMessage.functionCalls.find(
                  fc => fc.name === part.functionResponse?.name
                );
                if (funcCall) {
                  funcCall.status = 'completed';
                }
              }
            } else if (part.inlineData) {
              // Handle artifacts/attachments
              if (!this.currentMessage.artifacts) {
                this.currentMessage.artifacts = [];
              }
              this.currentMessage.artifacts.push({
                type: part.inlineData.mimeType,
                data: part.inlineData.data,
                filename: part.inlineData.displayName
              });
            }
          }
        }
  
        // Handle actions
        if (event.actions?.artifactDelta) {
          // Artifact updates
          if (!this.currentMessage.artifacts) {
            this.currentMessage.artifacts = [];
          }
          // Note: Actual artifact fetching would happen separately
        }
  
        // Mark as final if not partial
        if (!event.partial) {
          this.currentMessage.isStreaming = false;
        }
  
        // Emit update
        this.onMessageUpdate({ ...this.currentMessage });
  
      } catch (error) {
        console.error('Error processing ADK event:', error);
        this.onError(`Failed to process event: ${error}`);
      }
    }
  
    finalize() {
      if (this.currentMessage) {
        this.currentMessage.isStreaming = false;
        this.onMessageUpdate({ ...this.currentMessage });
      }
      this.onComplete();
    }
  
    reset() {
      this.currentMessage = null;
      this.messageBuffer = '';
      this.thoughtBuffer = '';
    }
  }
  
  export async function streamADKChat(
    payload: any,
    onMessageUpdate: (message: StreamingMessage) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const processor = new ADKStreamProcessor(onMessageUpdate, onComplete, onError);
  
    try {
      const response = await fetch('/Chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }
  
      const decoder = new TextDecoder();
      let buffer = '';
  
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
  
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = line.slice(6); // Remove 'data: ' prefix
            
            if (eventData.trim()) {
              try {
                const event = JSON.parse(eventData) as ADKEvent;
                processor.processEvent(event);
              } catch (parseError) {
                console.warn('Failed to parse SSE event:', parseError, eventData);
              }
            }
          }
        }
      }
  
      processor.finalize();
      
    } catch (error) {
      console.error('ADK streaming error:', error);
      onError(`Streaming failed: ${error}`);
    }
  }
  