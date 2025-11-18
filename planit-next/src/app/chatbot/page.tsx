'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PageWrapper from '@/components/page-wrapper';
import { useSession } from 'next-auth/react';

type ThreadSummary = {
  threadId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  name?: string;
  createdAt: string;
};

type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, any>;
};

// Simplified AI Response Engine (mimicking LangGraph/LangChain behavior)
class TaskAssistantAI {
  private lastMessage: string = '';

  private analyzeMessage(message: string): { intent: string; entities: any } {
    const lowerMessage = message.toLowerCase();
    
    // Check if message requires task management tools
    const taskKeywords = ['task', 'todo', 'assignment', 'job', 'work'];
    const hasTaskContext = taskKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Enhanced intent recognition patterns - only for task management
    if (hasTaskContext && (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new task') || 
        lowerMessage.includes('make a task') || lowerMessage.includes('schedule'))) {
      return { intent: 'create_task', entities: this.extractTaskEntities(message) };
    } else if (hasTaskContext && (lowerMessage.includes('update') || lowerMessage.includes('change') || lowerMessage.includes('modify') || 
               lowerMessage.includes('mark as') || lowerMessage.includes('edit') || lowerMessage.includes('set'))) {
      return { intent: 'update_task', entities: this.extractTaskEntities(message) };
    } else if (hasTaskContext && (lowerMessage.includes('delete') || lowerMessage.includes('remove') || lowerMessage.includes('cancel'))) {
      return { intent: 'delete_task', entities: this.extractTaskEntities(message) };
    } else if (hasTaskContext && (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('get') || 
               lowerMessage.includes('display') || lowerMessage.includes('what are my'))) {
      return { intent: 'get_tasks', entities: this.extractFilterEntities(message) };
    } else if (lowerMessage.includes('calculate') || lowerMessage.includes('what is') || this.hasArithmeticPattern(message)) {
      return { intent: 'calculator', entities: this.extractMathEntities(message) };
    } else {
      return { intent: 'chat', entities: {} };
    }
  }

  private extractTaskEntities(message: string) {
    const entities: any = {};
    
    // Enhanced title extraction with multiple patterns
    let title = '';
    
    // Pattern 1: "create task [title]" or "add task [title]"
    let titleMatch = message.match(/(?:create|add|new)\s+(?:task|todo)\s+(.+?)(?:\s+(?:with|by|due|priority)|$)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Pattern 2: "delete task [title]" or "remove task [title]"
    if (!title) {
      titleMatch = message.match(/(?:delete|remove)\s+(?:task|todo)\s+(.+?)(?:\s+(?:with|by|due)|$)/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    // Pattern 3: "update/edit task [title]"
    if (!title) {
      titleMatch = message.match(/(?:update|edit|modify|change)\s+(?:task|todo)\s+(.+?)(?:\s+(?:to|with|by|due)|$)/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    // Pattern 4: Direct quotes "task title"
    if (!title) {
      titleMatch = message.match(/"([^"]+)"/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    // Pattern 5: General pattern for task creation
    if (!title) {
      titleMatch = message.match(/(?:task|to)\s+([^.!?]*?)(?:\s+(?:by|due|with)|$)/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    // Clean up the title
    if (title) {
      // Remove common prefixes/suffixes
      title = title.replace(/^(?:called|named|titled)\s+/i, '');
      title = title.replace(/\s+(?:task|todo)$/i, '');
      entities.title = title;
    }
    
    // Enhanced description extraction
    const descriptionPatterns = [
      /(?:description|desc|about|details?):\s*(.+?)(?:\s+(?:priority|due|by)|$)/i,
      /(?:with description|described as)\s+(.+?)(?:\s+(?:priority|due|by)|$)/i,
      /\.\s*(.{10,}?)(?:\s+(?:priority|due|by)|$)/i // Long sentence after period as description
    ];
    
    for (const pattern of descriptionPatterns) {
      const descMatch = message.match(pattern);
      if (descMatch && descMatch[1].trim().length > 5) {
        entities.description = descMatch[1].trim();
        break;
      }
    }
    
    // Extract priority with enhanced patterns
    if (message.toLowerCase().includes('high priority') || message.toLowerCase().includes('urgent') || message.toLowerCase().includes('important')) {
      entities.priority = 'high';
    } else if (message.toLowerCase().includes('low priority') || message.toLowerCase().includes('minor')) {
      entities.priority = 'low';
    } else if (message.toLowerCase().includes('medium priority') || message.toLowerCase().includes('normal priority')) {
      entities.priority = 'medium';
    }
    
    // Extract status with enhanced patterns
    if (message.toLowerCase().includes('completed') || message.toLowerCase().includes('done') || message.toLowerCase().includes('finished')) {
      entities.status = 'completed';
    } else if (message.toLowerCase().includes('in progress') || message.toLowerCase().includes('in-progress') || message.toLowerCase().includes('working on')) {
      entities.status = 'in-progress';
    } else if (message.toLowerCase().includes('pending') || message.toLowerCase().includes('waiting')) {
      entities.status = 'pending';
    }
    
    // Enhanced date extraction
    const datePatterns = [
      /(?:by|due|before)\s+([a-zA-Z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i,
      /(?:by|due|before)\s+(\d{4}-\d{2}-\d{2})/i,
      /(?:by|due|before)\s+(today|tomorrow|next\s+week|this\s+friday)/i
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = message.match(pattern);
      if (dateMatch) {
        entities.dueDate = this.parseDate(dateMatch[1]);
        break;
      }
    }
    
    // Enhanced time extraction for start and end times
    const timePatterns = [
      /(?:start\s+(?:at|time)|from)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i,
      /(?:begin|starts?)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i,
      /at\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i
    ];
    
    for (const pattern of timePatterns) {
      const timeMatch = message.match(pattern);
      if (timeMatch) {
        entities.startTime = this.parseTime(timeMatch[1]);
        break;
      }
    }
    
    const endTimePatterns = [
      /(?:end\s+(?:at|time)|until|to)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i,
      /(?:finish|ends?)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i,
      /-\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i // e.g., "9:00 - 10:30"
    ];
    
    for (const pattern of endTimePatterns) {
      const timeMatch = message.match(pattern);
      if (timeMatch) {
        entities.endTime = this.parseTime(timeMatch[1]);
        break;
      }
    }
    
    // Extract time range pattern (e.g., "from 9:00 to 10:30" or "9:00-10:30")
    const timeRangePattern = /(?:from\s+)?(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)\s*(?:to|-)\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i;
    const timeRangeMatch = message.match(timeRangePattern);
    if (timeRangeMatch && !entities.startTime && !entities.endTime) {
      entities.startTime = this.parseTime(timeRangeMatch[1]);
      entities.endTime = this.parseTime(timeRangeMatch[2]);
    }
    
    return entities;
  }

  private extractFilterEntities(message: string) {
    const entities: any = {};
    
    if (message.toLowerCase().includes('high priority')) entities.priority = 'high';
    else if (message.toLowerCase().includes('low priority')) entities.priority = 'low';
    else if (message.toLowerCase().includes('medium priority')) entities.priority = 'medium';
    
    if (message.toLowerCase().includes('completed')) entities.status = 'completed';
    else if (message.toLowerCase().includes('in progress')) entities.status = 'in-progress';
    else if (message.toLowerCase().includes('pending')) entities.status = 'pending';
    
    return entities;
  }

  private extractMathEntities(message: string) {
    // Extract numbers and operations
    const numbers = message.match(/\d+\.?\d*/g)?.map(n => parseFloat(n));
    let operation = 'add';
    
    if (message.includes('+') || message.includes('plus') || message.includes('add')) operation = 'add';
    else if (message.includes('-') || message.includes('minus') || message.includes('subtract')) operation = 'sub';
    else if (message.includes('*') || message.includes('×') || message.includes('times') || message.includes('multiply')) operation = 'mul';
    else if (message.includes('/') || message.includes('÷') || message.includes('divide')) operation = 'div';
    
    return {
      firstNum: numbers?.[0] || 0,
      secondNum: numbers?.[1] || 0,
      operation
    };
  }

  private hasArithmeticPattern(message: string): boolean {
    return /\d+\.?\d*\s*[+\-*/×÷]\s*\d+\.?\d*/.test(message) || 
           /what\s+is\s+\d+/.test(message.toLowerCase());
  }

  private parseDate(dateStr: string): string {
    try {
      // Simple date parsing - you can enhance this
      const today = new Date();
      if (dateStr.toLowerCase().includes('today')) {
        return today.toISOString().split('T')[0];
      } else if (dateStr.toLowerCase().includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      } else if (dateStr.toLowerCase().includes('friday')) {
        const friday = new Date(today);
        friday.setDate(today.getDate() + (5 - today.getDay()));
        return friday.toISOString().split('T')[0];
      }
      // Try to parse as ISO date
      const parsed = new Date(dateStr);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch (e) {
      // Fallback to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }
    return '';
  }

  private parseTime(timeStr: string): string {
    try {
      // Clean the time string
      let cleanTime = timeStr.trim().toLowerCase();
      
      // Handle 24-hour format (e.g., "14:30")
      if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        return cleanTime;
      }
      
      // Handle 12-hour format with AM/PM
      const ampmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = ampmMatch[2];
        const ampm = ampmMatch[3];
        
        if (ampm === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Handle time without AM/PM (assume 24-hour format)
      const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, '0');
        const minutes = timeMatch[2];
        return `${hours}:${minutes}`;
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }

  public async processMessage(message: string, toolExecutor: (name: string, args: any) => Promise<any>): Promise<string> {
    this.lastMessage = message;
    const analysis = this.analyzeMessage(message);
    
    try {
      switch (analysis.intent) {
        case 'create_task': {
          if (!analysis.entities.title || analysis.entities.title.trim().length === 0) {
            return "Please specify what task you'd like to create. For example: 'create task Buy groceries with high priority' or 'add task Finish homework due tomorrow'.";
          }
          
          // If no description was extracted, try to extract it from the full message
          if (!analysis.entities.description) {
            const messageText = this.lastMessage || '';
            
            // Look for description patterns in the full message
            const descPatterns = [
              /create\s+task\s+.+?\.\s*(.{15,}?)(?:\s+(?:priority|due|by)|$)/i,
              /add\s+task\s+.+?\.\s*(.{15,}?)(?:\s+(?:priority|due|by)|$)/i,
              /task\s+.+?\s+(?:which|that)\s+(.{10,}?)(?:\s+(?:priority|due|by)|$)/i
            ];
            
            for (const pattern of descPatterns) {
              const match = messageText.match(pattern);
              if (match && match[1].trim().length > 5) {
                analysis.entities.description = match[1].trim();
                break;
              }
            }
          }
          
          // Set required defaults as per user requirements
          
          // Priority: default to 'low' if not specified
          if (!analysis.entities.priority) {
            analysis.entities.priority = 'low';
          }
          
          // Status: default to 'pending' if not specified
          if (!analysis.entities.status) {
            analysis.entities.status = 'pending';
          }
          
          // Due Date: default to current date if not specified
          if (!analysis.entities.dueDate) {
            const today = new Date();
            analysis.entities.dueDate = today.toISOString().split('T')[0];
          }
          
          // Start Time: default to current time if not specified
          if (!analysis.entities.startTime) {
            const now = new Date();
            analysis.entities.startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          }
          
          // End Time: default to start time + 1 hour if not specified
          if (!analysis.entities.endTime && analysis.entities.startTime) {
            const [hours, minutes] = analysis.entities.startTime.split(':');
            const endHour = (parseInt(hours) + 1) % 24;
            analysis.entities.endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;
          }
          
          // Description: leave empty if not provided (as per requirement)
          
          const createResult = await toolExecutor('create_task', analysis.entities);
          if (createResult.error) {
            return `Sorry, I couldn't create the task: ${createResult.error}`;
          }
          
          let response = `✅ Task created successfully! I've added "${createResult.task?.title || analysis.entities.title}"`;
          
          const details = [];
          if (createResult.task?.priority) {
            details.push(`${createResult.task.priority} priority`);
          }
          if (createResult.task?.status) {
            details.push(`status: ${createResult.task.status}`);
          }
          if (createResult.task?.dueDate) {
            details.push(`due on ${createResult.task.dueDate}`);
          }
          if (createResult.task?.startTime && createResult.task?.endTime) {
            details.push(`scheduled from ${createResult.task.startTime} to ${createResult.task.endTime}`);
          } else if (createResult.task?.startTime) {
            details.push(`starting at ${createResult.task.startTime}`);
          }
          
          if (details.length > 0) {
            response += ` with ${details.join(', ')}`;
          }
          
          response += '.';
          
          if (createResult.task?.description && createResult.task.description.trim()) {
            response += `\n\n📝 **Description:** ${createResult.task.description}`;
          }
          
          return response;
        }

        case 'update_task': {
          if (!analysis.entities.title) {
            return "Please specify which task you'd like to update. For example: 'update task Buy groceries to high priority' or 'mark homework as completed'.";
          }
          
          // Get all tasks to find the one to update
          const allTasksForUpdate = await toolExecutor('get_tasks', {});
          if (allTasksForUpdate.error || !allTasksForUpdate.tasks?.length) {
            return "You don't have any tasks to update.";
          }
          
          // Find exact or partial match
          let taskToUpdate = allTasksForUpdate.tasks.find((task: any) => 
            task.title.toLowerCase() === analysis.entities.title.toLowerCase()
          );
          
          if (!taskToUpdate) {
            const partialMatches = allTasksForUpdate.tasks.filter((task: any) => 
              task.title.toLowerCase().includes(analysis.entities.title.toLowerCase()) ||
              analysis.entities.title.toLowerCase().includes(task.title.toLowerCase())
            );
            
            if (partialMatches.length === 1) {
              taskToUpdate = partialMatches[0];
            } else if (partialMatches.length > 1) {
              let response = `I found multiple tasks matching "${analysis.entities.title}":\n\n`;
              for (let i = 0; i < partialMatches.length; i++) {
                const task = partialMatches[i];
                response += `${i + 1}. "${task.title}" (${task.status}, ${task.priority} priority)\n`;
              }
              response += '\nPlease be more specific about which task you want to update.';
              return response;
            }
          }
          
          if (!taskToUpdate) {
            return `I couldn't find a task with the title "${analysis.entities.title}". Use "show tasks" to see your current tasks.`;
          }
          
          // Prepare update data (only include changed fields)
          const updateData: any = { taskId: taskToUpdate.id };
          const changes: string[] = [];
          
          if (analysis.entities.priority && analysis.entities.priority !== taskToUpdate.priority) {
            updateData.priority = analysis.entities.priority;
            changes.push(`priority to ${analysis.entities.priority}`);
          }
          
          if (analysis.entities.status && analysis.entities.status !== taskToUpdate.status) {
            updateData.status = analysis.entities.status;
            changes.push(`status to ${analysis.entities.status}`);
          }
          
          if (analysis.entities.dueDate && analysis.entities.dueDate !== taskToUpdate.dueDate) {
            updateData.dueDate = analysis.entities.dueDate;
            changes.push(`due date to ${analysis.entities.dueDate}`);
          }
          
          if (analysis.entities.description && analysis.entities.description !== taskToUpdate.description) {
            updateData.description = analysis.entities.description;
            changes.push(`description`);
          }
          
          // Check if there's a new title (for renaming)
          const originalTitle = analysis.entities.title;
          const messageText = this.lastMessage || '';
          const newTitlePattern = /(?:to|as)\s+"([^"]+)"|(?:to|as)\s+(.+?)(?:\s+(?:with|by|due)|$)/i;
          const newTitleMatch = messageText.match(newTitlePattern);
          if (newTitleMatch && (newTitleMatch[1] || newTitleMatch[2])) {
            const newTitle = (newTitleMatch[1] || newTitleMatch[2]).trim();
            if (newTitle !== originalTitle && newTitle.length > 0) {
              updateData.title = newTitle;
              changes.push(`title to "${newTitle}"`);
            }
          }
          
          if (changes.length === 0) {
            return `I couldn't determine what changes you want to make to "${taskToUpdate.title}". Try being more specific, like "change task priority to high" or "mark task as completed".`;
          }
          
          const updateResult = await toolExecutor('update_task', updateData);
          
          if (updateResult.error) {
            return `Sorry, I couldn't update the task: ${updateResult.error}`;
          }
          
          return `✅ Task updated successfully! I changed the ${changes.join(', ')} for "${taskToUpdate.title}".`;
        }

        case 'delete_task': {
          if (!analysis.entities.title) {
            return "Please specify which task you'd like to delete. For example: 'delete task Buy groceries' or 'remove the homework task'.";
          }
          
          // First get all tasks to find exact or close matches
          const allTasksForDelete = await toolExecutor('get_tasks', {});
          if (allTasksForDelete.error || !allTasksForDelete.tasks?.length) {
            return "You don't have any tasks to delete.";
          }
          
          // Try to find exact match first
          let taskToDelete = allTasksForDelete.tasks.find((task: any) => 
            task.title.toLowerCase() === analysis.entities.title.toLowerCase()
          );
          
          // If no exact match, try partial match
          if (!taskToDelete) {
            const partialMatches = allTasksForDelete.tasks.filter((task: any) => 
              task.title.toLowerCase().includes(analysis.entities.title.toLowerCase()) ||
              analysis.entities.title.toLowerCase().includes(task.title.toLowerCase())
            );
            
            if (partialMatches.length === 1) {
              taskToDelete = partialMatches[0];
            } else if (partialMatches.length > 1) {
              let response = `I found multiple tasks matching "${analysis.entities.title}":\n\n`;
              for (let i = 0; i < partialMatches.length; i++) {
                const task = partialMatches[i];
                response += `${i + 1}. "${task.title}"\n`;
              }
              response += '\nPlease be more specific about which task you want to delete.';
              return response;
            }
          }
          
          if (!taskToDelete) {
            let response = `I couldn't find a task with the title "${analysis.entities.title}".`;
            if (allTasksForDelete.tasks.length > 0) {
              response += '\n\nYour current tasks are:\n';
              const tasksToShow = allTasksForDelete.tasks.slice(0, 5);
              for (let i = 0; i < tasksToShow.length; i++) {
                const task = tasksToShow[i];
                response += `• "${task.title}"\n`;
              }
              if (allTasksForDelete.tasks.length > 5) {
                response += `... and ${allTasksForDelete.tasks.length - 5} more tasks.`;
              }
            }
            return response;
          }
          
          const deleteResult = await toolExecutor('delete_task', { taskId: taskToDelete.id });
          
          if (deleteResult.error) {
            return `Sorry, I couldn't delete the task: ${deleteResult.error}`;
          }
          return `✅ Task deleted successfully! "${taskToDelete.title}" has been removed from your task list.`;
        }

        case 'get_tasks': {
          const getResult = await toolExecutor('get_tasks', analysis.entities);
          if (getResult.error) {
            return `Sorry, I couldn't retrieve your tasks: ${getResult.error}`;
          }
          
          if (!getResult.tasks?.length) {
            return "You don't have any tasks matching those criteria.";
          }
          
          let response = `📋 You have ${getResult.count} task${getResult.count === 1 ? '' : 's'}:\n\n`;
          for (let i = 0; i < getResult.tasks.length; i++) {
            const task = getResult.tasks[i];
            response += `${i + 1}. **${task.title}**\n`;
            response += `   - Priority: ${task.priority}\n`;
            response += `   - Status: ${task.status}\n`;
            if (task.dueDate) response += `   - Due: ${task.dueDate}\n`;
            if (task.description) response += `   - Description: ${task.description}\n`;
            response += '\n';
          }
          return response;
        }

        case 'calculator': {
          const calcResult = await toolExecutor('calculator', analysis.entities);
          if (calcResult.error) {
            return `Sorry, I couldn't perform that calculation: ${calcResult.error}`;
          }
          
          const { firstNum, secondNum, operation, result } = calcResult;
          const opSymbol = operation === 'add' ? '+' : operation === 'sub' ? '-' : operation === 'mul' ? '×' : '÷';
          return `🧮 ${firstNum} ${opSymbol} ${secondNum} = **${result}**`;
        }

        default: {
          return this.getGenericResponse(message);
        }
      }
    } catch (error) {
      return `I encountered an error processing your request: ${error}`;
    }
  }

  private getGenericResponse(message: string): string {
    // Check if it's a greeting
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(greeting => message.toLowerCase().includes(greeting))) {
      return "Hello! 👋 I'm Plan-It, your intelligent AI assistant. I can help you with:\n\n🎯 **Task Management** - Create, update, delete, and organize tasks\n🧮 **Calculations** - Quick math and computations\n💬 **General Chat** - Answer questions and have conversations\n\nJust talk to me naturally! What would you like to do today?";
    }
    
    // Check if it's a question about capabilities
    if (message.toLowerCase().includes('what can you do') || message.toLowerCase().includes('help me') || message.toLowerCase().includes('how do you work')) {
      return `I'm your intelligent assistant! Here's what I can help you with:

🎯 **Task Management:**
• Create tasks with smart defaults
• Update tasks (priority, status, dates)
• Delete tasks by title
• Show and filter your task lists

🧮 **Calculations:**
• Basic math operations
• Quick calculations

💬 **General Chat:**
• Answer questions and provide information
• Have conversations about various topics
• Offer productivity tips and advice

Just talk to me naturally - I'll use the right tools when needed!`;
    }
    
    // Check if it's about productivity or work-related topics
    const productivityKeywords = ['productive', 'productivity', 'organize', 'planning', 'time management', 'efficiency', 'workflow'];
    if (productivityKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return this.getProductivityAdvice(message);
    }
    
    // Check if it's a general question
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
    if (questionWords.some(word => message.toLowerCase().startsWith(word))) {
      return this.getInformationalResponse(message);
    }
    
    // For general conversation, provide contextual responses
    return this.getConversationalResponse(message);
  }
  
  private getProductivityAdvice(message: string): string {
    const productivityTips = [
      "Great question about productivity! Here are some tips:\n\n• Break large tasks into smaller, manageable pieces\n• Set clear priorities (I can help you mark tasks as high, medium, or low priority!)\n• Use time-blocking - assign specific time slots to tasks\n• Take regular breaks to maintain focus\n\nWould you like me to help you organize your current tasks?",
      
      "Productivity is all about working smarter, not harder! Consider these strategies:\n\n• Start with your most important task (eat the frog!)\n• Batch similar tasks together\n• Minimize distractions during focused work time\n• Review and adjust your task list regularly\n\nI can help you create and prioritize tasks to boost your productivity!",
      
      "Time management is key to productivity! Try these approaches:\n\n• Use the Pomodoro Technique (25 min work, 5 min break)\n• Plan your day the night before\n• Set realistic deadlines\n• Track what takes longer than expected\n\nI can help you schedule tasks with specific times and deadlines!"
    ];
    
    return productivityTips[Math.floor(Math.random() * productivityTips.length)];
  }
  
  private getInformationalResponse(message: string): string {
    // Simple pattern matching for common questions
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('time') && lowerMessage.includes('what')) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString()}. The date is ${now.toLocaleDateString()}. Is there a task you'd like to schedule for a specific time?`;
    }
    
    if (lowerMessage.includes('date') && lowerMessage.includes('what')) {
      const now = new Date();
      return `Today's date is ${now.toLocaleDateString()} (${now.toDateString()}). Need to schedule any tasks for today or another date?`;
    }
    
    if (lowerMessage.includes('weather')) {
      return "I don't have access to current weather data, but I can help you create weather-related tasks! For example, 'Create task Check weather before going out' or 'Add task Bring umbrella if it's raining tomorrow'.";
    }
    
    // General informational response
    return `That's an interesting question! While I can provide some general information and have conversations, I'm most helpful with:

• **Task Management** - Creating, organizing, and tracking your work
• **Productivity Tips** - Strategies to help you get more done  
• **Quick Calculations** - Basic math operations
• **General Chat** - Friendly conversations and advice

Is there anything specific I can help you with today?`;
  }
  
  private getConversationalResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Handle common conversational topics
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're very welcome! I'm glad I could help. If you need assistance with tasks, calculations, or just want to chat, I'm always here! 😊";
    }
    
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you feel')) {
      return "I'm doing great, thank you for asking! 🤖 I'm excited to help you with whatever you need - whether it's organizing tasks, solving problems, or just having a nice conversation. How are you doing today?";
    }
    
    if (lowerMessage.includes('tell me about yourself') || lowerMessage.includes('who are you')) {
      return "I'm Plan-It, your AI assistant! 🚀 I'm designed to be both intelligent and friendly. I love helping people stay organized with their tasks, but I also enjoy having conversations about all sorts of topics. I can help with productivity, answer questions, do calculations, or just chat. What interests you most?";
    }
    
    if (lowerMessage.includes('joke') || lowerMessage.includes('funny') || lowerMessage.includes('humor')) {
      return "Here's a productivity joke for you: Why did the task go to therapy? Because it had too many dependencies! 😄\n\nI love mixing humor with helpfulness. Need help organizing anything, or want to hear more about productivity tips?";
    }
    
    // General conversational responses
    const conversationalResponses = [
      "That's interesting! I enjoy our conversation. I'm here for both chatting and helping you stay productive - whatever you prefer!",
      
      "Thanks for sharing that with me! I love learning about different topics and helping however I can. Feel free to talk about anything or ask for assistance!",
      
      "I appreciate you chatting with me! Whether you want life advice, task help, quick calculations, or just friendly conversation, I'm happy to assist.",
      
      "That's really cool! I enjoy being both a helpful assistant and a conversational companion. What would you like to explore or accomplish today?",
      
      "Great point! I'm designed to be versatile - from organizing your work life to having meaningful conversations. What's most interesting to you right now?"
    ];
    
    return conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)];
  }
}

export default function ChatbotPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiAssistant = useRef(new TaskAssistantAI());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Tool execution functions
  const executeTaskTool = async (toolName: string, args: any) => {
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    try {
      switch (toolName) {
        case 'get_tasks': {
          const response = await fetch('/api/tasks');
          if (!response.ok) throw new Error('Failed to fetch tasks');
          const allTasks = await response.json();
          
          // Apply filters if provided
          let filteredTasks = allTasks;
          if (args.priority) {
            filteredTasks = filteredTasks.filter((task: any) => task.priority === args.priority);
          }
          if (args.status) {
            filteredTasks = filteredTasks.filter((task: any) => task.status === args.status);  
          }
          if (args.searchQuery) {
            const query = args.searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter((task: any) => 
              task.title.toLowerCase().includes(query) || 
              task.description?.toLowerCase().includes(query)
            );
          }
          
          return { tasks: filteredTasks, count: filteredTasks.length };
        }

        case 'create_task': {
          const createResponse = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: args.title || 'New Task',
              description: args.description || '',
              priority: args.priority || 'low',
              status: args.status || 'pending',
              dueDate: args.dueDate || new Date().toISOString().split('T')[0],
              startTime: args.startTime || `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
              endTime: args.endTime || `${((new Date().getHours() + 1) % 24).toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`
            })
          });
          if (!createResponse.ok) throw new Error('Failed to create task');
          const newTask = await createResponse.json();
          return { task: newTask };
        }

        case 'update_task': {
          const updateResponse = await fetch(`/api/tasks/${args.taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: args.title,
              description: args.description,
              priority: args.priority,
              status: args.status,
              dueDate: args.dueDate
            })
          });
          if (!updateResponse.ok) throw new Error('Failed to update task');
          const updatedTask = await updateResponse.json();
          return { task: updatedTask };
        }

        case 'delete_task': {
          const deleteResponse = await fetch(`/api/tasks/${args.taskId}`, {
            method: 'DELETE'
          });
          if (!deleteResponse.ok) throw new Error('Failed to delete task');
          return { success: true };
        }

        case 'calculator': {
          const { firstNum, secondNum, operation } = args;
          let result;
          switch (operation) {
            case 'add': 
              result = firstNum + secondNum; 
              break;
            case 'sub': 
              result = firstNum - secondNum; 
              break;
            case 'mul': 
              result = firstNum * secondNum; 
              break;
            case 'div': 
              result = secondNum !== 0 ? firstNum / secondNum : 'Error: Division by zero'; 
              break;
            default: 
              result = 'Error: Unknown operation';
          }
          return { firstNum, secondNum, operation, result };
        }

        default: {
          return { error: 'Unknown tool' };
        }
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const displayedMessages = useMemo(() => {
    if (messages.length === 0) {
      return [{
        role: 'assistant' as const,
        content: "👋 Hi! I'm Plan-It, your AI productivity assistant. I can help you:\n\n✅ Create, update, and delete tasks\n📊 Search and filter your tasks\n🧮 Perform calculations\n\nTry asking:\n• \"Create a task to review code by Friday\"\n• \"Show me all high-priority tasks\"\n• \"What's 25 times 8?\"\n• \"Mark my project report as completed\"",
        createdAt: new Date().toISOString(),
      }];
    }
    return messages;
  }, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isLoading || isStreaming) {
      return;
    }

    if (!session?.user) {
      alert('Please sign in to use the chatbot');
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setInputMessage('');

    // Add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Process message with AI assistant
      const response = await aiAssistant.current.processMessage(trimmed, async (toolName, args) => {
        setToolActivity(`🔧 Using ${toolName}...`);
        const result = await executeTaskTool(toolName, args);
        setToolActivity(null);
        return result;
      });

      // Simulate streaming for better UX
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Stream the response
      for (let i = 0; i <= response.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 20)); // Streaming speed
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 && msg.role === 'assistant' 
            ? { ...msg, content: response.slice(0, i) }
            : msg
        ));
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setToolActivity(null);
    }
  };

  // Quick action suggestions
  const quickActions = [
    { label: '📋 Show my tasks', prompt: 'Show me all my tasks' },
    { label: '✅ Create task', prompt: 'Create a new task for me' },
    { label: '🎯 High priority', prompt: 'Show me all high-priority tasks' },
    { label: '🧮 Calculator', prompt: 'What is 25 times 8?' },
  ];

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Task Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your tasks with AI-powered assistance - create, update, delete tasks, and perform calculations.</p>
        </div>

        <div className="glass-panel rounded-2xl flex flex-col min-h-[600px]">
          <header className="border-b border-gray-100 dark:border-gray-700 px-6 py-4">
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">Plan-It Assistant</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your AI-powered task management companion</p>
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
                    <span className={`block text-[10px] mt-2 ${message.role === 'user' ? 'opacity-80' : 'opacity-60'}`}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            ))}

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
            {messages.length === 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me to create tasks, show tasks, calculate something..."
                disabled={isLoading || isStreaming}
                className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || isStreaming || !inputMessage.trim()}
                className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-semibold disabled:opacity-60 transition-opacity hover:bg-primary-700"
              >
                {isStreaming ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Processing...
                  </span>
                ) : isLoading ? (
                  'Sending...'
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
