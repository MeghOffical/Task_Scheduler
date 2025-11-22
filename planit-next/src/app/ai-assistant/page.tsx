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

type ConversationContext = {
  lastTaskId?: string;
  lastTaskTitle?: string;
  awaitingPriorityChange?: boolean;
  taskForPriorityChange?: { id: string; title: string };
  awaitingTaskSelection?: boolean;
  availableTasks?: any[];
  awaitingPrioritySelection?: boolean;
  awaitingTaskDeletion?: boolean;
  awaitingTaskCompletion?: boolean;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI task assistant. I can help you:\n\n• Create new tasks\n• View your existing tasks\n• Mark tasks as complete\n• Delete tasks\n• Get task statistics\n\nJust tell me what you'd like to do, like:\n- \"Create a task: Buy groceries\"\n- \"Show my tasks\"\n- \"Delete task 1\"\n- \"Mark task 2 as complete\"",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [context, setContext] = useState<ConversationContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processUserRequest = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Handle priority change flow
    if (context.awaitingPriorityChange && context.taskForPriorityChange) {
      const priorityMatch = lowerMessage.match(/\b(high|medium|low|1|2|3)\b/);
      if (priorityMatch) {
        const priorityMap: { [key: string]: string } = {
          'high': 'high', '1': 'high',
          'medium': 'medium', '2': 'medium',
          'low': 'low', '3': 'low'
        };
        const newPriority = priorityMap[priorityMatch[1]];
        
        try {
          const response = await fetch(`/api/tasks/${context.taskForPriorityChange.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: newPriority }),
          });

          if (response.ok) {
            setContext({});
            return `✅ Priority updated successfully!\n\nTask: "${context.taskForPriorityChange.title}"\nNew Priority: ${newPriority.toUpperCase()}`;
          }
          setContext({});
          return '❌ Failed to update priority. Please try again.';
        } catch (error) {
          setContext({});
          return '❌ Error updating priority: ' + (error as Error).message;
        }
      }
      return '❌ Invalid priority. Please respond with:\n1. High\n2. Medium\n3. Low';
    }

    // Check for priority change request
    if ((lowerMessage.includes('priority') || lowerMessage.includes('importance')) && 
        (lowerMessage.includes('change') || lowerMessage.includes('update') || 
         lowerMessage.includes('modify') || lowerMessage.includes('set'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          return '❌ Failed to fetch tasks.';
        }

        const tasks = await response.json();
        if (tasks.length === 0) {
          return '📋 You have no tasks to update.';
        }

        // Check if referring to a task from context
        if (context.lastTaskId && context.lastTaskTitle) {
          setContext({ 
            ...context, 
            awaitingPriorityChange: true,
            taskForPriorityChange: { id: context.lastTaskId, title: context.lastTaskTitle }
          });
          const task = tasks.find((t: any) => t._id === context.lastTaskId);
          const currentPriority = task ? ` (current: ${task.priority})` : '';
          return `📝 What priority would you like to set for "${context.lastTaskTitle}"${currentPriority}?\n\n` +
                 `1. High - Urgent and important\n` +
                 `2. Medium - Normal priority\n` +
                 `3. Low - Can wait\n\n` +
                 `Reply with the number or priority name.`;
        }

        // Try to extract task identifier from message
        const numberMatch = userMessage.match(/(?:task|priority)\s*(\d+)/i);
        const titleMatch = userMessage.match(/(?:change|update|set|modify).*?priority.*?(?:for|of)\s+(.*?)(?:\s+to|\s+as|$)/i);

        let selectedTask = null;

        if (numberMatch) {
          const taskNumber = parseInt(numberMatch[1]) - 1;
          if (taskNumber >= 0 && taskNumber < tasks.length) {
            selectedTask = tasks[taskNumber];
          }
        } else if (titleMatch) {
          const searchTitle = titleMatch[1].trim().toLowerCase();
          selectedTask = tasks.find((t: any) => 
            t.title.toLowerCase().includes(searchTitle)
          );
        }

        if (selectedTask) {
          setContext({ 
            awaitingPriorityChange: true,
            taskForPriorityChange: { id: selectedTask.id, title: selectedTask.title }
          });
          return `📝 What priority would you like to set for "${selectedTask.title}" (current: ${selectedTask.priority})?\n\n` +
                 `1. High - Urgent and important\n` +
                 `2. Medium - Normal priority\n` +
                 `3. Low - Can wait\n\n` +
                 `Reply with the number or priority name.`;
        }

        // Show task list for selection - store in context for button handling
        setContext({ awaitingTaskSelection: true, availableTasks: tasks.slice(0, 10) });
        let result = '📝 Which task would you like to change the priority for?\n\n';
        tasks.slice(0, 10).forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : 
                              task.priority === 'low' ? '🟢' : '🟡';
          result += `${index + 1}. ${task.title} ${priorityEmoji} (${task.priority})\n`;
        });
        result += '\nReply with the task number or title.';
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Create task - more flexible matching
    if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new task')) {
      try {
        // Try multiple patterns to extract task title
        let title = null;
        const patterns = [
          /(?:create|add|new)(?: a| an)? task[:\s]+(.*?)$/i,
          /(?:create|add)(?: a| an)?[:\s]+(.*?)$/i,
        ];
        
        for (const pattern of patterns) {
          const match = userMessage.match(pattern);
          if (match && match[1].trim()) {
            title = match[1].trim();
            break;
          }
        }
        
        if (!title || title.length < 2) {
          return '📝 What would you like to name this task?\n\nPlease tell me the task title, for example:\n• "Create task: Buy groceries"\n• "Add a new task: Meeting at 3pm"';
        }
        
        const priority = lowerMessage.includes('high') ? 'high' : 
                        lowerMessage.includes('low') ? 'low' : 'medium';

        const response = await fetch('/api/tasks', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            priority,
            status: 'pending',
            description: `Created via AI Assistant`
          }),
        });

        if (response.ok) {
          const createdTask = await response.json();
          setContext({ lastTaskId: createdTask.id, lastTaskTitle: title });
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
    if (lowerMessage.includes('delete')) {
      try {
        // First, get all tasks to allow deletion by number or title
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          return '❌ Failed to fetch tasks for deletion.';
        }

        const tasks = await response.json();
        if (tasks.length === 0) {
          return '📋 You have no tasks to delete.';
        }

        // Try to extract task identifier (number or title)
        // Match patterns like: "delete 1", "delete task 1", "delete fee payment", "delete task: fee payment"
        const numberMatch = userMessage.match(/delete(?:\s+task)?\s+(\d+)/i);
        const titleMatch = userMessage.match(/delete(?:\s+task)?[:\s]+(.*?)$/i);

        let taskToDelete = null;

        if (numberMatch) {
          const taskNumber = parseInt(numberMatch[1]) - 1;
          if (taskNumber >= 0 && taskNumber < tasks.length) {
            taskToDelete = tasks[taskNumber];
          }
        } else if (titleMatch) {
          const searchTitle = titleMatch[1].trim().toLowerCase();
          // Filter out common words to get actual task title
          const cleanTitle = searchTitle.replace(/^(the|a|an|task)\s+/i, '');
          taskToDelete = tasks.find((t: any) => 
            t.title.toLowerCase().includes(cleanTitle)
          );
        }

        if (!taskToDelete) {
          // Show tasks with numbers for easy deletion - store in context for button handling
          setContext({ awaitingTaskDeletion: true, availableTasks: tasks.slice(0, 10) });
          let result = '🗑️ Which task would you like to delete?\n\n';
          tasks.slice(0, 10).forEach((task: any, index: number) => {
            result += `${index + 1}. ${task.title} (${task.status})\n`;
          });
          result += '\nClick a task below or type the number/title.';
          return result;
        }

        // Delete the task
        const deleteResponse = await fetch(`/api/tasks/${taskToDelete.id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (deleteResponse.ok) {
          setContext({});
          return `✅ Task deleted successfully!\n\nDeleted: "${taskToDelete.title}"`;
        }
        
        // Get more details about the error
        const errorData = await deleteResponse.json().catch(() => ({}));
        console.error('Delete failed:', { status: deleteResponse.status, error: errorData });
        return `❌ Failed to delete task. ${errorData.message || 'Status: ' + deleteResponse.status}`;
      } catch (error) {
        console.error('Delete error:', error);
        return '❌ Error deleting task: ' + (error as Error).message;
      }
    }

    // Update/Modify status
    if (lowerMessage.includes('mark') || lowerMessage.includes('complete') || 
        lowerMessage.includes('finish') || lowerMessage.includes('done') ||
        (lowerMessage.includes('update') && !lowerMessage.includes('delete')) ||
        (lowerMessage.includes('modify') && !lowerMessage.includes('delete')) ||
        (lowerMessage.includes('change') && !lowerMessage.includes('delete'))) {
      try {
        // Get all tasks
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          return '❌ Failed to fetch tasks for update.';
        }

        const tasks = await response.json();
        if (tasks.length === 0) {
          return '📋 You have no tasks to update.';
        }

        // Try to extract task identifier - more flexible patterns
        const numberMatch = userMessage.match(/(?:mark|complete)(?:\s+task)?\s+(\d+)/i);
        const titleMatch = userMessage.match(/(?:mark|complete)(?:\s+task)?[:\s]+(.*?)(?:\s+as\s+|\s+to\s+|$)/i);

        let taskToUpdate = null;

        if (numberMatch) {
          const taskNumber = parseInt(numberMatch[1]) - 1;
          if (taskNumber >= 0 && taskNumber < tasks.length) {
            taskToUpdate = tasks[taskNumber];
          }
        } else if (titleMatch) {
          const searchTitle = titleMatch[1].trim().toLowerCase();
          const cleanTitle = searchTitle.replace(/^(the|a|an|task)\s+/i, '');
          taskToUpdate = tasks.find((t: any) => 
            t.title.toLowerCase().includes(cleanTitle) && t.status !== 'completed'
          );
        }

        if (!taskToUpdate) {
          const incompleteTasks = tasks.filter((t: any) => t.status !== 'completed');
          if (incompleteTasks.length === 0) {
            return '✅ All tasks are already completed!';
          }
          // Store in context for button handling
          setContext({ awaitingTaskCompletion: true, availableTasks: incompleteTasks.slice(0, 10) });
          let result = '✏️ Which task would you like to mark as complete?\n\n';
          incompleteTasks.slice(0, 10).forEach((task: any, index: number) => {
            result += `${index + 1}. ${task.title} (${task.status})\n`;
          });
          result += '\nClick a task below or type the number/title.';
          return result;
        }

        // Update the task status
        const updateResponse = await fetch(`/api/tasks/${taskToUpdate.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });

        if (updateResponse.ok) {
          setContext({ lastTaskId: taskToUpdate.id, lastTaskTitle: taskToUpdate.title });
          return `✅ Task marked as completed!\n\nCompleted: "${taskToUpdate.title}"`;
        }
        
        const errorData = await updateResponse.json().catch(() => ({}));
        return `❌ Failed to update task. ${errorData.message || 'Please try again.'}`;
      } catch (error) {
        return '❌ Error updating task: ' + (error as Error).message;
      }
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 Here's what I can help you with:\n\n` +
             `1️⃣ Create tasks: "Create a task: Buy groceries"\n` +
             `2️⃣ View tasks: "Show me my tasks" or "List all tasks"\n` +
             `3️⃣ Delete tasks: "Delete task 1" or "Delete task: Buy groceries"\n` +
             `4️⃣ Mark as complete: "Mark task 1 as complete"\n` +
             `5️⃣ Change priority: "Change priority of task 1" or "Set priority"\n` +
             `6️⃣ Get statistics: "Show task stats"\n` +
             `7️⃣ Set priority when creating: Include "high", "medium", or "low"\n\n` +
             `Try asking me to create, view, update, or delete tasks!`;
    }

    // Intelligent keyword-based fallback
    if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
      return '📝 I can help you create a task!\n\nPlease specify the task details like:\n• "Create task: Buy groceries"\n• "Add a new task: Call dentist"\n\nWhat would you like to create?';
    }

    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const tasks = await response.json();
          if (tasks.length === 0) {
            return '📋 You have no tasks to delete.';
          }
          let result = '🗑️ Which task would you like to delete?\n\n';
          tasks.slice(0, 10).forEach((task: any, index: number) => {
            result += `${index + 1}. ${task.title} (${task.status})\n`;
          });
          result += '\nReply with the task number or title you want to delete.';
          return result;
        }
      } catch (error) {
        return '❌ Error fetching tasks. Please try: "delete task [number]" or "delete [task title]"';
      }
    }

    if (lowerMessage.includes('update') || lowerMessage.includes('modify') || 
        lowerMessage.includes('change') || lowerMessage.includes('edit')) {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const tasks = await response.json();
          const incompleteTasks = tasks.filter((t: any) => t.status !== 'completed');
          if (incompleteTasks.length === 0) {
            return '✅ All tasks are already completed!';
          }
          let result = '✏️ Which task would you like to update?\n\n';
          incompleteTasks.slice(0, 10).forEach((task: any, index: number) => {
            result += `${index + 1}. ${task.title} (${task.status})\n`;
          });
          result += '\nReply with "complete [number]" or "complete [task title]"';
          return result;
        }
      } catch (error) {
        return '❌ Error fetching tasks. Please try: "mark task [number] as complete"';
      }
    }

    if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('view')) {
      return 'I can show you different information:\n\n' +
             '• "Show my tasks" - View all your tasks\n' +
             '• "Show task statistics" - Get task overview\n\n' +
             'What would you like to see?';
    }

    // Default response
    return `I'm not sure how to help with that. Try asking me to:\n\n` +
           `• "Create a task: [task name]"\n` +
           `• "Show my tasks"\n` +
           `• "Delete [task number or title]"\n` +
           `• "Complete [task number or title]"\n` +
           `• "Change priority"\n` +
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
                  
                  {/* Show task selection buttons for priority change */}
                  {message.role === 'assistant' && context.awaitingTaskSelection && 
                   context.availableTasks && messages[messages.length - 1]?.id === message.id && (
                    <div className="mt-3 space-y-2">
                      {context.availableTasks.map((task: any, index: number) => {
                        const priorityEmoji = task.priority === 'high' ? '🔴' : 
                                            task.priority === 'low' ? '🟢' : '🟡';
                        return (
                          <button
                            key={task.id}
                            onClick={() => {
                              setContext({ 
                                awaitingPriorityChange: true,
                                taskForPriorityChange: { id: task.id, title: task.title }
                              });
                              const msg: Message = {
                                id: Date.now().toString(),
                                role: 'user',
                                content: `Task ${index + 1}`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, msg]);
                              
                              const responseMsg: Message = {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: `📝 What priority would you like to set for "${task.title}" (current: ${task.priority})?\n\n` +
                                        `1. High - Urgent and important\n` +
                                        `2. Medium - Normal priority\n` +
                                        `3. Low - Can wait\n\n` +
                                        `Click a priority below or type the number.`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, responseMsg]);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-blue-200 dark:border-blue-800"
                          >
                            {index + 1}. {task.title} {priorityEmoji}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Show task selection buttons for deletion */}
                  {message.role === 'assistant' && context.awaitingTaskDeletion && 
                   context.availableTasks && messages[messages.length - 1]?.id === message.id && (
                    <div className="mt-3 space-y-2">
                      {context.availableTasks.map((task: any, index: number) => {
                        const statusEmoji = task.status === 'completed' ? '✅' : 
                                          task.status === 'in-progress' ? '🔄' : '⏳';
                        return (
                          <button
                            key={task.id}
                            onClick={async () => {
                              const userMsg: Message = {
                                id: Date.now().toString(),
                                role: 'user',
                                content: `Delete task ${index + 1}`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, userMsg]);
                              setLoading(true);

                              try {
                                const deleteResponse = await fetch(`/api/tasks/${task.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                });

                                let responseContent = '';
                                if (deleteResponse.ok) {
                                  responseContent = `✅ Task deleted successfully!\n\nDeleted: "${task.title}"`;
                                } else {
                                  const errorData = await deleteResponse.json().catch(() => ({}));
                                  console.error('Delete failed:', { status: deleteResponse.status, error: errorData });
                                  responseContent = `❌ Failed to delete task. ${errorData.message || 'Status: ' + deleteResponse.status}`;
                                }

                                const assistantMsg: Message = {
                                  id: (Date.now() + 1).toString(),
                                  role: 'assistant',
                                  content: responseContent,
                                  timestamp: new Date(),
                                };
                                setMessages(prev => [...prev, assistantMsg]);
                                setContext({});
                              } catch (error) {
                                console.error('Delete error:', error);
                                const errorMsg: Message = {
                                  id: (Date.now() + 1).toString(),
                                  role: 'assistant',
                                  content: '❌ Error deleting task: ' + (error as Error).message,
                                  timestamp: new Date(),
                                };
                                setMessages(prev => [...prev, errorMsg]);
                                setContext({});
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-red-200 dark:border-red-800"
                          >
                            {statusEmoji} {index + 1}. {task.title}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Show task selection buttons for completion */}
                  {message.role === 'assistant' && context.awaitingTaskCompletion && 
                   context.availableTasks && messages[messages.length - 1]?.id === message.id && (
                    <div className="mt-3 space-y-2">
                      {context.availableTasks.map((task: any, index: number) => {
                        const statusEmoji = task.status === 'in-progress' ? '🔄' : '⏳';
                        return (
                          <button
                            key={task.id}
                            onClick={async () => {
                              const userMsg: Message = {
                                id: Date.now().toString(),
                                role: 'user',
                                content: `Complete task ${index + 1}`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, userMsg]);
                              setLoading(true);

                              try {
                                const updateResponse = await fetch(`/api/tasks/${task.id}`, {
                                  method: 'PATCH',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'completed' }),
                                });

                                let responseContent = '';
                                if (updateResponse.ok) {
                                  responseContent = `✅ Task marked as completed!\n\nCompleted: "${task.title}"`;
                                } else {
                                  const errorData = await updateResponse.json().catch(() => ({}));
                                  responseContent = `❌ Failed to update task. ${errorData.message || 'Status: ' + updateResponse.status}`;
                                }

                                const assistantMsg: Message = {
                                  id: (Date.now() + 1).toString(),
                                  role: 'assistant',
                                  content: responseContent,
                                  timestamp: new Date(),
                                };
                                setMessages(prev => [...prev, assistantMsg]);
                                setContext({ lastTaskId: task.id, lastTaskTitle: task.title });
                              } catch (error) {
                                const errorMsg: Message = {
                                  id: (Date.now() + 1).toString(),
                                  role: 'assistant',
                                  content: '❌ Error updating task: ' + (error as Error).message,
                                  timestamp: new Date(),
                                };
                                setMessages(prev => [...prev, errorMsg]);
                                setContext({});
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-green-200 dark:border-green-800"
                          >
                            {statusEmoji} {index + 1}. {task.title}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Show priority selection buttons if awaiting priority */}
                  {message.role === 'assistant' && context.awaitingPriorityChange && 
                   messages[messages.length - 1]?.id === message.id && (
                    <div className="mt-3 space-y-2">
                      {['High', 'Medium', 'Low'].map((priority, index) => {
                        const emoji = priority === 'High' ? '🔴' : priority === 'Medium' ? '🟡' : '🟢';
                        return (
                          <button
                            key={priority}
                            onClick={async () => {
                              if (!context.taskForPriorityChange) return;
                              
                              const userMsg: Message = {
                                id: Date.now().toString(),
                                role: 'user',
                                content: priority,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, userMsg]);
                              setLoading(true);

                              try {
                                const response = await fetch(`/api/tasks/${context.taskForPriorityChange.id}`, {
                                  method: 'PATCH',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ priority: priority.toLowerCase() }),
                                });

                                let responseContent = '';
                                if (response.ok) {
                                  responseContent = `✅ Priority updated successfully!\n\nTask: "${context.taskForPriorityChange.title}"\nNew Priority: ${priority.toUpperCase()}`;
                                } else {
                                  const errorData = await response.json().catch(() => ({}));
                                  console.error('Priority update failed:', { status: response.status, error: errorData });
                                  responseContent = `❌ Failed to update priority. ${errorData.message || 'Status: ' + response.status}`;
                                }

                                const assistantMsg: Message = {
                                  id: (Date.now() + 1).toString(),
                                  role: 'assistant',
                                  content: responseContent,
                                  timestamp: new Date(),
                                };
                                setMessages(prev => [...prev, assistantMsg]);
                                setContext({});
                              } catch (error) {
                                console.error('Priority update error:', error);
                                const errorMsg: Message = {
                                  id: (Date.now() + 1).toString(),
                                  role: 'assistant',
                                  content: '❌ Error updating priority: ' + (error as Error).message,
                                  timestamp: new Date(),
                                };
                                setMessages(prev => [...prev, errorMsg]);
                                setContext({});
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 text-gray-900 dark:text-gray-100 transition-all text-sm border border-blue-200 dark:border-blue-800 font-medium"
                          >
                            {emoji} {index + 1}. {priority}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <span className="text-xs opacity-70 mt-2 block">
                    {mounted ? message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
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
