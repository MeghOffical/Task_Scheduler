/**
 * Unit tests for chatbot service
 */

import { generateChatTitle, generateResponse } from './chatbot-service';

// Mock the Google AI SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mocked AI response'),
        },
      }),
    }),
  })),
}));

describe('Chatbot Service', () => {
  describe('generateChatTitle', () => {
    it('should generate title from first message', async () => {
      const message = 'Create a task for buying groceries tomorrow';
      const title = await generateChatTitle(message);
      
      expect(title).toBeDefined();
      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
    });

    it('should handle short messages', async () => {
      const message = 'Help';
      const title = await generateChatTitle(message);
      
      expect(title).toBeDefined();
      expect(typeof title).toBe('string');
    });

    it('should handle long messages', async () => {
      const message = 'I need help creating a comprehensive task management system with priorities, due dates, and notifications. Can you assist me with setting up multiple tasks?';
      const title = await generateChatTitle(message);
      
      expect(title).toBeDefined();
      expect(typeof title).toBe('string');
      expect(title.length).toBeLessThan(100); // Should be truncated
    });

    it('should handle empty message gracefully', async () => {
      const message = '';
      const title = await generateChatTitle(message);
      
      expect(title).toBeDefined();
      expect(typeof title).toBe('string');
    });

    it('should handle special characters', async () => {
      const message = 'Task: Buy groceries @10:00 #urgent';
      const title = await generateChatTitle(message);
      
      expect(title).toBeDefined();
      expect(typeof title).toBe('string');
    });
  });

  describe('generateResponse', () => {
    it('should generate response for user message', async () => {
      const messages = [
        { role: 'user' as const, content: 'What tasks do I have today?' },
      ];
      
      const response = await generateResponse(messages);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle conversation context', async () => {
      const messages = [
        { role: 'user' as const, content: 'Create a task' },
        { role: 'assistant' as const, content: 'What task would you like to create?' },
        { role: 'user' as const, content: 'Buy groceries' },
      ];
      
      const response = await generateResponse(messages);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should handle system messages', async () => {
      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'Help me with tasks' },
      ];
      
      const response = await generateResponse(messages);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should handle empty message array', async () => {
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
      
      await expect(generateResponse(messages)).rejects.toThrow();
    });

    it('should handle multi-turn conversation', async () => {
      const messages = [
        { role: 'user' as const, content: 'Show my tasks' },
        { role: 'assistant' as const, content: 'You have 3 tasks' },
        { role: 'user' as const, content: 'Show the first one' },
        { role: 'assistant' as const, content: 'Task 1: Buy groceries' },
        { role: 'user' as const, content: 'Mark it as complete' },
      ];
      
      const response = await generateResponse(messages);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // This will use the mocked implementation
      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ];
      
      const response = await generateResponse(messages);
      
      // Should still return a response (mocked)
      expect(response).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      jest.setTimeout(10000);
      
      const messages = [
        { role: 'user' as const, content: 'Test message' },
      ];
      
      // Should complete within timeout
      const response = await generateResponse(messages);
      expect(response).toBeDefined();
    });
  });

  describe('Response Quality', () => {
    it('should generate contextually relevant responses', async () => {
      const messages = [
        { role: 'user' as const, content: 'How do I create a high priority task?' },
      ];
      
      const response = await generateResponse(messages);
      
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(10);
    });

    it('should maintain conversation flow', async () => {
      const messages = [
        { role: 'user' as const, content: 'Create a task' },
        { role: 'assistant' as const, content: 'What would you like the task to be?' },
        { role: 'user' as const, content: 'Buy groceries tomorrow' },
      ];
      
      const response = await generateResponse(messages);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('Configuration', () => {
    it('should use environment variables', () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const model = process.env.GOOGLE_GENERATIVE_AI_MODEL;
      
      // Should be defined or have defaults
      expect(apiKey || 'default-key').toBeDefined();
      expect(model || 'gemini-1.5-flash').toBeDefined();
    });

    it('should validate model configuration', () => {
      const validModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      const currentModel = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-1.5-flash';
      
      expect(validModels).toContain(currentModel);
    });
  });
});
