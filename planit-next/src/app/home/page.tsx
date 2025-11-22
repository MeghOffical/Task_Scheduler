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
    <div style={{ 
      width: '100%', 
      maxWidth: '80rem', 
      margin: '0 auto', 
      padding: '0 clamp(0.5rem, 2vw, 2rem)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-white)',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: 'clamp(60vh, 70vh, 85vh)'
      }} className="bg-white dark:bg-gray-800 shadow-lg">
        {/* Header */}
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          borderBottom: '1px solid',
          flexShrink: 0
        }} className="border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1', minWidth: 0 }}>
              <h1 style={{
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} className="text-gray-900 dark:text-gray-100">
                AI Task Assistant
              </h1>
              <p style={{
                fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                marginTop: '0.25rem'
              }} className="text-gray-600 dark:text-gray-400">
                Natural language task management
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: 'clamp(0.375rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                borderRadius: '0.375rem'
              }}
              className="bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Clear conversation"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 'clamp(1rem, 3vw, 2rem)'
          }}>
            <div style={{
              maxWidth: 'min(90%, 28rem)',
              width: '100%',
              padding: 'clamp(1rem, 3vw, 2rem)',
              borderRadius: '0.5rem'
            }} className="bg-white dark:bg-gray-800 shadow-xl">
              <h3 style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                fontWeight: '600',
                marginBottom: 'clamp(0.5rem, 2vw, 0.75rem)'
              }} className="text-gray-900 dark:text-gray-100">
                Clear Chat History?
              </h3>
              <p style={{
                fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
              }} className="text-gray-600 dark:text-gray-400">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div style={{
                display: 'flex',
                gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: 'clamp(0.375rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    fontWeight: '500',
                    borderRadius: '0.375rem'
                  }}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChat}
                  style={{
                    padding: 'clamp(0.375rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    fontWeight: '500',
                    borderRadius: '0.375rem'
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          minHeight: 0
        }} className="bg-gray-50 dark:bg-gray-900">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: '0.5rem',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  className={message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  }
                >
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: 'clamp(0.813rem, 1.5vw, 1rem)',
                    lineHeight: '1.625',
                    wordBreak: 'break-word'
                  }}>
                    {message.content}
                  </div>
                  
                  {/* Task Selection Buttons */}
                  {message.tasks && message.tasks.length > 0 && (
                    <div style={{
                      marginTop: 'clamp(0.75rem, 2vw, 1rem)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'clamp(0.5rem, 1.5vw, 0.75rem)'
                    }}>
                      {message.tasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                            padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                            borderRadius: '0.375rem',
                            border: '1px solid',
                            flexWrap: 'wrap'
                          }}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        >
                          <span style={{
                            fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                            flex: '1',
                            wordBreak: 'break-word',
                            minWidth: 'min(100%, 10rem)'
                          }} className="text-gray-900 dark:text-gray-100">
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
                            style={{
                              padding: 'clamp(0.375rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                              fontWeight: '500',
                              borderRadius: '0.25rem',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                            className={`transition-colors text-white ${
                              message.actionType === 'complete'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
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
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '1px solid',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <span style={{
                        width: 'clamp(0.375rem, 1vw, 0.5rem)',
                        height: 'clamp(0.375rem, 1vw, 0.5rem)',
                        animationDelay: '0ms'
                      }} className="bg-primary-500 rounded-full animate-bounce"></span>
                      <span style={{
                        width: 'clamp(0.375rem, 1vw, 0.5rem)',
                        height: 'clamp(0.375rem, 1vw, 0.5rem)',
                        animationDelay: '150ms'
                      }} className="bg-primary-500 rounded-full animate-bounce"></span>
                      <span style={{
                        width: 'clamp(0.375rem, 1vw, 0.5rem)',
                        height: 'clamp(0.375rem, 1vw, 0.5rem)',
                        animationDelay: '300ms'
                      }} className="bg-primary-500 rounded-full animate-bounce"></span>
                    </div>
                    <span style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }} className="text-gray-500 dark:text-gray-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.25rem)',
          borderTop: '1px solid',
          flexShrink: 0
        }} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: 'clamp(0.5rem, 2vw, 0.75rem)',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (e.g., 'Create a task to call John tomorrow')"
              style={{
                flex: '1',
                minWidth: 'min(100%, 15rem)',
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.813rem, 1.5vw, 1rem)',
                border: '1px solid',
                borderRadius: '0.375rem'
              }}
              className="border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 2vw, 1.5rem)',
                fontSize: 'clamp(0.813rem, 1.5vw, 1rem)',
                fontWeight: '500',
                borderRadius: '0.375rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
