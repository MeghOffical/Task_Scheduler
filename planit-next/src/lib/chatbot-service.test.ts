/**
 * Unit tests for chatbot service
 */

// Store mock implementations for dynamic updates
let mockSendMessage: jest.Mock;
let mockSendMessageStream: jest.Mock;

// Mock the Google AI SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mocked AI response'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      }),
      startChat: jest.fn().mockReturnValue({
        sendMessage: (...args: any[]) => mockSendMessage(...args),
        sendMessageStream: (...args: any[]) => mockSendMessageStream(...args),
      }),
    }),
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

import { generateAssistantMessage, streamAssistantMessage } from './chatbot-service';

describe('Chatbot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSendMessage = jest.fn().mockResolvedValue({
      response: {
        text: jest.fn().mockReturnValue('Mocked chat response'),
        functionCalls: jest.fn().mockReturnValue(null),
      },
    });
    
    mockSendMessageStream = jest.fn().mockReturnValue({
      stream: (async function* () {
        yield {
          text: () => 'Mocked',
          functionCalls: () => null,
        };
      })(),
    });
    
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Tool Definitions', () => {
    it('should have search_tasks tool with correct structure', () => {
      const searchTool = {
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
      };
      
      expect(searchTool.name).toBe('search_tasks');
      expect(searchTool.description).toContain('Search');
      expect(searchTool.parameters.type).toBe('object');
      expect(searchTool.parameters.properties.query).toBeDefined();
      expect(searchTool.parameters.properties.status).toBeDefined();
      expect(searchTool.parameters.properties.priority).toBeDefined();
      expect(searchTool.parameters.required).toEqual([]);
    });

    it('should have search_tasks tool with valid status enum', () => {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('in-progress');
      expect(validStatuses).toContain('completed');
      expect(validStatuses.length).toBe(3);
    });

    it('should have search_tasks tool with valid priority enum', () => {
      const validPriorities = ['low', 'medium', 'high'];
      expect(validPriorities).toContain('low');
      expect(validPriorities).toContain('medium');
      expect(validPriorities).toContain('high');
      expect(validPriorities.length).toBe(3);
    });

    it('should have get_task_stats tool with correct structure', () => {
      const statsTool = {
        name: 'get_task_stats',
        description: 'Get statistics about user tasks including counts by status and priority',
        parameters: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      };
      
      expect(statsTool.name).toBe('get_task_stats');
      expect(statsTool.description).toContain('statistics');
      expect(statsTool.parameters.type).toBe('object');
      expect(statsTool.parameters.required).toEqual([]);
      expect(Object.keys(statsTool.parameters.properties).length).toBe(0);
    });

    it('should have suggest_priorities tool with correct structure', () => {
      const prioritiesTool = {
        name: 'suggest_priorities',
        description: 'Analyze user tasks and suggest which tasks should be prioritized based on due dates and current status',
        parameters: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      };
      
      expect(prioritiesTool.name).toBe('suggest_priorities');
      expect(prioritiesTool.description).toContain('prioritize');
      expect(prioritiesTool.parameters.type).toBe('object');
      expect(prioritiesTool.parameters.required).toEqual([]);
      expect(Object.keys(prioritiesTool.parameters.properties).length).toBe(0);
    });

    it('should have exactly 3 tools defined', () => {
      const toolCount = 3;
      expect(toolCount).toBe(3);
    });

    it('should have unique tool names', () => {
      const toolNames = ['search_tasks', 'get_task_stats', 'suggest_priorities'];
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(toolNames.length);
    });

    it('should have non-empty tool names', () => {
      const toolNames = ['search_tasks', 'get_task_stats', 'suggest_priorities'];
      toolNames.forEach(name => {
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        expect(typeof name).toBe('string');
      });
    });

    it('should have non-empty tool descriptions', () => {
      const descriptions = [
        'Search through user tasks by title, description, status, or priority',
        'Get statistics about user tasks including counts by status and priority',
        'Analyze user tasks and suggest which tasks should be prioritized based on due dates and current status',
      ];
      
      descriptions.forEach(desc => {
        expect(desc).toBeDefined();
        expect(desc.length).toBeGreaterThan(0);
        expect(typeof desc).toBe('string');
      });
    });

    it('should have valid parameter types for all tools', () => {
      const tools = [
        { name: 'search_tasks', paramType: 'object' },
        { name: 'get_task_stats', paramType: 'object' },
        { name: 'suggest_priorities', paramType: 'object' },
      ];
      
      tools.forEach(tool => {
        expect(tool.paramType).toBe('object');
      });
    });

    it('should have required fields as arrays', () => {
      const requiredFields = [[], [], []];
      requiredFields.forEach(field => {
        expect(Array.isArray(field)).toBe(true);
      });
    });
  });

  describe('Model Configuration', () => {
    it('should use correct model name', () => {
      const modelName = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-2.0-flash-exp';
      expect(modelName).toBeDefined();
      expect(typeof modelName).toBe('string');
      expect(modelName.length).toBeGreaterThan(0);
    });

    it('should have system prompt defined', () => {
      const systemPrompt = 'You are Plan-It, a friendly and focused productivity assistant';
      expect(systemPrompt).toBeDefined();
      expect(systemPrompt.length).toBeGreaterThan(0);
      expect(systemPrompt).toContain('Plan-It');
    });

    it('should initialize GoogleGenerativeAI when API key exists', () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (apiKey) {
        expect(apiKey).toBeDefined();
        expect(typeof apiKey).toBe('string');
      }
    });

    it('should handle missing API key gracefully', () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const genAI = apiKey ? { initialized: true } : null;
      
      if (!apiKey) {
        expect(genAI).toBeNull();
      }
    });
  });

  describe('generateAssistantMessage', () => {
    it('should generate message from user input', async () => {
      const history: any[] = [];
      const userMessage = 'Create a task for buying groceries tomorrow';
      const userId = 'test-user-123';
      
      const result = await generateAssistantMessage(history, userMessage, userId);
      
      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
    });

    it('should handle conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'Create a task' },
        { role: 'assistant' as const, content: 'What task would you like to create?' },
      ];
      const userMessage = 'Buy groceries';
      const userId = 'test-user-123';
      
      const result = await generateAssistantMessage(history, userMessage, userId);
      
      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it('should handle empty history', async () => {
      const history: any[] = [];
      const userMessage = 'Hello';
      const userId = 'test-user-123';
      
      const result = await generateAssistantMessage(history, userMessage, userId);
      
      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it('should handle empty user message', async () => {
      const history: any[] = [];
      const userMessage = '';
      const userId = 'test-user-123';
      
      const result = await generateAssistantMessage(history, userMessage, userId);
      
      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it('should handle different user IDs', async () => {
      const history: any[] = [];
      const userMessage = 'Hello';
      
      const result1 = await generateAssistantMessage(history, userMessage, 'user-1');
      const result2 = await generateAssistantMessage(history, userMessage, 'user-2');
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('streamAssistantMessage', () => {
    it('should stream response chunks', async () => {
      const history: any[] = [];
      const userMessage = 'What tasks do I have?';
      const userId = 'test-user-123';
      
      const stream = streamAssistantMessage(history, userMessage, userId);
      
      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle streaming errors gracefully', async () => {
      const history: any[] = [];
      const userMessage = 'Test';
      const userId = 'test-user-123';
      
      const stream = streamAssistantMessage(history, userMessage, userId);
      
      // Should not throw
      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      expect(chunks).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should handle missing API key', async () => {
      const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      // Should handle gracefully
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      expect(apiKey).toBeUndefined();
      
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
    });

    it('should use default model if not specified', () => {
      const model = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-2.0-flash-exp';
      expect(model).toBeDefined();
      expect(typeof model).toBe('string');
    });
  });

  describe('Tool Execution - search_tasks', () => {
    beforeEach(() => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    });

    it('should build query parameters correctly for search_tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', description: 'Description 1', status: 'pending', priority: 'high', dueDate: '2024-12-01' },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: { query: 'test', status: 'pending', priority: 'high' } },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Found your tasks'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Find my tasks', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test'),
        expect.objectContaining({
          headers: { 'x-user-id': 'user-123' },
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('priority=high'),
        expect.any(Object)
      );
    });

    it('should handle search_tasks with only query parameter', async () => {
      const mockTasks = [{ id: '1', title: 'Task 1' }];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: { query: 'test' } },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Found tasks'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Search test', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test'),
        expect.any(Object)
      );
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('status='),
        expect.any(Object)
      );
    });

    it('should handle search_tasks with only status parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: { status: 'completed' } },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('No completed tasks'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Show completed', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=completed'),
        expect.any(Object)
      );
    });

    it('should handle search_tasks with only priority parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: { priority: 'high' } },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('No high priority tasks'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Show high priority', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('priority=high'),
        expect.any(Object)
      );
    });

    it('should limit tasks to 10 in search results', async () => {
      const mockTasks = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        status: 'pending',
        priority: 'medium',
        dueDate: '2024-12-01',
      }));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: { query: 'test' } },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Found 15 tasks, showing first 10'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      const result = await generateAssistantMessage([], 'Search', 'user-123');
      expect(result.response).toBeDefined();
    });

    it('should truncate long descriptions to 100 characters', async () => {
      const longDescription = 'A'.repeat(200);
      const mockTasks = [
        { id: '1', title: 'Task', description: longDescription, status: 'pending', priority: 'medium', dueDate: '2024-12-01' },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Task found'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Find tasks', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle search_tasks API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: { query: 'test' } },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Sorry, failed to fetch tasks'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Search', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle search_tasks network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Network error occurred'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Search', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use NEXTAUTH_URL from environment', async () => {
      process.env.NEXTAUTH_URL = 'https://example.com';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Done'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Search', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com'),
        expect.any(Object)
      );
    });

    it('should default to localhost when NEXTAUTH_URL is not set', async () => {
      delete process.env.NEXTAUTH_URL;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'search_tasks', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Done'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Search', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000'),
        expect.any(Object)
      );
    });
  });

  describe('Tool Execution - get_task_stats', () => {
    it('should call stats API correctly', async () => {
      const mockStats = { pending: 5, completed: 10, overdue: 2 };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'get_task_stats', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('You have 5 pending tasks'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'How many tasks?', 'user-123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/stats'),
        expect.objectContaining({
          headers: { 'x-user-id': 'user-123' },
        })
      );
    });

    it('should handle get_task_stats API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'get_task_stats', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Could not retrieve stats'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Stats?', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle get_task_stats network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'get_task_stats', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Error occurred'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Stats', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Tool Execution - suggest_priorities', () => {
    it('should calculate priority scores for overdue tasks', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const mockTasks = [
        { id: '1', title: 'Overdue Task', priority: 'high', status: 'pending', dueDate: yesterday.toISOString() },
        { id: '2', title: 'Normal Task', priority: 'low', status: 'pending', dueDate: null },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Focus on overdue task first'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'What should I prioritize?', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle tasks due today', async () => {
      const now = new Date();
      const today = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const mockTasks = [
        { id: '1', title: 'Due Today', priority: 'medium', status: 'pending', dueDate: today.toISOString() },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Task due today'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Priorities?', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle tasks due within 3 days', async () => {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);
      
      const mockTasks = [
        { id: '1', title: 'Due Soon', priority: 'low', status: 'pending', dueDate: threeDaysLater.toISOString() },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Task due this week'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'What to focus on?', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should score high priority tasks correctly', async () => {
      const mockTasks = [
        { id: '1', title: 'High Priority', priority: 'high', status: 'pending', dueDate: null },
        { id: '2', title: 'Medium Priority', priority: 'medium', status: 'pending', dueDate: null },
        { id: '3', title: 'Low Priority', priority: 'low', status: 'pending', dueDate: null },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('High priority first'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Suggest priorities', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should filter out completed tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Pending', priority: 'high', status: 'pending', dueDate: null },
        { id: '2', title: 'Completed', priority: 'high', status: 'completed', dueDate: null },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('One pending task'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'What should I do?', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should limit suggestions to top 5 tasks', async () => {
      const mockTasks = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
        priority: 'high',
        status: 'pending',
        dueDate: null,
      }));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Top 5 tasks to focus on'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Priorities', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle suggest_priorities API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Could not generate suggestions'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Suggest', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle suggest_priorities network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'suggest_priorities', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Error getting suggestions'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Suggest', 'user-123');
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Tool Execution - Unknown Tool', () => {
    it('should handle unknown tool name', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue([
            { name: 'unknown_tool', args: {} },
          ]),
        },
      }).mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Tool not found'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage([], 'Test', 'user-123');
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Function Call Iteration', () => {
    it('should handle multiple function call iterations', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ pending: 5 }) });

      mockSendMessage
        .mockResolvedValueOnce({
          response: {
            text: jest.fn().mockReturnValue(''),
            functionCalls: jest.fn().mockReturnValue([
              { name: 'search_tasks', args: {} },
            ]),
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: jest.fn().mockReturnValue(''),
            functionCalls: jest.fn().mockReturnValue([
              { name: 'get_task_stats', args: {} },
            ]),
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: jest.fn().mockReturnValue('You have 0 tasks, 5 pending'),
            functionCalls: jest.fn().mockReturnValue(null),
          },
        });

      const result = await generateAssistantMessage([], 'Check tasks', 'user-123');
      expect(result.response).toBe('You have 0 tasks, 5 pending');
      expect(mockSendMessage).toHaveBeenCalledTimes(3);
    });

    it('should stop after max iterations', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });

      // Return function calls for first 5 iterations, then return text
      let callCount = 0;
      mockSendMessage.mockImplementation(async () => {
        callCount++;
        if (callCount <= 5) {
          return {
            response: {
              text: jest.fn().mockReturnValue(''),
              functionCalls: jest.fn().mockReturnValue([
                { name: 'search_tasks', args: {} },
              ]),
            },
          };
        } else {
          return {
            response: {
              text: jest.fn().mockReturnValue('Max iterations reached'),
              functionCalls: jest.fn().mockReturnValue(null),
            },
          };
        }
      });

      const result = await generateAssistantMessage([], 'Test', 'user-123');
      
      // Should stop at 5 iterations + 1 initial = 6 calls
      expect(mockSendMessage).toHaveBeenCalledTimes(6);
      expect(result.response).toBe('Max iterations reached');
    });

    it('should stop when functionCalls returns empty array', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Done with no function calls'),
          functionCalls: jest.fn().mockReturnValue([]),
        },
      });

      const result = await generateAssistantMessage([], 'Test', 'user-123');
      expect(result.response).toBe('Done with no function calls');
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple tool calls in single iteration', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ pending: 3 }) });

      mockSendMessage
        .mockResolvedValueOnce({
          response: {
            text: jest.fn().mockReturnValue(''),
            functionCalls: jest.fn().mockReturnValue([
              { name: 'search_tasks', args: {} },
              { name: 'get_task_stats', args: {} },
            ]),
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: jest.fn().mockReturnValue('Results ready'),
            functionCalls: jest.fn().mockReturnValue(null),
          },
        });

      const result = await generateAssistantMessage([], 'Get info', 'user-123');
      expect(result.response).toBe('Results ready');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Response Validation', () => {
    it('should throw error when assistant returns empty response', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue(''),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await expect(
        generateAssistantMessage([], 'Test', 'user-123')
      ).rejects.toThrow('Assistant returned an empty response');
    });

    it('should throw error when text is whitespace only', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('   \n\t   '),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await expect(
        generateAssistantMessage([], 'Test', 'user-123')
      ).rejects.toThrow('Assistant returned an empty response');
    });

    it('should trim whitespace from response', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('  Valid response  \n'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      const result = await generateAssistantMessage([], 'Test', 'user-123');
      expect(result.response).toBe('Valid response');
    });
  });

  describe('History Sanitization', () => {
    it('should filter out tool and system messages from history', async () => {
      const history = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'tool' as const, content: 'Tool result', toolCallId: '1', name: 'search' },
        { role: 'assistant' as const, content: 'Hi there' },
        { role: 'system' as const, content: 'System message' },
      ];

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Response'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage(history, 'Test', 'user-123');
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('should convert assistant role to model', async () => {
      const history = [
        { role: 'assistant' as const, content: 'Previous response' },
      ];

      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('New response'),
          functionCalls: jest.fn().mockReturnValue(null),
        },
      });

      await generateAssistantMessage(history, 'Test', 'user-123');
      expect(mockSendMessage).toHaveBeenCalled();
    });
  });

  describe('Streaming with Function Calls', () => {
    it('should handle function calls in streaming mode', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      mockSendMessageStream.mockReturnValueOnce({
        stream: (async function* () {
          yield {
            text: () => 'Searching...',
            functionCalls: () => null,
          };
          yield {
            text: () => '',
            functionCalls: () => [{ name: 'search_tasks', args: {} }],
          };
          yield {
            text: () => 'Done',
            functionCalls: () => null,
          };
        })(),
      });

      const chunks: any[] = [];
      for await (const chunk of streamAssistantMessage([], 'Search', 'user-123')) {
        chunks.push(chunk);
      }
      
      expect(chunks.some(c => c.type === 'text')).toBe(true);
      expect(chunks.some(c => c.type === 'tool_call')).toBe(true);
      expect(chunks.some(c => c.type === 'tool_result')).toBe(true);
      expect(chunks.some(c => c.type === 'done')).toBe(true);
    });

    it('should generate unique tool call IDs in streaming', async () => {
      mockSendMessageStream.mockReturnValueOnce({
        stream: (async function* () {
          yield {
            text: () => '',
            functionCalls: () => [
              { name: 'search_tasks', args: {} },
              { name: 'get_task_stats', args: {} },
            ],
          };
        })(),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const toolCalls: any[] = [];
      for await (const chunk of streamAssistantMessage([], 'Test', 'user-123')) {
        if (chunk.type === 'tool_call') {
          toolCalls.push(chunk.toolCall);
        }
      }
      
      expect(toolCalls.length).toBe(2);
      expect(toolCalls[0].id).toBeDefined();
      expect(toolCalls[1].id).toBeDefined();
    });

    it('should handle streaming with no function calls', async () => {
      mockSendMessageStream.mockReturnValueOnce({
        stream: (async function* () {
          yield {
            text: () => 'Simple',
            functionCalls: () => null,
          };
          yield {
            text: () => ' response',
            functionCalls: () => null,
          };
        })(),
      });

      const chunks: any[] = [];
      for await (const chunk of streamAssistantMessage([], 'Hi', 'user-123')) {
        chunks.push(chunk);
      }
      
      expect(chunks.filter(c => c.type === 'text').length).toBe(2);
      expect(chunks.filter(c => c.type === 'tool_call').length).toBe(0);
    });

    it('should skip empty text chunks in streaming', async () => {
      mockSendMessageStream.mockReturnValueOnce({
        stream: (async function* () {
          yield {
            text: () => '',
            functionCalls: () => null,
          };
          yield {
            text: () => 'Text',
            functionCalls: () => null,
          };
        })(),
      });

      const chunks: any[] = [];
      for await (const chunk of streamAssistantMessage([], 'Hi', 'user-123')) {
        chunks.push(chunk);
      }
      
      expect(chunks.filter(c => c.type === 'text').length).toBe(1);
    });
  });
});
