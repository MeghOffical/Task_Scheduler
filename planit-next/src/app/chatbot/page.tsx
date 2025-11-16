'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PageWrapper from '@/components/page-wrapper';

type ThreadSummary = {
  threadId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  createdAt: string;
};

type StreamChunk = {
  type: 'text' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolCall?: { id: string; name: string; arguments: Record<string, any> };
  toolResult?: { id: string; result: any };
  threadId?: string;
  title?: string;
  message?: string;
};

export default function ChatbotPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      setThreadLoading(true);
      const response = await fetch('/api/chatbot/threads');
      if (!response.ok) {
        throw new Error('Unable to load conversations');
      }
      const data: ThreadSummary[] = await response.json();
      setThreads(data);
      setSelectedThread((current) => current ?? (data[0]?.threadId ?? null));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setMessageLoading(true);
      const response = await fetch(`/api/chatbot/threads/${threadId}`);
      if (!response.ok) {
        throw new Error('Unable to load messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages';
      setError(message);
      setMessages([]);
    } finally {
      setMessageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
    } else {
      setMessages([]);
    }
  }, [selectedThread, loadMessages]);

  const handleCreateThread = async () => {
    try {
      setError(null);
      const response = await fetch('/api/chatbot/threads', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Unable to create chat');
      }

      const thread: ThreadSummary = await response.json();
      setThreads((prev) => [thread, ...prev]);
      setSelectedThread(thread.threadId);
      setMessages([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chat';
      setError(message);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThread(threadId);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const displayedMessages = useMemo(() => {
    if (messages.length === 0) {
      return [{
        role: 'assistant' as const,
        content: "I'm your productivity assistant. Ask me anything about planning, schedules, or focus routines to get started!",
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

    setError(null);
    setSending(true);
    setStreaming(true);
    setStreamingMessage('');
    setToolActivity(null);
    setInput('');

    // Add user message optimistically
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId: selectedThread, message: trimmed }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Unable to send message');
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
              } else if (chunk.type === 'tool_call' && chunk.toolCall) {
                setToolActivity(`🔧 Using ${chunk.toolCall.name}...`);
              } else if (chunk.type === 'tool_result') {
                setToolActivity('✅ Tool finished');
                setTimeout(() => setToolActivity(null), 2000);
              } else if (chunk.type === 'done') {
                // Add final assistant message
                const assistantMsg: ChatMessage = {
                  role: 'assistant',
                  content: accumulatedText,
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingMessage('');
                
                if (chunk.threadId) {
                  setSelectedThread(chunk.threadId);
                }
                loadThreads();
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
      if ((err as any).name !== 'AbortError') {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        // Remove optimistic user message on error
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setSending(false);
      setStreaming(false);
      setStreamingMessage('');
      setToolActivity(null);
      abortControllerRef.current = null;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Chatbot</h1>
          <p className="text-gray-500 dark:text-gray-400">Discuss plans, unblock yourself, or brainstorm ideas with Plan-It.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 min-h-[600px]">
          <aside className="glass-panel rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversations</h2>
              <button
                onClick={handleCreateThread}
                className="text-sm px-3 py-1.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                + New
              </button>
            </div>

            {threadLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {threads.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No conversations yet. Start one!
                  </p>
                )}
                {threads.map((thread) => (
                  <button
                    key={thread.threadId}
                    onClick={() => handleSelectThread(thread.threadId)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      thread.threadId === selectedThread
                        ? 'border-primary-200 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <p className="font-semibold truncate">{thread.title || 'New chat'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(thread.updatedAt)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {thread.messageCount} message{thread.messageCount === 1 ? '' : 's'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="glass-panel rounded-2xl flex flex-col">
            <header className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current chat</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {threads.find((t) => t.threadId === selectedThread)?.title || 'New chat'}
                </p>
              </div>
              {messageLoading && (
                <span className="text-xs text-gray-400">Updating…</span>
              )}
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
                          ? 'ml-auto bg-primary-600 text-white'
                          : 'mr-auto bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="block text-[10px] mt-2 opacity-70">
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex">
                  <div className="mr-auto max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <p className="whitespace-pre-wrap">{streamingMessage}</p>
                    <span className="inline-block w-2 h-4 ml-1 bg-primary-600 animate-pulse"></span>
                  </div>
                </div>
              )}

              {/* Tool activity indicator */}
              {toolActivity && (
                <div className="flex justify-center">
                  <div className="px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-300 animate-pulse">
                    {toolActivity}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-gray-100 dark:border-gray-700 px-6 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask the assistant anything..."
                  disabled={sending || streaming}
                  className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || streaming || !input.trim()}
                  className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-semibold disabled:opacity-60 transition-opacity"
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
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
