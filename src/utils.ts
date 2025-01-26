import { GPushError } from './errors.js';

const MAX_DIFF_LENGTH = parseInt(process.env.MAX_DIFF_LENGTH || '4000', 10);

export function truncateDiff(diff: string): string {
  if (!diff) throw new GPushError('No git diff available', 5);
  return diff.length > MAX_DIFF_LENGTH 
    ? diff.substring(0, MAX_DIFF_LENGTH) + '\n... (truncated due to length)'
    : diff;
}

export function validateApiKey(key: string): void {
  // OpenAI API keys start with 'sk-' and contain a mix of characters
  if (!/^sk-[A-Za-z0-9-_]{20,}$/.test(key)) {
    throw new GPushError('Invalid API key format. API key should start with "sk-" followed by letters and numbers', 3);
  }
} 