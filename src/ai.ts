import OpenAI from 'openai';
import { Command } from 'commander';
import { getConfig } from './config.js';
import { GPushError } from './errors.js';
import { validateApiKey } from './utils.js';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';

type AIProvider = 'openai' | 'bedrock';
type BedrockModel = 'anthropic.claude-3-5-sonnet-20240620-v1:0' | 'anthropic.claude-3-haiku-20240307-v1:0';

let openaiInstance: OpenAI | null = null;
let bedrockInstance: BedrockRuntimeClient | null = null;

export function initializeAI(provider: AIProvider = 'openai') {
  const config = getConfig();
  
  if (provider === 'openai') {
    validateApiKey(config.OPENAI_API_KEY);
    openaiInstance = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  } else if (provider === 'bedrock') {
    bedrockInstance = new BedrockRuntimeClient({
      region: config.AWS_REGION || 'eu-central-1'
    });
  }
}

async function generateWithBedrock(diff: string, model: BedrockModel): Promise<string> {
  if (!bedrockInstance) initializeAI('bedrock');

  try {
    const prompt = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: "Generate a concise, conventional commit message for this diff. Focus on technical accuracy and clarity.\n\nDiff:\n" + diff
      }]
    };

    const command = new InvokeModelCommand({
      modelId: model,
      body: JSON.stringify(prompt),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await bedrockInstance!.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.content) {
      throw new GPushError('Failed to generate commit message with Bedrock', 3);
    }

    return responseBody.content[0].text.trim();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new GPushError(`Bedrock API Error: ${error.message}`, 4);
    }
    throw new GPushError('Unknown Bedrock API Error', 4);
  }
}

export async function generateCommitMessage(diff: string): Promise<string> {
  const config = getConfig();
  const provider = config.AI_PROVIDER || 'openai';

  if (provider === 'bedrock') {
    const model = config.BEDROCK_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0';
    return generateWithBedrock(diff, model as BedrockModel);
  }

  // OpenAI implementation
  if (!openaiInstance) initializeAI('openai');

  try {
    const completion = await openaiInstance!.chat.completions.create({
      model: config.OPENAI_MODEL || 'gpt-4o',
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
      throw new GPushError(`OpenAI API Error: ${error.message}`, 4);
    }
    throw new GPushError('Unknown OpenAI API Error', 4);
  }
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
    .argument('<model>', 'Model name (e.g., gpt-4, anthropic.claude-v2)')
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