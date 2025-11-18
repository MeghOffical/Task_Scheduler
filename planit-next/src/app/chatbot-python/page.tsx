'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PageWrapper from '@/components/page-wrapper';
import { useSession } from 'next-auth/react';

type ChatMessage = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  createdAt?: string;
};

type StreamChunk = {
  type: 'text' | 'tool' | 'done' | 'error';
  content?: string;
  name?: string;
  threadId?: string;
  message?: string;
};

export default function ChatbotPagePython() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate thread ID on mount
  useEffect(() => {
    setThreadId(`thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Quick action suggestions
  const quickActions = [
    { label: '📋 Show my tasks', prompt: 'Show me all my tasks' },
    { label: '✅ Create task', prompt: 'Create a task to finish the project report by next Friday with high priority' },
    { label: '🎯 High priority', prompt: 'Show me all high-priority tasks' },
    { label: '📊 Task stats', prompt: 'How many tasks do I have?' },
    { label: '⏰ Due soon', prompt: 'What tasks are pending?' },
    { label: '🧮 Calculate', prompt: 'What is 25 times 8?' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const displayedMessages = useMemo(() => {
    if (messages.length === 0) {
      return [{
        role: 'assistant' as const,
        content: "👋 Hi! I'm Plan-It, your AI productivity assistant. I can help you:\n\n✅ Create, update, and delete tasks\n📊 Search and filter your tasks\n📈 Get task statistics\n🎯 Manage priorities\n🧮 Perform calculations\n📊 Check stock prices\n\nTry the quick actions below or ask me anything!",
        createdAt: new Date().toISOString(),
      }];
    }
    return messages;
  }, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || streaming) {
      return;
    }

    if (!session?.user) {
      setError('Please log in to use the chatbot');
      return;
    }

    setError(null);
    setSending(true);
    setStreaming(true);
    setStreamingMessage('');
    setToolActivity(null);
    setInput('');

    // Add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Call Python FastAPI server
      const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${PYTHON_API_URL}/api/chatbot/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: trimmed,
          threadId: threadId,
          userId: session.user.id || session.user.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to AI assistant');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6));

              if (chunk.type === 'text' && chunk.content) {
                accumulatedText += chunk.content;
                setStreamingMessage(accumulatedText);
              } else if (chunk.type === 'tool') {
                const toolName = chunk.name || 'tool';
                setToolActivity(`🔧 Using ${toolName}...`);
              } else if (chunk.type === 'done') {
                // Add final assistant message
                const assistantMsg: ChatMessage = {
                  role: 'assistant',
                  content: accumulatedText || 'Task completed!',
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingMessage('');
                setToolActivity('✅ Done');
                setTimeout(() => setToolActivity(null), 1500);
              } else if (chunk.type === 'error') {
                throw new Error(chunk.message || 'Streaming failed');
              }
            } catch (parseError) {
              console.error('Failed to parse chunk:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
      setStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setThreadId(`thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    setError(null);
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Task Assistant</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your tasks with AI-powered natural language</p>
          </div>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            + New Chat
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              ✕
            </button>
          </div>
        )}

        <div className="glass-panel rounded-2xl flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
          <header className="border-b border-gray-100 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Python Backend Connected
              </p>
              <p className="text-xs text-gray-400">Thread: {threadId.slice(0, 12)}...</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {displayedMessages.map((message, index) => (
              <div key={`${message.createdAt}-${index}`} className="flex">
                {message.role === 'tool' ? (
                  <div className="mx-auto max-w-sm">
                    <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-xs text-blue-700 dark:text-blue-300">
                      🔧 Tool: {message.name || 'Unknown'}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === 'user'
                        ? 'ml-auto bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                        : 'mr-auto bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex">
                <div className="mr-auto max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <p className="whitespace-pre-wrap leading-relaxed">{streamingMessage}</p>
                  <span className="inline-block w-2 h-4 ml-1 bg-primary-600 animate-pulse rounded"></span>
                </div>
              </div>
            )}

            {/* Tool activity indicator */}
            {toolActivity && (
              <div className="flex justify-center">
                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-300 shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                    {toolActivity}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-gray-100 dark:border-gray-700 px-6 py-4">
            {/* Quick Actions */}
            {messages.length === 0 && !streamingMessage && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-300 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask me to create, update, or search tasks..."
                disabled={sending || streaming}
                className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || streaming || !input.trim()}
                className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-semibold disabled:opacity-60 transition-opacity hover:bg-primary-700"
              >
                {streaming ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Streaming…
                  </span>
                ) : sending ? (
                  'Sending…'
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-xs text-center text-gray-400">
          Powered by Google Gemini 2.5 Flash • LangGraph • Python FastAPI
        </div>
      </div>
    </PageWrapper>
  );
}
