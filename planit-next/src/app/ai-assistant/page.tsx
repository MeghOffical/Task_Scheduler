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
  awaitingStatusChange?: boolean;
  selectedTask?: any;
  step?: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI task assistant. I can help you:\n\n• Create and manage tasks\n• Filter tasks by priority, status, or due date\n• Change task status (pending, in progress, completed)\n• Delete tasks\n• Get task statistics\n\n**Try these commands:**\n- \"Show high priority tasks\"\n- \"Show pending tasks\"\n- \"Show overdue tasks\"\n- \"Create a task: Buy groceries\"\n- \"Change status\"\n- \"Show my tasks\"",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [context, setContext] = useState<ConversationContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const shouldAutoScroll = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      // Scroll within the messages container, not the entire page
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Don't scroll on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check if user has sent at least one message
    const hasUserMessage = messages.some(msg => msg.role === 'user');
    const lastMessage = messages[messages.length - 1];

    // After user sends their first message and assistant responds,
    // enable auto-scrolling for subsequent messages
    if (hasUserMessage && lastMessage?.role === 'assistant') {
      shouldAutoScroll.current = true;
    }

    // Only scroll if auto-scroll is enabled (after first exchange)
    if (shouldAutoScroll.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Helper function to use Gemini AI for intent understanding
  const getAIIntent = async (userMessage: string): Promise<{
    intent: string;
    action?: string;
    taskTitle?: string;
    priority?: string;
    status?: string;
    filterType?: string;
    filterValue?: string;
  }> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an intent classifier for a task management system. Analyze the user's message and return ONLY a JSON object with these fields:
{
  "intent": "task_operation|filter_tasks|greeting|help|other",
  "action": "create|delete|update|show|change_status|change_priority" (if intent is task_operation),
  "taskTitle": "extracted task title" (if creating/deleting/updating a task),
  "priority": "high|medium|low" (if mentioned),
  "status": "pending|in-progress|completed" (if mentioned),
  "filterType": "priority|status|dueDate" (if intent is filter_tasks),
  "filterValue": "high|medium|low|pending|in-progress|completed|overdue|today" (if filtering)
}

Handle misspellings, synonyms, and natural language. Examples:
- "crete tsk buy groceries" -> {"intent":"task_operation","action":"create","taskTitle":"buy groceries"}
- "shw high priorty tasks" -> {"intent":"filter_tasks","filterType":"priority","filterValue":"high"}
- "delet task 1" -> {"intent":"task_operation","action":"delete"}
- "mark as dne" -> {"intent":"task_operation","action":"change_status","status":"completed"}
- "dispaly urgent items" -> {"intent":"filter_tasks","filterType":"priority","filterValue":"high"}

Return ONLY valid JSON, no other text.`
            },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.message || data.response || '';
        
        // Extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        }
      }
    } catch (error) {
      console.error('AI intent parsing error:', error);
    }
    
    return { intent: 'unknown' };
  };

  const processUserRequest = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Handle status change flow - Step 2: Status selection
    if (context.awaitingStatusChange && context.step === 'selectStatus' && context.selectedTask) {
      const statusMap: { [key: string]: string } = {
        'pending': 'pending', '1': 'pending',
        'progress': 'in-progress', 'in progress': 'in-progress', 'in-progress': 'in-progress', '2': 'in-progress',
        'completed': 'completed', 'complete': 'completed', 'done': 'completed', '3': 'completed'
      };
      
      let newStatus = '';
      for (const [key, value] of Object.entries(statusMap)) {
        if (lowerMessage.includes(key)) {
          newStatus = value;
          break;
        }
      }
      
      if (!newStatus) {
        return '❌ Invalid status. Please select:\n1️⃣ Pending\n2️⃣ In Progress\n3️⃣ Completed';
      }
      
      try {
        const response = await fetch(`/api/tasks/${context.selectedTask.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setContext({});
          const statusLabel = newStatus === 'in-progress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
          return `✅ **Task updated successfully!**\n\n"${context.selectedTask.title}" is now marked as **${statusLabel}**.`;
        }
        setContext({});
        return '❌ Failed to update task status. Please try again.';
      } catch (error) {
        setContext({});
        return '❌ Error updating task: ' + (error as Error).message;
      }
    }

    // Handle status change flow - Step 1: Task selection
    if (context.awaitingStatusChange && context.step === 'selectTask' && context.availableTasks) {
      const taskNumber = parseInt(userMessage.trim());
      let selectedTask = null;
      
      if (!isNaN(taskNumber) && taskNumber > 0 && taskNumber <= context.availableTasks.length) {
        selectedTask = context.availableTasks[taskNumber - 1];
      } else {
        // Try to match by title
        selectedTask = context.availableTasks.find((t: any) => 
          t.title.toLowerCase().includes(lowerMessage) || lowerMessage.includes(t.title.toLowerCase())
        );
      }
      
      if (selectedTask) {
        setContext({ 
          awaitingStatusChange: true, 
          selectedTask: selectedTask, 
          step: 'selectStatus' 
        });
        return `✅ You selected: **${selectedTask.title}**\n\n📌 **What status would you like it to have?**\n\nPlease select:\n1️⃣ Pending\n2️⃣ In Progress\n3️⃣ Completed\n\nClick a status button or type 1, 2, or 3.`;
      }
      
      return '❌ Invalid selection. Please enter a valid task number or title.';
    }

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

    // ====== AI-POWERED INTENT DETECTION (handles misspellings and natural language) ======
    const aiIntent = await getAIIntent(userMessage);
    
    // Handle AI-detected filter tasks intent
    if (aiIntent.intent === 'filter_tasks' && aiIntent.filterType && aiIntent.filterValue) {
      const { filterType, filterValue } = aiIntent;
      
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          return '❌ Failed to fetch tasks.';
        }
        
        const tasks = await response.json();
        let filteredTasks: any[] = [];
        let filterDescription = '';
        
        if (filterType === 'priority') {
          filteredTasks = tasks.filter((task: any) => task.priority === filterValue);
          filterDescription = `${filterValue.toUpperCase()} priority`;
        } else if (filterType === 'status') {
          const statusValue = filterValue === 'in-progress' ? 'in-progress' : filterValue;
          filteredTasks = tasks.filter((task: any) => task.status === statusValue);
          filterDescription = statusValue.toUpperCase().replace('-', ' ');
        } else if (filterType === 'dueDate') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (filterValue === 'overdue') {
            filteredTasks = tasks.filter((task: any) => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate < today && task.status !== 'completed';
            });
            filterDescription = 'OVERDUE';
          } else if (filterValue === 'today') {
            filteredTasks = tasks.filter((task: any) => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate.getTime() === today.getTime();
            });
            filterDescription = 'DUE TODAY';
          }
        }
        
        if (filteredTasks.length === 0) {
          return `📋 No ${filterDescription} tasks found.`;
        }
        
        let result = `📋 ${filterDescription} Tasks (${filteredTasks.length}):\n\n`;
        filteredTasks.slice(0, 10).forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡';
          const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title}\n`;
          result += `   ${priorityEmoji} Priority: ${task.priority} | Status: ${task.status}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        
        if (filteredTasks.length > 10) {
          result += `... and ${filteredTasks.length - 10} more tasks`;
        }
        
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }
    
    // Handle AI-detected task creation
    if (aiIntent.intent === 'task_operation' && aiIntent.action === 'create' && aiIntent.taskTitle) {
      try {
        const priority = aiIntent.priority || 'medium';
        
        const response = await fetch('/api/tasks', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: aiIntent.taskTitle, 
            priority,
            status: 'pending',
            description: `Created via AI Assistant`
          }),
        });

        if (response.ok) {
          const createdTask = await response.json();
          setContext({ lastTaskId: createdTask.id, lastTaskTitle: aiIntent.taskTitle });
          return `✅ Task created successfully!\n\nTitle: ${aiIntent.taskTitle}\nPriority: ${priority}\nStatus: Pending`;
        }
        return '❌ Failed to create task. Please try again.';
      } catch (error) {
        return '❌ Error creating task: ' + (error as Error).message;
      }
    }
    
    // Handle AI-detected status change
    if (aiIntent.intent === 'task_operation' && aiIntent.action === 'change_status') {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          return '❌ Failed to fetch tasks.';
        }

        const tasks = await response.json();
        if (tasks.length === 0) {
          return '📋 You have no tasks to update.';
        }

        // If we have a clear status from AI and a task in context
        if (aiIntent.status && context.lastTaskId && context.lastTaskTitle) {
          try {
            const updateResponse = await fetch(`/api/tasks/${context.lastTaskId}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: aiIntent.status }),
            });

            if (updateResponse.ok) {
              const statusEmoji = aiIntent.status === 'completed' ? '✅' : 
                                 aiIntent.status === 'in-progress' ? '🔄' : '⏳';
              return `${statusEmoji} Status updated successfully!\n\nTask: "${context.lastTaskTitle}"\nNew Status: ${aiIntent.status.toUpperCase().replace('-', ' ')}`;
            }
          } catch (error) {
            console.error('Error updating status:', error);
          }
        }
        
        // Otherwise start the two-step flow
        setContext({ awaitingStatusChange: true, step: 'selectTask', availableTasks: tasks.slice(0, 10) });
        let result = '📝 Which task would you like to update?\n\n';
        tasks.slice(0, 10).forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡';
          const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title} ${priorityEmoji}\n`;
        });
        result += '\nReply with the task number or title.';
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // ====== FALLBACK TO PATTERN MATCHING (for exact commands) ======

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

    // Filter by priority
    if ((lowerMessage.includes('high priority') || (lowerMessage.includes('high') && lowerMessage.includes('priority'))) && 
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const highPriorityTasks = tasks.filter((t: any) => t.priority === 'high');
        
        if (highPriorityTasks.length === 0) {
          return '📋 You have no high priority tasks.';
        }

        let result = `🔴 **High Priority Tasks (${highPriorityTasks.length} total):**\n\n`;
        highPriorityTasks.forEach((task: any, index: number) => {
          const statusEmoji = task.status === 'completed' ? '✅' : 
                            task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title}\n`;
          result += `   Status: ${task.status}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    if ((lowerMessage.includes('medium priority') || (lowerMessage.includes('medium') && lowerMessage.includes('priority'))) && 
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const mediumPriorityTasks = tasks.filter((t: any) => t.priority === 'medium');
        
        if (mediumPriorityTasks.length === 0) {
          return '📋 You have no medium priority tasks.';
        }

        let result = `🟡 **Medium Priority Tasks (${mediumPriorityTasks.length} total):**\n\n`;
        mediumPriorityTasks.forEach((task: any, index: number) => {
          const statusEmoji = task.status === 'completed' ? '✅' : 
                            task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title}\n`;
          result += `   Status: ${task.status}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    if ((lowerMessage.includes('low priority') || (lowerMessage.includes('low') && lowerMessage.includes('priority'))) && 
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const lowPriorityTasks = tasks.filter((t: any) => t.priority === 'low');
        
        if (lowPriorityTasks.length === 0) {
          return '📋 You have no low priority tasks.';
        }

        let result = `🟢 **Low Priority Tasks (${lowPriorityTasks.length} total):**\n\n`;
        lowPriorityTasks.forEach((task: any, index: number) => {
          const statusEmoji = task.status === 'completed' ? '✅' : 
                            task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title}\n`;
          result += `   Status: ${task.status}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Filter by status - pending
    if (lowerMessage.includes('pending') && !lowerMessage.includes('change') && !lowerMessage.includes('status') &&
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
        
        if (pendingTasks.length === 0) {
          return '📋 You have no pending tasks.';
        }

        let result = `⏳ **Pending Tasks (${pendingTasks.length} total):**\n\n`;
        pendingTasks.forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : 
                              task.priority === 'low' ? '🟢' : '🟡';
          result += `${index + 1}. ${task.title} ${priorityEmoji}\n`;
          result += `   Priority: ${task.priority}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Filter by status - in progress
    if ((lowerMessage.includes('in progress') || lowerMessage.includes('in-progress') || lowerMessage.includes('ongoing')) &&
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress');
        
        if (inProgressTasks.length === 0) {
          return '📋 You have no tasks in progress.';
        }

        let result = `🔄 **In Progress Tasks (${inProgressTasks.length} total):**\n\n`;
        inProgressTasks.forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : 
                              task.priority === 'low' ? '🟢' : '🟡';
          result += `${index + 1}. ${task.title} ${priorityEmoji}\n`;
          result += `   Priority: ${task.priority}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Filter by status - completed
    if (lowerMessage.includes('completed') && !lowerMessage.includes('mark') &&
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const completedTasks = tasks.filter((t: any) => t.status === 'completed');
        
        if (completedTasks.length === 0) {
          return '📋 You have no completed tasks.';
        }

        let result = `✅ **Completed Tasks (${completedTasks.length} total):**\n\n`;
        completedTasks.forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : 
                              task.priority === 'low' ? '🟢' : '🟡';
          result += `${index + 1}. ${task.title} ${priorityEmoji}\n`;
          result += `   Priority: ${task.priority}\n`;
          if (task.dueDate) {
            result += `   📅 Due: ${new Date(task.dueDate).toLocaleDateString()}\n`;
          }
          result += '\n';
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Filter by due date - overdue
    if ((lowerMessage.includes('overdue') || lowerMessage.includes('late')) && 
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdueTasks = tasks.filter((t: any) => {
          if (!t.dueDate || t.status === 'completed') return false;
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        });
        
        if (overdueTasks.length === 0) {
          return '✅ You have no overdue tasks!';
        }

        let result = `⚠️ **Overdue Tasks (${overdueTasks.length} total):**\n\n`;
        overdueTasks.forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : 
                              task.priority === 'low' ? '🟢' : '🟡';
          const statusEmoji = task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title} ${priorityEmoji}\n`;
          result += `   Status: ${task.status} | Priority: ${task.priority}\n`;
          result += `   📅 Was due: ${new Date(task.dueDate).toLocaleDateString()}\n\n`;
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Filter by due date - today
    if ((lowerMessage.includes('today') || lowerMessage.includes('due today')) && 
        (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('view') || lowerMessage.includes('task'))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) return '❌ Failed to fetch tasks.';
        
        const tasks = await response.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTasks = tasks.filter((t: any) => {
          if (!t.dueDate || t.status === 'completed') return false;
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
        
        if (todayTasks.length === 0) {
          return '📋 You have no tasks due today.';
        }

        let result = `📅 **Tasks Due Today (${todayTasks.length} total):**\n\n`;
        todayTasks.forEach((task: any, index: number) => {
          const priorityEmoji = task.priority === 'high' ? '🔴' : 
                              task.priority === 'low' ? '🟢' : '🟡';
          const statusEmoji = task.status === 'in-progress' ? '🔄' : '⏳';
          result += `${index + 1}. ${statusEmoji} ${task.title} ${priorityEmoji}\n`;
          result += `   Status: ${task.status} | Priority: ${task.priority}\n\n`;
        });
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // View all tasks (general case)
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

    // Check for "change status" or "update status" specifically (without task name)
    if ((lowerMessage === 'change status' || lowerMessage === 'update status' || 
         lowerMessage.match(/^(change|update)\s+status$/))) {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          return '❌ Failed to fetch tasks.';
        }

        const tasks = await response.json();
        if (tasks.length === 0) {
          return '📋 You have no tasks to update the status for.';
        }

        const allTasks = tasks.slice(0, 10);
        setContext({ awaitingStatusChange: true, availableTasks: allTasks, step: 'selectTask' });
        let result = '📋 **Which task\'s status would you like to change?**\n\n';
        allTasks.forEach((task: any, index: number) => {
          result += `${index + 1}. ${task.title} (${task.status})\n`;
        });
        result += '\nClick a task below or type the number/title.';
        return result;
      } catch (error) {
        return '❌ Error fetching tasks: ' + (error as Error).message;
      }
    }

    // Update/Modify status (with task identifier)
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
          const allTasks = tasks.slice(0, 10);
          if (allTasks.length === 0) {
            return '📋 You have no tasks to update.';
          }
          // Store in context for button handling - use status change flow
          setContext({ awaitingStatusChange: true, availableTasks: allTasks, step: 'selectTask' });
          let result = '📋 **Which task\'s status would you like to change?**\n\n';
          allTasks.forEach((task: any, index: number) => {
            result += `${index + 1}. ${task.title} (${task.status})\n`;
          });
          result += '\nClick a task below or type the number/title.';
          return result;
        }

        // If we have a task but no new status specified, ask for status selection
        if (!lowerMessage.includes('pending') && !lowerMessage.includes('progress') && 
            !lowerMessage.includes('completed') && !lowerMessage.includes('done')) {
          setContext({ 
            awaitingStatusChange: true, 
            selectedTask: taskToUpdate, 
            step: 'selectStatus' 
          });
          return `✅ You selected: **${taskToUpdate.title}**\n\n📌 **What status would you like it to have?**\n\nPlease select:\n1️⃣ Pending\n2️⃣ In Progress\n3️⃣ Completed\n\nClick a status button or type 1, 2, or 3.`;
        }

        // Determine the new status
        let newStatus = 'completed';
        if (lowerMessage.includes('pending') || lowerMessage.includes('1')) {
          newStatus = 'pending';
        } else if (lowerMessage.includes('progress') || lowerMessage.includes('2')) {
          newStatus = 'in-progress';
        } else if (lowerMessage.includes('completed') || lowerMessage.includes('done') || lowerMessage.includes('complete') || lowerMessage.includes('3')) {
          newStatus = 'completed';
        }

        // Update the task status
        const updateResponse = await fetch(`/api/tasks/${taskToUpdate.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (updateResponse.ok) {
          setContext({ lastTaskId: taskToUpdate.id, lastTaskTitle: taskToUpdate.title });
          const statusLabel = newStatus === 'in-progress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
          return `✅ **Task updated successfully!**\n\n"${taskToUpdate.title}" is now marked as **${statusLabel}**.`;
        }
        
        const errorData = await updateResponse.json().catch(() => ({}));
        return `❌ Failed to update task. ${errorData.message || 'Please try again.'}`;
      } catch (error) {
        return '❌ Error updating task: ' + (error as Error).message;
      }
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 **Here's what I can help you with:**\n\n` +
             `**Task Management:**\n` +
             `• Create tasks: "Create a task: Buy groceries"\n` +
             `• View all tasks: "Show me my tasks"\n` +
             `• Delete tasks: "Delete task 1"\n` +
             `• Change status: "Change status" (I'll guide you)\n` +
             `• Mark complete: "Mark task 1 as complete"\n` +
             `• Change priority: "Change priority"\n\n` +
             `**Filter & Classify Tasks:**\n` +
             `• By priority: "Show high priority tasks"\n` +
             `• By status: "Show pending tasks" or "Show completed tasks"\n` +
             `• By due date: "Show overdue tasks" or "Show tasks due today"\n\n` +
             `**Statistics:**\n` +
             `• View stats: "Show task statistics"\n\n` +
             `Try asking me anything!`;
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

    // For greetings and general conversation, use AI
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'];
    const isGreeting = greetings.some(greeting => lowerMessage === greeting || lowerMessage.startsWith(greeting + ' '));
    
    if (isGreeting || lowerMessage.includes('how are you') || lowerMessage.includes('what can you do') || 
        lowerMessage.includes('who are you') || lowerMessage.includes('introduce yourself')) {
      // Use AI for natural conversation
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are Plan-It, a friendly productivity assistant. When greeted, introduce yourself warmly and briefly explain you can help with task management, scheduling, and productivity. Keep responses concise and friendly.`
              },
              { role: 'user', content: userMessage }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.message || data.response || 'Hello! I\'m Plan-It, your productivity assistant. How can I help you today?';
        }
      } catch (error) {
        console.error('AI chat error:', error);
      }
      
      // Fallback greeting
      return `👋 Hello! I'm Plan-It, your productivity assistant.\n\n` +
             `I can help you:\n` +
             `• Create and manage tasks\n` +
             `• Check your schedule\n` +
             `• View task statistics\n` +
             `• Set priorities and deadlines\n\n` +
             `What would you like to do today?`;
    }

    // Default response for unrecognized commands
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

  const processAndRespond = async (messageText: string) => {
    setLoading(true);
    try {
      const response = await processUserRequest(messageText);
      
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
    const messageToProcess = input;
    setInput('');
    
    await processAndRespond(messageToProcess);
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
        <div ref={messagesContainerRef} className="flex-1 glass-panel rounded-2xl p-6 overflow-y-auto mb-4">
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

                  {/* Show task selection buttons for status change - Step 1 */}
                  {message.role === 'assistant' && context.awaitingStatusChange && 
                   context.step === 'selectTask' && context.availableTasks && 
                   messages[messages.length - 1]?.id === message.id && (
                    <div className="mt-3 space-y-2">
                      {context.availableTasks.map((task: any, index: number) => {
                        const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '🔄' : '⏳';
                        return (
                          <button
                            key={task.id}
                            onClick={() => {
                              const userMsg: Message = {
                                id: Date.now().toString(),
                                role: 'user',
                                content: `${index + 1}`,
                                timestamp: new Date(),
                              };
                              setMessages(prev => [...prev, userMsg]);
                              processAndRespond(`${index + 1}`);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-blue-200 dark:border-blue-800"
                          >
                            {statusEmoji} {index + 1}. {task.title}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Show status selection buttons - Step 2 */}
                  {message.role === 'assistant' && context.awaitingStatusChange && 
                   context.step === 'selectStatus' && context.selectedTask && 
                   messages[messages.length - 1]?.id === message.id && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => {
                          const userMsg: Message = {
                            id: Date.now().toString(),
                            role: 'user',
                            content: '1️⃣ Pending',
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, userMsg]);
                          processAndRespond('1');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-yellow-200 dark:border-yellow-800"
                      >
                        ⏳ Pending
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = {
                            id: Date.now().toString(),
                            role: 'user',
                            content: '2️⃣ In Progress',
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, userMsg]);
                          processAndRespond('2');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-blue-200 dark:border-blue-800"
                      >
                        🔄 In Progress
                      </button>
                      <button
                        onClick={() => {
                          const userMsg: Message = {
                            id: Date.now().toString(),
                            role: 'user',
                            content: '3️⃣ Completed',
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, userMsg]);
                          processAndRespond('3');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-900 dark:text-gray-100 transition-colors text-sm border border-green-200 dark:border-green-800"
                      >
                        ✅ Completed
                      </button>
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
