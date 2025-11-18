/**
 * Integration test example
 * This demonstrates how to write integration tests
 */

describe('Integration Test Example', () => {
  describe('API Integration', () => {
    it('should handle async operations', async () => {
      const asyncOperation = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('success'), 100);
        });
      };

      const result = await asyncOperation();
      expect(result).toBe('success');
    });

    it('should handle multiple async operations', async () => {
      const operation1 = async () => 'result1';
      const operation2 = async () => 'result2';

      const [result1, result2] = await Promise.all([
        operation1(),
        operation2()
      ]);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });
  });

  describe('Component Integration', () => {
    it('should validate data flow', () => {
      const processData = (data: string) => data.toUpperCase();
      const formatOutput = (data: string) => `Formatted: ${data}`;

      const input = 'test data';
      const processed = processData(input);
      const output = formatOutput(processed);

      expect(output).toBe('Formatted: TEST DATA');
    });
  });
});
