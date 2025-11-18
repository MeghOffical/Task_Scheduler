'use client';

import { useState, useRef, useEffect } from 'react';
import PageWrapper from '@/components/page-wrapper';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI task assistant. I can help you:\n\n• Create new tasks\n• View your existing tasks\n• Update task status and priorities\n• Delete tasks\n• Get task statistics\n\nWhat would you like to do?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processUserRequest = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Create task
    if (lowerMessage.includes('create') && lowerMessage.includes('task')) {
      try {
        const titleMatch = userMessage.match(/create (?:a )?task[: ]+(.*?)(?:\.|$)/i);
        const title = titleMatch ? titleMatch[1].trim() : 'New Task';
        
        const priority = lowerMessage.includes('high') ? 'high' : 
                        lowerMessage.includes('low') ? 'low' : 'medium';

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            priority,
            status: 'pending',
            description: `Created via AI Assistant`
          }),
        });

        if (response.ok) {
          return `✅ Task created successfully!\n\nTitle: ${title}\nPriority: ${priority}\nStatus: Pending`;
        }
        return '❌ Failed to create task. Please try again.';
      } catch (error) {
        return '❌ Error creating task: ' + (error as Error).message;
      }
    }

    // View tasks
    if (lowerMessage.includes('show') || lowerMessage.includes('view') || lowerMessage.includes('list')) {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const tasks = await response.json();
          
          if (tasks.length === 0) {
            return '📋 You have no tasks yet. Would you like to create one?';
          }

          let result = `📋 Your Tasks (${tasks.length} total):\n\n`;
          tasks.slice(0, 10).forEach((task: any, index: number) => {
            const statusEmoji = task.status === 'completed' ? '✅' : 
                              task.status === 'in-progress' ? '🔄' : '⏳';
            const priorityEmoji = task.priority === 'high' ? '🔴' : 
                                task.priority === 'low' ? '🟢' : '🟡';
            
            result += `${index + 1}. ${statusEmoji} ${task.title}\n`;
            result += `   ${priorityEmoji} Priority: ${task.priority} | Status: ${task.status}\n`;
            if (task.dueDate) {
              result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
            }
            result += '\n';
          });

          if (tasks.length > 10) {
            result += `... and ${tasks.length - 10} more tasks`;
          }

          return result;
        }
        return '❌ Failed to fetch tasks.';
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Get statistics
    if (lowerMessage.includes('stats') || lowerMessage.includes('statistics') || lowerMessage.includes('summary')) {
      try {
        const response = await fetch('/api/tasks/stats');
        if (response.ok) {
          const stats = await response.json();
          return `📊 Task Statistics:\n\n` +
                 `📝 Total Tasks: ${stats.totalTasks}\n` +
                 `⏳ Pending: ${stats.pendingTasks}\n` +
                 `🔄 In Progress: ${stats.inProgressTasks}\n` +
                 `✅ Completed: ${stats.completedTasks}\n` +
                 `⚠️ Overdue: ${stats.overdueTasks}\n\n` +
                 `Priority Breakdown:\n` +
                 `🔴 High: ${stats.highPriority}\n` +
                 `🟡 Medium: ${stats.mediumPriority}\n` +
                 `🟢 Low: ${stats.lowPriority}`;
        }
        return '❌ Failed to fetch statistics.';
      } catch (error) {
        return '❌ Error fetching statistics: ' + (error as Error).message;
      }
    }

    // Delete task
    if (lowerMessage.includes('delete') && lowerMessage.includes('task')) {
      return '🗑️ To delete a task, please go to the Tasks page and use the delete button there for safety.';
    }

    // Update status
    if ((lowerMessage.includes('mark') || lowerMessage.includes('update')) && 
        (lowerMessage.includes('complete') || lowerMessage.includes('done'))) {
      return '✏️ To update a task status, please go to the Tasks page and use the status dropdown.';
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 Here's what I can help you with:\n\n` +
             `1️⃣ Create tasks: "Create a task: Buy groceries"\n` +
             `2️⃣ View tasks: "Show me my tasks" or "List all tasks"\n` +
             `3️⃣ Get statistics: "Show task stats"\n` +
             `4️⃣ Set priority: Include "high", "medium", or "low" when creating tasks\n\n` +
             `Try asking me to create a task or show your current tasks!`;
    }

    // Default response
    return `I'm not sure how to help with that. Try asking me to:\n\n` +
           `• "Create a task: [task name]"\n` +
           `• "Show my tasks"\n` +
           `• "Show task statistics"\n` +
           `• "Help"\n\n` +
           `What would you like to do?`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await processUserRequest(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Assistant</h1>
              <p className="text-gray-500 dark:text-gray-400">Your intelligent task management helper</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 glass-panel rounded-2xl p-6 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your tasks..."
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Send
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
