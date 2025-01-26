import { describe, expect, test, beforeEach } from '@jest/globals';
import { truncateDiff } from '../src/utils';

describe('GPush Utilities', () => {
  describe('truncateDiff', () => {
    test('should truncate long diffs', () => {
      const longDiff = 'a'.repeat(5000);
      const result = truncateDiff(longDiff);
      expect(result.length).toBe(4000 + 30); // Length of '\n... (truncated due to length)'
    });

    test('should leave short diffs unchanged', () => {
      const shortDiff = 'test diff';
      const result = truncateDiff(shortDiff);
      expect(result).toBe(shortDiff);
    });
  });
}); 