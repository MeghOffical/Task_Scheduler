/**
 * Example unit test for a utility function
 * This demonstrates how to write unit tests in the testing directory
 */

describe('Example Utility Tests', () => {
  describe('String manipulation', () => {
    it('should concatenate two strings', () => {
      const result = 'Hello' + ' ' + 'World';
      expect(result).toBe('Hello World');
    });

    it('should convert string to uppercase', () => {
      const result = 'test'.toUpperCase();
      expect(result).toBe('TEST');
    });

    it('should trim whitespace from string', () => {
      const result = '  test  '.trim();
      expect(result).toBe('test');
    });
  });

  describe('Array operations', () => {
    it('should filter array elements', () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = numbers.filter(n => n > 3);
      expect(result).toEqual([4, 5]);
    });

    it('should map array elements', () => {
      const numbers = [1, 2, 3];
      const result = numbers.map(n => n * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should reduce array to sum', () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = numbers.reduce((sum, n) => sum + n, 0);
      expect(result).toBe(15);
    });
  });

  describe('Object manipulation', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const result = { ...obj1, ...obj2 };
      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should extract object keys', () => {
      const obj = { name: 'John', age: 30, city: 'NYC' };
      const result = Object.keys(obj);
      expect(result).toEqual(['name', 'age', 'city']);
    });
  });
});
