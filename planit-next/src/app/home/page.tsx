'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tasks?: Array<{ id: string; title: string; status: string }>;
  actionType?: 'delete' | 'complete' | 'update';
}

interface TaskSelection {
  messageIndex: number;
  taskId: string;
  taskTitle: string;
  actionType: 'delete' | 'complete' | 'update';
}

const STORAGE_KEY = 'ai-chat-messages';

const initialMessage: Message = {
  role: 'assistant',
  content: 'Hello! I\'m your AI task assistant. You can ask me to create, delete, or manage your tasks.\n\nExamples:\n- "Create a task to buy groceries by tomorrow"\n- "Delete the meeting task"\n- "Add a high priority task to finish the report by Friday"\n- "Mark buy groceries as completed"\n\nWhat would you like to do?'
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskSelection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDeleteChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([initialMessage]);
    setShowDeleteConfirm(false);
  };

  const handleTaskAction = async (taskSelection: TaskSelection) => {
    setIsLoading(true);
    try {
      if (taskSelection.actionType === 'delete') {
        const response = await fetch(`/api/tasks/${taskSelection.taskId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `✅ I've deleted the task: "${taskSelection.taskTitle}".` 
          }]);
          window.dispatchEvent(new Event('task-updated'));
        } else {
          throw new Error('Failed to delete task');
        }
      } else if (taskSelection.actionType === 'complete') {
        const response = await fetch(`/api/tasks/${taskSelection.taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });

        if (response.ok) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `✅ I've marked "${taskSelection.taskTitle}" as completed!` 
          }]);
          window.dispatchEvent(new Event('task-updated'));
        } else {
          throw new Error('Failed to update task');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
      setSelectedTask(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, messages })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        tasks: data.tasks,
        actionType: data.actionType
      }]);

      // If tasks were modified, trigger a refresh event
      if (data.tasksModified) {
        window.dispatchEvent(new Event('task-updated'));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Task Assistant
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Natural language task management
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
              title="Clear conversation"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Clear Chat History?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-gray-50 dark:bg-gray-900">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                
                {/* Task Selection Buttons */}
                {message.tasks && message.tasks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {message.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleTaskAction({
                            messageIndex: index,
                            taskId: task.id,
                            taskTitle: task.title,
                            actionType: message.actionType || 'delete'
                          })}
                          disabled={isLoading}
                          className={`ml-3 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            message.actionType === 'complete'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {message.actionType === 'complete' ? 'Mark Complete' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (e.g., 'Create a task to call John tomorrow')"
              className="flex-1 px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
