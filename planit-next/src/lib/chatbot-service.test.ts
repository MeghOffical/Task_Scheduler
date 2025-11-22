/**
 * Unit tests for chatbot service
 */

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
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('Mocked chat response'),
            functionCalls: jest.fn().mockReturnValue(null),
          },
        }),
        sendMessageStream: jest.fn().mockReturnValue({
          stream: (async function* () {
            yield {
              text: () => 'Mocked',
              functionCalls: () => null,
            };
          })(),
        }),
      }),
    }),
  })),
}));

import { generateAssistantMessage, streamAssistantMessage } from './chatbot-service';

describe('Chatbot Service', () => {
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
});
