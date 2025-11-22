import { NextResponse } from 'next/server';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface TaskAction {
  action: 'create' | 'delete' | 'update' | 'list' | 'none';
  taskDetails?: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    status?: 'pending' | 'in-progress' | 'completed';
  };
  taskId?: string;
  taskTitle?: string;
}

async function callGemini(messages: Message[]): Promise<string> {
  // Convert messages to Gemini format
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationHistory = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemMessage }]
        },
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API request failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function parseTaskAction(aiResponse: string, userMessage: string): TaskAction {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for delete action
  if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    let taskTitle: string | undefined;
    
    // Pattern 1: Quoted text
    const quotedMatch = userMessage.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      taskTitle = quotedMatch[1].trim();
    } else {
      // Pattern 2: "delete task [title]" or "delete the [title]"
      const afterTaskMatch = userMessage.match(/(?:delete|remove)\s+(?:the\s+)?(?:task\s+)?["']?([^"'\n]+?)["']?$/i);
      if (afterTaskMatch) {
        taskTitle = afterTaskMatch[1].trim();
        // Remove trailing words like "task" from the end
        taskTitle = taskTitle.replace(/\s+task$/i, '').trim();
      }
    }
    
    return {
      action: 'delete',
      taskTitle: taskTitle
    };
  }
  
  // Check for create action
  if (lowerMessage.includes('create') || lowerMessage.includes('add') || 
      lowerMessage.includes('make') || lowerMessage.includes('new task')) {
    
    const taskDetails: TaskAction['taskDetails'] = {};
    
    // Enhanced title extraction - prioritize quoted text
    let titleFound = false;
    
    // Pattern 1: Look for quoted text first (most specific)
    const quotedMatch = userMessage.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      taskDetails.title = quotedMatch[1].trim();
      titleFound = true;
    }
    
    // Pattern 2: "to [action]" pattern (e.g., "create a task to buy groceries")
    if (!titleFound) {
      const toMatch = userMessage.match(/(?:task|tasks?)\s+to\s+([^,\n]+?)(?:\s+(?:by|on|due|with|for)|$)/i);
      if (toMatch) {
        taskDetails.title = toMatch[1].trim();
        titleFound = true;
      }
    }
    
    // Pattern 3: "for [action]" pattern
    if (!titleFound) {
      const forMatch = userMessage.match(/(?:task|tasks?)\s+for\s+([^,\n]+?)(?:\s+(?:by|on|due|with)|$)/i);
      if (forMatch) {
        taskDetails.title = forMatch[1].trim();
        titleFound = true;
      }
    }
    
    // Pattern 4: "called [name]" pattern
    if (!titleFound) {
      const calledMatch = userMessage.match(/(?:called|named)\s+["']?([^"',\n]+?)["']?(?:\s+(?:by|on|due|with)|$)/i);
      if (calledMatch) {
        taskDetails.title = calledMatch[1].trim();
        titleFound = true;
      }
    }
    
    // Pattern 5: Generic fallback - text after create/add/make
    if (!titleFound) {
      const genericMatch = userMessage.match(/(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?(?:task\s+)?(?:to\s+)?([^,\n]+?)(?:\s+(?:by|on|due|with|for)|$)/i);
      if (genericMatch) {
        let title = genericMatch[1].trim();
        // Clean up common prefixes
        title = title.replace(/^(?:task\s+)?(?:to\s+)?(?:for\s+)?/i, '').trim();
        if (title.length > 3) { // Minimum length check
          taskDetails.title = title;
          titleFound = true;
        }
      }
    }
    
    // Extract priority
    if (lowerMessage.includes('high priority') || lowerMessage.includes('urgent')) {
      taskDetails.priority = 'high';
    } else if (lowerMessage.includes('low priority')) {
      taskDetails.priority = 'low';
    } else {
      taskDetails.priority = 'medium';
    }
    
    // Extract due date
    const dateMatch = userMessage.match(/(?:by|on|due)\s+([^\.,]+)/i);
    if (dateMatch) {
      const dateStr = dateMatch[1].trim().toLowerCase();
      const date = new Date();
      
      if (dateStr.includes('today')) {
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('tomorrow')) {
        date.setDate(date.getDate() + 1);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('monday')) {
        const day = 1;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('tuesday')) {
        const day = 2;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('wednesday')) {
        const day = 3;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('thursday')) {
        const day = 4;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('friday')) {
        const day = 5;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('saturday')) {
        const day = 6;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else if (dateStr.includes('sunday')) {
        const day = 0;
        const diff = (day - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + diff);
        taskDetails.dueDate = date.toISOString().split('T')[0];
      } else {
        // Try to parse as date
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          taskDetails.dueDate = parsedDate.toISOString().split('T')[0];
        }
      }
    }
    
    return {
      action: 'create',
      taskDetails
    };
  }
  
  // Check for list action
  if (lowerMessage.includes('list') || lowerMessage.includes('show') || 
      lowerMessage.includes('what are my tasks')) {
    return { action: 'list' };
  }
  
  return { action: 'none' };
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { message, messages = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user's tasks for context
   // L290: await dbConnect();
// Get user's tasks for context
const userTasks = (await Task.find({ userId }).sort({ createdAt: -1 }).limit(20).lean()) as any[]; // <-- ADD .lean()

const tasksContext = userTasks.map(t => ({
  id: t._id.toString(),
  title: t.title,
  priority: t.priority,
  status: t.status,
  dueDate: t.dueDate
}));
// ... rest of the code
  

    // Create system message with context
    const systemMessage: Message = {
      role: 'system',
      content: `You are a helpful AI task assistant. The user has ${userTasks.length} tasks. 
Here are their current tasks: ${JSON.stringify(tasksContext, null, 2)}

When the user wants to:
- Create a task: Extract the title, priority (low/medium/high), and due date if mentioned
- Delete a task: Identify which task they want to delete
- Update a task: Identify the task and what changes they want
- List tasks: Show them their current tasks

Be friendly, concise, and helpful. Always confirm actions you take.`
    };

    // Parse the user's intent
    const taskAction = parseTaskAction('', message);
    let tasksModified = false;
    let responseText = '';

    // Handle the action
    if (taskAction.action === 'create' && taskAction.taskDetails?.title) {
      const newTask = await Task.create({
        userId,
        title: taskAction.taskDetails.title,
        description: taskAction.taskDetails.description || '',
        priority: taskAction.taskDetails.priority || 'medium',
        status: 'pending',
        dueDate: taskAction.taskDetails.dueDate ? new Date(taskAction.taskDetails.dueDate) : null
      });

      tasksModified = true;
      const dueDateStr = newTask.dueDate 
        ? ` due on ${new Date(newTask.dueDate).toLocaleDateString()}`
        : '';
      responseText = `✅ I've created a new task: "${newTask.title}" with ${newTask.priority} priority${dueDateStr}. You can view it on your dashboard!`;
      
    } else if (taskAction.action === 'delete' && taskAction.taskTitle) {
      // Find and delete the task
      const taskToDelete = userTasks.find(t => 
        t.title.toLowerCase().includes(taskAction.taskTitle!.toLowerCase())
      );
      
      if (taskToDelete) {
        await Task.findByIdAndDelete(taskToDelete._id);
        tasksModified = true;
        responseText = `✅ I've deleted the task: "${taskToDelete.title}".`;
      } else {
        // List tasks to help user
        if (userTasks.length === 0) {
          responseText = `❌ I couldn't find a task matching "${taskAction.taskTitle}". You don't have any tasks yet.`;
        } else {
          const tasksList = userTasks.slice(0, 10).map((t, i) => {
            const statusLabel = t.status === 'completed' ? '[Completed]' : t.status === 'in-progress' ? '[In Progress]' : '[Pending]';
            return `${i + 1}. ${t.title} ${statusLabel}`;
          }).join('\n');
          
          const tasksForSelection = userTasks.slice(0, 10).map(t => ({
            id: t._id.toString(),
            title: t.title,
            status: t.status
          }));
          
          return NextResponse.json({
            response: `❌ I couldn't find a task matching "${taskAction.taskTitle}".\n\nHere are your current tasks. Click the button next to the task you want to delete:\n\n${tasksList}`,
            tasksModified: false,
            tasks: tasksForSelection,
            actionType: 'delete'
          });
        }
      }
      
    } else if (taskAction.action === 'list') {
      if (userTasks.length === 0) {
        responseText = "You don't have any tasks yet. Would you like to create one?";
      } else {
        const tasksList = userTasks.map((t, i) => {
          const statusLabel = t.status === 'completed' ? '[Completed]' : t.status === 'in-progress' ? '[In Progress]' : '[Pending]';
          const dueStr = t.dueDate ? ` (Due: ${new Date(t.dueDate).toLocaleDateString()})` : '';
          return `${i + 1}. ${t.title} ${statusLabel} - ${t.priority} priority${dueStr}`;
        }).join('\n');
        responseText = `Here are your tasks:\n\n${tasksList}`;
      }
      
    } else if (taskAction.action === 'create' && !taskAction.taskDetails?.title) {
      // User wants to create but title is unclear
      responseText = `I understand you want to create a task, but I need more details. Please tell me:\n\n• What is the task? (e.g., "Create a task to buy groceries")\n• When is it due? (optional)\n• What's the priority? (optional: low, medium, high)`;
      
    } else {
      // Unclear intent - provide helpful context
      const lowerMessage = message.toLowerCase();
      
      // Check if user might be asking about task status
      if (lowerMessage.includes('change status') || lowerMessage.includes('update status')) {
        // Interactive status change flow
        if (userTasks.length === 0) {
          responseText = "You don't have any tasks to change the status for. Would you like to create one?";
        } else {
          const tasksList = userTasks.slice(0, 10).map((t, i) => {
            const statusLabel = t.status === 'completed' ? '[Completed]' : t.status === 'in-progress' ? '[In Progress]' : '[Pending]';
            return `${i + 1}. ${t.title} ${statusLabel}`;
          }).join('\n');
          
          const tasksForSelection = userTasks.slice(0, 10).map(t => ({
            id: t._id.toString(),
            title: t.title,
            status: t.status
          }));
          
          return NextResponse.json({
            response: `📋 **Which task's status would you like to change?**\n\nPlease select a task:\n\n${tasksList}`,
            tasksModified: false,
            tasks: tasksForSelection,
            actionType: 'changeStatus'
          });
        }
      } else if (lowerMessage.includes('complete') || lowerMessage.includes('finish') || 
          lowerMessage.includes('done') || lowerMessage.includes('mark')) {
        if (userTasks.length === 0) {
          responseText = "You don't have any tasks to mark as completed yet. Would you like to create one?";
        } else {
          const incompleteTasks = userTasks.filter(t => t.status !== 'completed');
          if (incompleteTasks.length === 0) {
            responseText = "All your tasks are already completed! Great job!";
          } else {
            const tasksList = incompleteTasks.slice(0, 10).map((t, i) => {
              const statusLabel = t.status === 'in-progress' ? '[In Progress]' : '[Pending]';
              return `${i + 1}. ${t.title} ${statusLabel}`;
            }).join('\n');
            
            const tasksForSelection = incompleteTasks.slice(0, 10).map(t => ({
              id: t._id.toString(),
              title: t.title,
              status: t.status
            }));
            
            return NextResponse.json({
              response: `Here are your incomplete tasks. Click the button next to the task you want to mark as completed:\n\n${tasksList}`,
              tasksModified: false,
              tasks: tasksForSelection,
              actionType: 'complete'
            });
          }
        }
      } else if (lowerMessage.includes('update') || lowerMessage.includes('change') || 
                 lowerMessage.includes('modify') || lowerMessage.includes('edit')) {
        if (userTasks.length === 0) {
          responseText = "You don't have any tasks to update yet. Would you like to create one?";
        } else {
          const tasksList = userTasks.slice(0, 10).map((t, i) => {
            const statusLabel = t.status === 'completed' ? '[Completed]' : t.status === 'in-progress' ? '[In Progress]' : '[Pending]';
            return `${i + 1}. ${t.title} ${statusLabel}`;
          }).join('\n');
          responseText = `Here are your tasks:\n\n${tasksList}\n\nWhich task would you like to update? Please tell me the task name and what you'd like to change.`;
        }
      } else {
        // General unclear intent - show tasks and capabilities
        if (userTasks.length > 0) {
          const tasksList = userTasks.slice(0, 5).map((t, i) => {
            const statusLabel = t.status === 'completed' ? '[Completed]' : t.status === 'in-progress' ? '[In Progress]' : '[Pending]';
            return `${i + 1}. ${t.title} ${statusLabel}`;
          }).join('\n');
          responseText = `I'm not sure what you'd like to do. Here are your current tasks:\n\n${tasksList}\n\nI can help you with:\n- Creating new tasks\n- Deleting tasks\n- Listing all tasks\n- Marking tasks as completed\n\nWhat would you like to do?`;
        } else {
          // Use Gemini for general conversation
          const geminiMessages: Message[] = [
            systemMessage,
            ...messages.slice(-5),
            { role: 'user', content: message }
          ];
          responseText = await callGemini(geminiMessages);
        }
      }
    }

    return NextResponse.json({
      response: responseText,
      tasksModified
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { message: 'Error processing request', error: String(error) },
      { status: 500 }
    );
  }
}
