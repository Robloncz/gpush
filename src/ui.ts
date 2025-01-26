import { intro, outro, text, confirm, select, spinner, Option } from '@clack/prompts';
import chalk from 'chalk';
import { AIProviderType } from './ai.js';

export async function showWelcomeBanner() {
  console.log(chalk.cyan('\n=== GPush AI ===\n'));
}

export type MenuAction = 'push' | 'config' | 'status' | 'exit';
export type SettingAction = 'api_key' | 'ai_provider' | 'ai_model' | 'aws_region' | 'back';

export async function selectFromList<T extends string>(
  message: string,
  options: Array<Option<T>>,
  backOption = true
): Promise<T> {
  const allOptions = [
    ...options,
    ...(backOption ? [{ value: 'back', label: '↩ Back' }] : [])
  ] as Option<T>[];
  
  const result = await select({
    message,
    options: allOptions
  });
  
  if (typeof result === 'symbol' || result === null) {
    throw new Error('Selection was cancelled');
  }
  
  return result as T;
}

export async function showMenu(): Promise<MenuAction> {
  return selectFromList<MenuAction>('What would you like to do?', [
    { value: 'push', label: 'Push changes' },
    { value: 'config', label: 'Configure settings' },
    { value: 'status', label: 'Show status' },
    { value: 'exit', label: 'Exit' }
  ], false);
}

export async function configureSettings(): Promise<SettingAction> {
  return selectFromList<SettingAction>('Which setting would you like to configure?', [
    { value: 'api_key', label: 'OpenAI API Key' },
    { value: 'ai_provider', label: 'AI Provider' },
    { value: 'ai_model', label: 'AI Model' },
    { value: 'aws_region', label: 'AWS Region' }
  ]);
}

export async function selectAIProvider(): Promise<AIProviderType | 'back'> {
  return selectFromList<AIProviderType | 'back'>('Select AI Provider:', [
    { value: 'openai', label: 'OpenAI (GPT-4o)' },
    { value: 'bedrock', label: 'AWS Bedrock (Claude)' }
  ]);
}

export async function selectOpenAIModel(): Promise<string | 'back'> {
  return selectFromList<string | 'back'>('Select OpenAI Model:', [
    { value: 'gpt-4o', label: 'GPT-4o (Most capable)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster, cheaper)' }
  ]);
}

export async function selectBedrockModel(): Promise<string | 'back'> {
  return selectFromList<string | 'back'>('Select Bedrock Model:', [
    { 
      value: 'anthropic.claude-3-5-sonnet-20240620-v1:0', 
      label: 'Claude 3.5 Sonnet (Recommended)'
    },
    { 
      value: 'anthropic.claude-3-haiku-20240307-v1:0',
      label: 'Claude 3 Haiku (Faster)'
    }
  ]);
}

export async function selectAWSRegion(): Promise<string | 'back'> {
  return selectFromList<string | 'back'>('Select AWS Region:', [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
  ]);
}

export async function getApiKey(): Promise<string> {
  const result = await text({
    message: 'Enter your OpenAI API Key:',
    placeholder: 'sk-...',
    validate: (value) => {
      if (!value) return 'API key is required';
      if (!value.startsWith('sk-')) return 'API key must start with sk-';
      if (value.length < 20) return 'API key is too short';
      return;
    }
  });
  
  if (typeof result === 'symbol') {
    throw new Error('API key input was cancelled');
  }
  
  return result;
}

export async function confirmAction(message: string): Promise<boolean> {
  const result = await confirm({ message });
  return typeof result === 'boolean' ? result : false;
}

export function showSpinner(message: string) {
  const s = spinner();
  s.start(message);
  return s;
}

export function showSuccess(message: string): void {
  console.log(chalk.green('\n✓ ' + message + '\n'));
}

export function showError(message: string): void {
  console.log(chalk.red('\n✗ ' + message + '\n'));
}

export function showStatus(config: Record<string, any>): void {
  console.log(chalk.cyan('\n=== Current Configuration ===\n'));
  
  const provider = config.AI_PROVIDER || 'openai';
  console.log(chalk.white('AI Provider: ') + chalk.cyan(provider));

  if (provider === 'openai') {
    const apiKey = config.OPENAI_API_KEY;
    const model = config.OPENAI_MODEL || 'gpt-4o';
    console.log(chalk.white('OpenAI API Key: ') + chalk.cyan(apiKey ? '*****' + apiKey.slice(-4) : 'Not configured'));
    console.log(chalk.white('Model: ') + chalk.cyan(model));
  } else {
    const model = config.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
    const region = config.AWS_REGION || 'eu-central-1';
    console.log(chalk.white('Model: ') + chalk.cyan(model));
    console.log(chalk.white('AWS Region: ') + chalk.cyan(region));
  }
  
  console.log();
} 