import OpenAI from 'openai';
import { Command } from 'commander';
import { getConfig } from './config.js';
import { GPushError } from './errors.js';
import { validateApiKey } from './utils.js';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';

export type AIProviderType = 'openai' | 'bedrock';
type BedrockModel = 'anthropic.claude-3-5-sonnet-20240620-v1:0' | 'anthropic.claude-3-haiku-20240307-v1:0';

interface AIProvider {
  generateCommitMessage(diff: string): Promise<string>;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateCommitMessage(diff: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: getConfig().OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a commit message generator. Respond ONLY with a concise, conventional commit message. No explanations or additional text.'
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
        throw new GPushError(`OpenAI API Error: ${error.message}`, 4);
      }
      throw new GPushError('Unknown OpenAI API Error', 4);
    }
  }
}

class BedrockProvider implements AIProvider {
  private client: BedrockRuntimeClient;

  constructor(region: string) {
    this.client = new BedrockRuntimeClient({
      region: region || 'eu-central-1'
    });
  }

  async generateCommitMessage(diff: string): Promise<string> {
    try {
      const prompt = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: "Write ONLY a concise, conventional commit message for this diff. No explanations or additional text.\n\nDiff:\n" + diff
        }]
      };

      const command = new InvokeModelCommand({
        modelId: getConfig().BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        body: JSON.stringify(prompt),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (!responseBody.content) {
        throw new GPushError('Failed to generate commit message with Bedrock', 3);
      }

      return responseBody.content[0].text.trim();
    } catch (error: unknown) {
      if (error instanceof Error) {
        let message = error.message;
        if (error.message.includes('credentials') || 
            error.message.includes('AWS') || 
            error.message.toLowerCase().includes('access denied') ||
            error.message.toLowerCase().includes('unauthorized')) {
          message = 'AWS credentials not found or invalid. Configure them using AWS CLI (aws configure) or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.';
        }
        throw new GPushError(`Bedrock API Error: ${message}`, 4);
      }
      throw new GPushError('Unknown Bedrock API Error', 4);
    }
  }
}

export function createAIProvider(config = getConfig()): AIProvider {
  switch (config.AI_PROVIDER) {
    case 'openai': 
      return new OpenAIProvider(config.OPENAI_API_KEY);
    case 'bedrock': 
      return new BedrockProvider(config.AWS_REGION || 'eu-central-1');
    default: 
      throw new GPushError('Invalid AI provider', 1);
  }
}

export async function generateCommitMessage(diff: string): Promise<string> {
  const provider = createAIProvider();
  return provider.generateCommitMessage(diff);
}

export function configureAICommands(program: Command) {
  program
    .command('ai:provider')
    .description('Set AI provider (openai or bedrock)')
    .argument('<provider>', 'Provider name (openai, bedrock)')
    .action((provider: string) => {
      if (provider !== 'openai' && provider !== 'bedrock') {
        throw new GPushError('Invalid provider. Use "openai" or "bedrock"', 1);
      }
      getConfig().set('AI_PROVIDER', provider);
      console.log(`AI provider set to: ${provider}`);
    });

  program
    .command('ai:model')
    .description('Set default AI model')
    .argument('<model>', 'Model name (e.g., gpt-4o, anthropic.claude-3-5-sonnet-20240620-v1:0)')
    .action((model: string) => {
      const provider = getConfig().get('AI_PROVIDER') || 'openai';
      if (provider === 'openai') {
        getConfig().set('OPENAI_MODEL', model);
      } else {
        getConfig().set('BEDROCK_MODEL', model);
      }
      console.log(`Default AI model set to: ${model}`);
    });

  program
    .command('ai:aws-region')
    .description('Set AWS region for Bedrock')
    .argument('<region>', 'AWS region (e.g., us-east-1)')
    .action((region: string) => {
      getConfig().set('AWS_REGION', region);
      console.log(`AWS region set to: ${region}`);
    });
} 