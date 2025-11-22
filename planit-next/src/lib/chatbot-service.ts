import { GoogleGenerativeAI } from '@google/generative-ai';

type StoredMessage = {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
};

type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, any>;
};

type StreamChunk = {
  type: 'text' | 'tool_call' | 'tool_result' | 'done';
  content?: string;
  toolCall?: ToolCall;
  toolResult?: { id: string; result: any };
};

const MODEL_NAME = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? 'gemini-2.0-flash-exp';
const SYSTEM_PROMPT = `You are Plan-It, a friendly and focused productivity assistant that helps users manage their tasks and improve productivity.

When users greet you with messages like "hi", "hello", "hey", or similar, respond warmly and introduce yourself briefly. For example:
- "Hello! I'm Plan-It, your productivity assistant. I'm here to help you manage your tasks and stay organized. How can I assist you today?"
- "Hi there! Welcome to Plan-It! I can help you create tasks, check your schedule, and keep you on track. What would you like to do?"

You have access to the following tools:
- search_tasks: Search through the user's tasks by keywords or filters
- get_task_stats: Get statistics about pending, completed, and overdue tasks
- suggest_priorities: Analyze tasks and suggest which ones to prioritize

Be conversational and helpful. When discussing tasks, use these tools to provide actionable insights and recommendations. Keep your responses concise but friendly.`;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Tool definitions for task management
const tools = [
  {
    name: 'search_tasks',
    description: 'Search through user tasks by title, description, status, or priority',
    parameters: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Search query to match task title or description' },
        status: { type: 'string' as const, description: 'Filter by status: pending, in-progress, completed', enum: ['pending', 'in-progress', 'completed'] },
        priority: { type: 'string' as const, description: 'Filter by priority: low, medium, high', enum: ['low', 'medium', 'high'] },
      },
      required: [],
    },
  },
  {
    name: 'get_task_stats',
    description: 'Get statistics about user tasks including counts by status and priority',
    parameters: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'suggest_priorities',
    description: 'Analyze user tasks and suggest which tasks should be prioritized based on due dates and current status',
    parameters: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

// Tool execution functions
async function executeTool(name: string, args: Record<string, any>, userId: string): Promise<any> {
  if (name === 'search_tasks') {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (args.query) params.append('q', args.query);
      if (args.status) params.append('status', args.status);
      if (args.priority) params.append('priority', args.priority);

      // Make internal API call with user context
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/tasks?${params.toString()}`, {
        headers: {
          'x-user-id': userId, // Pass user ID for internal auth
        },
      });

      if (!response.ok) {
        return { error: 'Failed to fetch tasks' };
      }

      const tasks = await response.json();
      
      // Return formatted task list
      return {
        found: tasks.length,
        tasks: tasks.slice(0, 10).map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description?.substring(0, 100),
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        })),
      };
    } catch (e) {
      return { error: String(e) };
    }
  } else if (name === 'get_task_stats') {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/tasks/stats`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        return { error: 'Failed to fetch task stats' };
      }

      return await response.json();
    } catch (e) {
      return { error: String(e) };
    }
  } else if (name === 'suggest_priorities') {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/tasks`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        return { error: 'Failed to fetch tasks' };
      }

      const tasks = await response.json();
      
      // Analyze and prioritize tasks
      const now = new Date();
      const prioritized = tasks
        .filter((t: any) => t.status !== 'completed')
        .map((t: any) => {
          const dueDate = t.dueDate ? new Date(t.dueDate) : null;
          const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
          
          // Calculate priority score
          let score = 0;
          if (t.priority === 'high') score += 10;
          else if (t.priority === 'medium') score += 5;
          else score += 2;
          
          if (daysUntilDue < 0) score += 20; // Overdue
          else if (daysUntilDue <= 1) score += 15; // Due today/tomorrow
          else if (daysUntilDue <= 3) score += 10; // Due this week
          
          return { ...t, priorityScore: score, daysUntilDue };
        })
        .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
        .slice(0, 5);

      return {
        recommendations: prioritized.map((t: any) => ({
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          reason: t.daysUntilDue < 0 ? 'Overdue!' : 
                  t.daysUntilDue <= 1 ? 'Due very soon' : 
                  t.priority === 'high' ? 'High priority' : 'Needs attention',
        })),
      };
    } catch (e) {
      return { error: String(e) };
    }
  }
  return { error: 'Unknown tool' };
}

const model = genAI?.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: SYSTEM_PROMPT,
  tools: [{ functionDeclarations: tools }],
});

export async function generateAssistantMessage(
  history: StoredMessage[],
  latestUserMessage: string,
  userId: string
): Promise<{ response: string; toolCalls?: ToolCall[] }> {
  if (!model) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  const sanitizedHistory = history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  const chatSession = model.startChat({
    history: sanitizedHistory,
  });

  let result = await chatSession.sendMessage(latestUserMessage);
  let response = result.response;

  // Handle tool calls iteratively (similar to LangGraph's loop)
  const maxIterations = 5;
  let iterations = 0;
  
  while (response.functionCalls() && iterations < maxIterations) {
    iterations++;
    const functionCalls = response.functionCalls();
    
    // Execute all tool calls
    const toolResults = await Promise.all(
      functionCalls.map(async (call) => {
        const result = await executeTool(call.name, call.args, userId);
        return {
          functionResponse: {
            name: call.name,
            response: result,
          },
        };
      })
    );

    // Send tool results back to the model
    result = await chatSession.sendMessage(toolResults as any);
    response = result.response;
  }

  const textResponse = response.text()?.trim();

  if (!textResponse) {
    throw new Error('Assistant returned an empty response');
  }

  return { response: textResponse };
}

export async function* streamAssistantMessage(
  history: StoredMessage[],
  latestUserMessage: string,
  userId: string
): AsyncGenerator<StreamChunk> {
  if (!model) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  const sanitizedHistory = history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  const chatSession = model.startChat({
    history: sanitizedHistory,
  });

  const result = await chatSession.sendMessageStream(latestUserMessage);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { type: 'text', content: text };
    }
    
    // Handle function calls if present
    const functionCalls = chunk.functionCalls();
    if (functionCalls) {
      for (const call of functionCalls) {
        const toolCall: ToolCall = {
          id: `call_${Date.now()}`,
          name: call.name,
          arguments: call.args,
        };
        yield { type: 'tool_call', toolCall };

        // Execute tool
        const toolResult = await executeTool(call.name, call.args, userId);
        yield { type: 'tool_result', toolResult: { id: toolCall.id, result: toolResult } };
      }
    }
  }
  
  yield { type: 'done' };
}
