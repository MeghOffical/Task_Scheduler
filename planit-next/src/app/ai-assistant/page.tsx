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
  conversationHistory?: Array<{ role: string; content: string }>;
  pendingAction?: {
    type: 'select_task' | 'select_status' | 'select_priority';
    tasks?: any[];
    selectedTask?: any;
  };
};

// Helper function to parse natural language dates
const parseDueDate = (text: string): Date | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lower = text.toLowerCase();
  
  // Check for "tomorrow"
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Check for "day after tomorrow"
  if (lower.includes('day after tomorrow') || lower.includes('overmorrow')) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter;
  }
  
  // Check for "today"
  if (lower.includes('today')) {
    return today;
  }
  
  // Check for "next week"
  if (lower.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  // Check for specific days of the week (e.g., "next monday", "this friday")
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      // If the day has passed this week or is today, target next week
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysUntilTarget);
      return targetDate;
    }
  }
  
  // Check for "in X days"
  const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate;
  }
  
  // Try to parse various date formats
  // Format: DD/MM/YY or DD/MM/YYYY
  const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1]);
    const month = parseInt(dmyMatch[2]) - 1; // JS months are 0-indexed
    let year = parseInt(dmyMatch[3]);
    
    // Handle 2-digit year
    if (year < 100) {
      year += 2000;
    }
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Format: YYYY-MM-DD
  const ymdMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1]);
    const month = parseInt(ymdMatch[2]) - 1;
    const day = parseInt(ymdMatch[3]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Format: Month DD, YYYY or Month DD (e.g., "December 25" or "Dec 25, 2025")
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                     'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  for (let i = 0; i < monthNames.length; i++) {
    const fullPattern = new RegExp(`${monthNames[i]}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`, 'i');
    const abbrPattern = new RegExp(`${monthAbbr[i]}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`, 'i');
    
    const fullMatch = lower.match(fullPattern);
    const abbrMatch = lower.match(abbrPattern);
    const match = fullMatch || abbrMatch;
    
    if (match) {
      const day = parseInt(match[1]);
      const year = match[2] ? parseInt(match[2]) : today.getFullYear();
      const date = new Date(year, i, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI task assistant. I can help you:\n\n• Create and manage tasks with due dates\n• Filter tasks by priority, status, or due date\n• Change task status and priority\n• Delete tasks\n• Get task statistics\n\n**Try natural language like:**\n- \"Add task to buy groceries tomorrow\"\n- \"Create task submit report due 25/12/25\"\n- \"Add task meeting next Monday\"\n- \"Show my urgent tasks\"\n- \"Mark the first task as done\"",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [context, setContext] = useState<ConversationContext>({
    conversationHistory: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const shouldAutoScroll = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Fetch user info on mount
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUserName(userData.username || 'there');
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasUserMessage = messages.some(msg => msg.role === 'user');
    const lastMessage = messages[messages.length - 1];

    if (hasUserMessage && lastMessage?.role === 'assistant') {
      shouldAutoScroll.current = true;
    }

    if (shouldAutoScroll.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Pattern-based intent parser with AI enhancement
  const parseUserIntent = async (userMessage: string, conversationContext: any) => {
    const lower = userMessage.toLowerCase().trim();
    
    // Check for greetings FIRST (before other patterns)
    const greetingPatterns = [
      /^(hi|hello|hey|howdy|greetings|helo|hii|heya|hiya|sup|yo)$/i,
      /^good\s+(morning|afternoon|evening|night)/i,
      /^(hi|hello|hey)\s+(there|everyone|all)/i,
      /how\s+are\s+you/i,
      /what('?s|\s+is)\s+up/i,
      /nice\s+to\s+(see|meet)\s+you/i,
    ];
    
    for (const pattern of greetingPatterns) {
      if (lower.match(pattern)) {
        return { intent: 'conversation', isGreeting: true };
      }
    }
    
    // Quick pattern matching for common commands (faster and more reliable)
    
    // Create task patterns with due date extraction
    if (lower.includes('create') || lower.includes('add') || lower.includes('new task')) {
      const patterns = [
        /(?:create|add|new)(?: a| an)?\s+task\s+(?:called|named|titled)?\s*[:\-]?\s*(.+)/i,
        /(?:create|add|make)\s+(?:a\s+)?(.+?)(?:\s+task)?$/i,
      ];
      
      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          let title = match[1].trim();
          
          // Extract due date from the message
          const dueDate = parseDueDate(userMessage);
          
          // Remove date-related phrases from the title
          title = title.replace(/\b(tomorrow|today|day after tomorrow)\b/gi, '');
          title = title.replace(/\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
          title = title.replace(/\bin\s+\d+\s+days?\b/gi, '');
          title = title.replace(/\b(due|by|on|for)\b/gi, '');
          title = title.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '');
          title = title.replace(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g, '');
          title = title.replace(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?/gi, '');
          title = title.replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:,?\s+\d{4})?/gi, '');
          
          // Clean up common filler words
          title = title.replace(/^(called|named|titled)\s+/i, '');
          title = title.replace(/\s+task$/i, '');
          title = title.replace(/\s+/g, ' ').trim();
          
          const priority = lower.includes('high') ? 'high' : 
                          lower.includes('low') ? 'low' : 'medium';
          
          return { 
            intent: 'create_task', 
            taskTitle: title, 
            priority,
            dueDate: dueDate ? dueDate.toISOString() : undefined
          };
        }
      }
    }
    
    // Filter tasks patterns
    if (lower.includes('show') || lower.includes('list') || lower.includes('view') || lower.includes('display')) {
      // Priority filters
      if (lower.includes('high') || lower.includes('urgent') || lower.includes('important')) {
        return { intent: 'filter_tasks', filterType: 'priority', filterValue: 'high' };
      }
      if (lower.includes('medium')) {
        return { intent: 'filter_tasks', filterType: 'priority', filterValue: 'medium' };
      }
      if (lower.includes('low')) {
        return { intent: 'filter_tasks', filterType: 'priority', filterValue: 'low' };
      }
      
      // Status filters
      if (lower.includes('pending')) {
        return { intent: 'filter_tasks', filterType: 'status', filterValue: 'pending' };
      }
      if (lower.includes('progress') || lower.includes('ongoing')) {
        return { intent: 'filter_tasks', filterType: 'status', filterValue: 'in-progress' };
      }
      if (lower.includes('completed') || lower.includes('done')) {
        return { intent: 'filter_tasks', filterType: 'status', filterValue: 'completed' };
      }
      
      // Date filters
      if (lower.includes('overdue')) {
        return { intent: 'filter_tasks', filterType: 'dueDate', filterValue: 'overdue' };
      }
      if (lower.includes('today')) {
        return { intent: 'filter_tasks', filterType: 'dueDate', filterValue: 'today' };
      }
      
      // Default: show all tasks
      if (lower.match(/\b(show|list|view|display|my)\s+(all\s+)?(task|todo)/)) {
        return { intent: 'filter_tasks', filterType: 'all', filterValue: 'all' };
      }
    }
    
    // Update task patterns
    if (lower.includes('mark') || lower.includes('complete') || lower.includes('finish') || 
        lower.includes('done') || lower.includes('update') || lower.includes('change')) {
      
      // Status change
      if (lower.includes('status') || lower.includes('mark') || lower.includes('complete')) {
        // Try to extract task identifier
        let taskId = null;
        
        // Pattern 1: "change status for [task name]"
        const forMatch = userMessage.match(/(?:status|mark|complete)\s+(?:for|of)\s+(.+?)(?:\s+to\s+|\s+as\s+|$)/i);
        if (forMatch && forMatch[1]) {
          taskId = forMatch[1].trim();
          // Clean up "to completed" or similar from the task name
          taskId = taskId.replace(/\s+(to|as)\s+(pending|progress|completed|done)$/i, '');
        }
        
        // Pattern 2: "mark task [number]" or just "[number]"
        if (!taskId) {
          const numMatch = userMessage.match(/(?:task\s+)?(\d+)/i);
          if (numMatch) {
            taskId = numMatch[1];
          }
        }
        
        // Pattern 3: "mark [task name] as [status]"
        if (!taskId) {
          const asMatch = userMessage.match(/(?:mark|complete)\s+(.+?)\s+(?:as|to)/i);
          if (asMatch && asMatch[1]) {
            taskId = asMatch[1].trim();
          }
        }
        
        let status = 'completed';
        if (lower.includes('pending')) status = 'pending';
        else if (lower.includes('progress')) status = 'in-progress';
        else if (lower.includes('complete') || lower.includes('done')) status = 'completed';
        
        return {
          intent: 'update_task',
          action: 'change_status',
          taskIdentifier: taskId,
          newValue: status
        };
      }
      
      // Priority change
      if (lower.includes('priority')) {
        let taskId = null;
        
        // Pattern 1: "change priority for/of [task name]"
        const forMatch = userMessage.match(/priority\s+(?:for|of)\s+(.+?)(?:\s+to\s+|\s+as\s+|$)/i);
        if (forMatch && forMatch[1]) {
          taskId = forMatch[1].trim();
        }
        
        // Pattern 2: "task [number]"
        if (!taskId) {
          const numMatch = userMessage.match(/task\s+(\d+)/i);
          if (numMatch) {
            taskId = numMatch[1];
          }
        }
        
        return {
          intent: 'update_task',
          action: 'change_priority',
          taskIdentifier: taskId,
          newValue: lower.includes('high') ? 'high' : 
                   lower.includes('low') ? 'low' : 'medium'
        };
      }
    }
    
    // Delete task patterns
    if (lower.includes('delete') || lower.includes('remove')) {
      const taskMatch = lower.match(/(?:delete|remove)\s+(?:task\s+)?(.+)/i);
      const taskId = taskMatch ? taskMatch[1].trim() : null;
      
      return {
        intent: 'delete_task',
        taskIdentifier: taskId
      };
    }
    
    // Statistics
    if (lower.includes('stats') || lower.includes('statistics') || lower.includes('summary')) {
      return { intent: 'get_statistics' };
    }
    
    // Try AI as fallback for complex queries and spelling mistakes
    // This enhances understanding of task names, typos, and complex requests
    const useAIFallback = true; // Using Gemini API for better intelligence
    
    if (useAIFallback) {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            messages: [
              { 
                role: 'system', 
                content: `You are an intelligent intent classifier for a task management system that understands misspellings, natural language, and task names.

Analyze the user's request and return ONLY a JSON object.

CRITICAL RULES:
1. Fix spelling mistakes and understand variations
2. Extract exact task names when user wants to update/delete specific tasks
3. Preserve task names exactly as mentioned (e.g., "xyzabc", "pay fees")

Available intents: create_task, filter_tasks, update_task, delete_task, get_statistics, conversation

EXAMPLES:

Greetings:
- "hi" / "hello" / "gud morning" → {"intent":"conversation","isGreeting":true}

Creating tasks WITH DUE DATES:
- "create task buy milk tomorrow" → {"intent":"create_task","taskTitle":"buy milk","priority":"medium","dueDate":"2025-11-30T00:00:00.000Z"}
- "add task report due 12/25/25" → {"intent":"create_task","taskTitle":"report","priority":"medium","dueDate":"2025-12-25T00:00:00.000Z"}

Updating task status (extract exact task name or number):
- "change status for pay fees to completed" → {"intent":"update_task","action":"change_status","taskIdentifier":"pay fees","newValue":"completed"}
- "mark xyzabc as done" → {"intent":"update_task","action":"change_status","taskIdentifier":"xyzabc","newValue":"completed"}
- "complete task 2" → {"intent":"update_task","action":"change_status","taskIdentifier":"2","newValue":"completed"}

Changing priority:
- "change priority for xyzabc to high" → {"intent":"update_task","action":"change_priority","taskIdentifier":"xyzabc","newValue":"high"}

Deleting tasks:
- "delete xyzabc" → {"intent":"delete_task","taskIdentifier":"xyzabc"}

Filtering:
- "show urgent tasks" → {"intent":"filter_tasks","filterType":"priority","filterValue":"high"}

Statistics:
- "show stats" → {"intent":"get_statistics"}

Return ONLY valid JSON, nothing else.` 
              },
              { role: 'user', content: userMessage }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.message || data.response || '';
          const jsonMatch = aiResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.intent) return parsed;
          }
        }
      } catch (error) {
        // Silently skip AI fallback if not available
        console.log('AI fallback not available (optional feature)');
      }
    }
    
    // Default to conversation
    return { intent: 'conversation' };
  };

  // Fetch all tasks (helper function)
  const fetchTasks = async () => {
    const response = await fetch('/api/tasks', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return await response.json();
  };

  // Create task handler
  const handleCreateTask = async (intent: any) => {
    const { taskTitle, priority = 'medium', dueDate } = intent;
    
    const response = await fetch('/api/tasks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: taskTitle,
        priority,
        status: 'pending',
        dueDate: dueDate || undefined,
        description: 'Created via AI Assistant'
      }),
    });

    if (response.ok) {
      const task = await response.json();
      setContext(prev => ({ 
        ...prev, 
        lastTaskId: task.id, 
        lastTaskTitle: taskTitle 
      }));
      
      let message = `✅ Task created successfully!\n\n📝 **${taskTitle}**\nPriority: ${priority}\nStatus: Pending`;
      
      if (dueDate) {
        const date = new Date(dueDate);
        message += `\n📅 Due: ${date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      }
      
      return message;
    }
    
    throw new Error('Failed to create task');
  };

  // Filter tasks handler
  const handleFilterTasks = async (intent: any) => {
    const tasks = await fetchTasks();
    const { filterType, filterValue } = intent;
    
    // Show all tasks if requested
    if (filterType === 'all' || !filterType) {
      if (tasks.length === 0) {
        return '📋 You have no tasks yet. Try saying "create task Buy groceries"!';
      }
      return formatTaskList(tasks, 'All Tasks');
    }
    
    let filtered: any[] = [];
    let description = '';
    
    if (filterType === 'priority') {
      filtered = tasks.filter((t: any) => t.priority === filterValue);
      description = `${filterValue.toUpperCase()} priority`;
    } else if (filterType === 'status') {
      filtered = tasks.filter((t: any) => t.status === filterValue);
      description = filterValue.replace('-', ' ').toUpperCase();
    } else if (filterType === 'dueDate') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filterValue === 'overdue') {
        filtered = tasks.filter((t: any) => {
          if (!t.dueDate || t.status === 'completed') return false;
          return new Date(t.dueDate) < today;
        });
        description = 'OVERDUE';
      } else if (filterValue === 'today') {
        filtered = tasks.filter((t: any) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          due.setHours(0, 0, 0, 0);
          return due.getTime() === today.getTime();
        });
        description = 'DUE TODAY';
      }
    }
    
    if (filtered.length === 0) {
      return `📋 No ${description} tasks found.`;
    }
    
    return formatTaskList(filtered, `${description} Tasks`);
  };

  // Update task handler
  const handleUpdateTask = async (intent: any) => {
    const { action, taskIdentifier, newValue } = intent;
    const tasks = await fetchTasks();
    
    // Check if we have tasks
    if (tasks.length === 0) {
      return `📋 You don't have any tasks yet. Try creating one first!`;
    }
    
    // Find task by identifier (number or title)
    let task = null;
    
    // Only try to parse and find task if taskIdentifier is provided
    if (taskIdentifier) {
      const num = parseInt(taskIdentifier);
      
      if (!isNaN(num) && num > 0 && num <= tasks.length) {
        task = tasks[num - 1];
      } else if (typeof taskIdentifier === 'string') {
        task = tasks.find((t: any) => 
          t.title.toLowerCase().includes(taskIdentifier.toLowerCase())
        );
      }
    }
    
    if (!task) {
      // If task not found, show selection UI
      setContext(prev => ({
        ...prev,
        pendingAction: {
          type: action === 'change_status' ? 'select_status' : 'select_priority',
          tasks: tasks.slice(0, 10)
        }
      }));
      
      return `📋 Which task would you like to ${action === 'change_status' ? 'update' : 'change priority for'}?\n\n` +
        tasks.slice(0, 10).map((t: any, i: number) => 
          `${i + 1}. ${getStatusEmoji(t.status)} ${t.title}`
        ).join('\n');
    }
    
    // Perform update
    const updateData = action === 'change_status' 
      ? { status: newValue } 
      : { priority: newValue };
      
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    
    if (response.ok) {
      setContext(prev => ({ ...prev, pendingAction: undefined }));
      const field = action === 'change_status' ? 'Status' : 'Priority';
      return `✅ Task updated!\n\n**${task.title}**\n${field}: ${newValue.toUpperCase().replace('-', ' ')}`;
    }
    
    throw new Error('Failed to update task');
  };

  // Delete task handler
  const handleDeleteTask = async (intent: any) => {
    const tasks = await fetchTasks();
    const { taskIdentifier } = intent;
    
    let task = null;
    const num = parseInt(taskIdentifier);
    
    if (!isNaN(num) && num > 0 && num <= tasks.length) {
      task = tasks[num - 1];
    } else if (taskIdentifier) {
      task = tasks.find((t: any) => 
        t.title.toLowerCase().includes(taskIdentifier.toLowerCase())
      );
    }
    
    if (!task) {
      setContext(prev => ({
        ...prev,
        pendingAction: { type: 'select_task', tasks: tasks.slice(0, 10) }
      }));
      
      return '🗑️ Which task would you like to delete?\n\n' +
        tasks.slice(0, 10).map((t: any, i: number) => 
          `${i + 1}. ${t.title}`
        ).join('\n');
    }
    
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (response.ok) {
      setContext(prev => ({ ...prev, pendingAction: undefined }));
      return `✅ Task deleted!\n\n**${task.title}** has been removed.`;
    }
    
    throw new Error('Failed to delete task');
  };

  // Get statistics
  const handleStatistics = async () => {
    const response = await fetch('/api/tasks/stats', { credentials: 'include' });
    if (response.ok) {
      const stats = await response.json();
      return `📊 **Task Statistics**\n\n` +
        `📝 Total: ${stats.totalTasks}\n` +
        `⏳ Pending: ${stats.pendingTasks}\n` +
        `🔄 In Progress: ${stats.inProgressTasks}\n` +
        `✅ Completed: ${stats.completedTasks}\n` +
        `⚠️ Overdue: ${stats.overdueTasks}\n\n` +
        `**Priority Breakdown**\n` +
        `🔴 High: ${stats.highPriority}\n` +
        `🟡 Medium: ${stats.mediumPriority}\n` +
        `🟢 Low: ${stats.lowPriority}`;
    }
    throw new Error('Failed to fetch statistics');
  };

  // Handle conversation/help
  const handleConversation = async (userMessage: string, isGreeting: boolean = false) => {
    const lower = userMessage.toLowerCase();
    
    // Handle greetings with varied, personalized responses
    if (isGreeting) {
      const greetings = [
        `👋 Hey ${userName}! How can I help you tackle your tasks today?`,
        `Hello ${userName}! 🌟 Ready to boost your productivity? What would you like to work on?`,
        `Hi there, ${userName}! I'm here to help you stay organized. What's on your mind?`,
        `Hey ${userName}! 💪 Let's make today productive! How can I assist you?`,
        `Greetings ${userName}! What would you like me to help you with today?`,
        `Hi ${userName}! 🎯 Ready to crush some tasks? I'm all ears!`,
        `Hello ${userName}! Great to see you! What can I do for you today?`,
        `Hey there, ${userName}! Let's get things done together. What do you need?`,
      ];
      
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      
      return `${randomGreeting}\n\n**I can help you:**\n\n` +
             `• Create tasks with dates: "add task buy groceries tomorrow"\n` +
             `• Schedule tasks: "create task meeting next Friday"\n` +
             `• Set due dates: "new task report due 2/12/25"\n` +
             `• View tasks: "show tasks" or "show overdue"\n` +
             `• Update tasks: "mark task 1 as done"\n` +
             `• Delete tasks: "delete task 1"\n` +
             `• Get stats: "show statistics"\n\n` +
             `Try asking me in natural language!`;
    }
    
    // Handle help requests
    if (lower.includes('help')) {
      return `🤖 **Quick Guide**\n\n` +
             `**Create with Due Dates:**\n` +
             `• "create task buy milk tomorrow"\n` +
             `• "add task report due 25/12/25"\n` +
             `• "new task meeting next Monday"\n` +
             `• "add task call John in 3 days"\n\n` +
             `**Other Commands:**\n` +
             `• **View:** "show tasks", "show overdue"\n` +
             `• **Update:** "mark task 1 done"\n` +
             `• **Delete:** "delete task 1"\n` +
             `• **Stats:** "show statistics"\n\n` +
             `Just ask naturally - I'll understand!`;
    }
    
    // Fallback response for general conversation
    return `I'm here to help manage your tasks! Try:\n\n` +
           `• "create task Buy milk tomorrow"\n` +
           `• "add task meeting next Monday"\n` +
           `• "show my tasks"\n` +
           `• "show statistics"\n\n` +
           `What would you like to do?`;
  };

  // Helper: Format task list
  const formatTaskList = (tasks: any[], title: string) => {
    let result = `📋 **${title}** (${tasks.length})\n\n`;
    tasks.slice(0, 10).forEach((task: any, i: number) => {
      result += `${i + 1}. ${getStatusEmoji(task.status)} ${task.title}\n`;
      result += `   ${getPriorityEmoji(task.priority)} ${task.priority} | ${task.status}\n`;
      if (task.dueDate) {
        result += `   📅 ${new Date(task.dueDate).toLocaleDateString()}\n`;
      }
      result += '\n';
    });
    if (tasks.length > 10) {
      result += `... and ${tasks.length - 10} more`;
    }
    return result;
  };

  const getStatusEmoji = (status: string) => {
    return status === 'completed' ? '✅' : status === 'in-progress' ? '🔄' : '⏳';
  };

  const getPriorityEmoji = (priority: string) => {
    return priority === 'high' ? '🔴' : priority === 'low' ? '🟢' : '🟡';
  };

  // Main request processor
  const processUserRequest = async (userMessage: string): Promise<string> => {
    try {
      // Handle pending actions (multi-step flows)
      if (context.pendingAction) {
        const { type, tasks, selectedTask } = context.pendingAction;
        const num = parseInt(userMessage.trim());
        const lower = userMessage.toLowerCase().trim();
        
        if (type === 'select_task' && tasks) {
          let task = null;
          
          // Try to find by number first
          if (!isNaN(num) && num > 0 && num <= tasks.length) {
            task = tasks[num - 1];
          } else {
            // Try to find by name
            task = tasks.find((t: any) => 
              t.title.toLowerCase().includes(lower)
            );
          }
          
          if (task) {
            const response = await fetch(`/api/tasks/${task.id}`, {
              method: 'DELETE',
              credentials: 'include',
            });
            
            if (response.ok) {
              setContext(prev => ({ ...prev, pendingAction: undefined }));
              return `✅ Task deleted!\n\n**${task.title}**`;
            }
          } else {
            return `❌ Could not find that task. Please enter a number (1-${tasks.length}) or the exact task name.`;
          }
        }
        
        if (type === 'select_status' && tasks) {
          let task = null;
          
          // Try to find by number first
          if (!isNaN(num) && num > 0 && num <= tasks.length) {
            task = tasks[num - 1];
          } else {
            // Try to find by name
            task = tasks.find((t: any) => 
              t.title.toLowerCase().includes(lower)
            );
          }
          
          if (task) {
            setContext(prev => ({
              ...prev,
              pendingAction: { type: 'select_status', selectedTask: task }
            }));
            return `✅ Selected: **${task.title}**\n\nChoose status:\n1️⃣ Pending\n2️⃣ In Progress\n3️⃣ Completed`;
          } else {
            return `❌ Could not find that task. Please enter a number (1-${tasks.length}) or the task name.`;
          }
        }
        
        if (type === 'select_status' && selectedTask) {
          const statusMap: any = { '1': 'pending', '2': 'in-progress', '3': 'completed' };
          const status = statusMap[userMessage.trim()];
          
          if (status) {
            const response = await fetch(`/api/tasks/${selectedTask.id}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            });
            
            if (response.ok) {
              setContext(prev => ({ ...prev, pendingAction: undefined }));
              return `✅ Status updated!\n\n**${selectedTask.title}**\nNew status: ${status.replace('-', ' ').toUpperCase()}`;
            }
          } else {
            return `❌ Invalid status. Please choose:\n1️⃣ Pending\n2️⃣ In Progress\n3️⃣ Completed`;
          }
        }
      }
      
      // Parse intent with AI
      const intent = await parseUserIntent(userMessage, context);
      
      // Route to appropriate handler
      switch (intent.intent) {
        case 'create_task':
          return await handleCreateTask(intent);
        
        case 'filter_tasks':
          return await handleFilterTasks(intent);
        
        case 'update_task':
          return await handleUpdateTask(intent);
        
        case 'delete_task':
          return await handleDeleteTask(intent);
        
        case 'get_statistics':
          return await handleStatistics();
        
        case 'conversation':
        default:
          return await handleConversation(userMessage, (intent as any).isGreeting);
      }
    } catch (error) {
      console.error('Processing error:', error);
      return `❌ ${(error as Error).message || 'Something went wrong. Please try again.'}`;
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
    
    // Update conversation history
    setContext(prev => ({
      ...prev,
      conversationHistory: [
        ...(prev.conversationHistory || []).slice(-10), // Keep last 10 messages
        { role: 'user', content: input }
      ]
    }));
    
    const messageToProcess = input;
    setInput('');
    setLoading(true);
    
    try {
      const response = await processUserRequest(messageToProcess);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history
      setContext(prev => ({
        ...prev,
        conversationHistory: [
          ...(prev.conversationHistory || []),
          { role: 'assistant', content: response }
        ]
      }));
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