import OpenAI from 'openai';
import { Command } from 'commander';
import { getConfig } from './config.js';
import { GPushError } from './errors.js';
import { validateApiKey } from './utils.js';

let openaiInstance: OpenAI | null = null;

export function initializeOpenAI() {
  const config = getConfig();
  validateApiKey(config.OPENAI_API_KEY);
  
  openaiInstance = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
  });
}

export async function generateCommitMessage(diff: string): Promise<string> {
  if (!openaiInstance) initializeOpenAI();

  try {
    const completion = await openaiInstance!.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Generate a concise, conventional commit message for this diff. Focus on technical accuracy and clarity.'
        },
        {
          role: 'user',
          content: diff
        }
      ],
      max_tokens: 200
    });

    const message = completion.choices[0].message.content;
    if (!message) throw new GPushError('Failed to generate commit message', 3);
    
    return message.trim();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new GPushError(`AI API Error: ${error.message}`, 4);
    }
    throw new GPushError('Unknown AI API Error', 4);
  }
}

export function configureAICommands(program: Command) {
  program
    .command('ai:model')
    .description('Set default AI model')
    .argument('<model>', 'Model name (e.g., gpt-4, gpt-4-turbo)')
    .action((model: string) => {
      getConfig().set('OPENAI_MODEL', model);
      console.log(`Default AI model set to: ${model}`);
    });
} 