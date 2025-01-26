import { intro, outro, text, confirm, select, spinner, note } from '@clack/prompts';
import gradient from 'gradient-string';
import boxen from 'boxen';
import ora from 'ora';
import Table from 'cli-table3';
import figlet from 'figlet-promised';

export async function showWelcomeBanner() {
  const text = await figlet('GPush AI');
  console.log(gradient.pastel.multiline(text));
}

export async function showMenu() {
  const action = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'push', label: 'Push changes' },
      { value: 'config', label: 'Configure settings' },
      { value: 'status', label: 'Show status' },
      { value: 'exit', label: 'Exit' }
    ]
  });
  return action;
}

export async function configureSettings() {
  const setting = await select({
    message: 'Which setting would you like to configure?',
    options: [
      { value: 'api_key', label: 'OpenAI API Key' },
      { value: 'ai_provider', label: 'AI Provider' },
      { value: 'ai_model', label: 'AI Model' },
      { value: 'aws_region', label: 'AWS Region' },
      { value: 'back', label: '↩ Back to main menu' }
    ]
  });
  return setting;
}

export async function selectAIProvider() {
  const provider = await select({
    message: 'Select AI Provider:',
    options: [
      { value: 'openai', label: 'OpenAI (GPT-4o)' },
      { value: 'bedrock', label: 'AWS Bedrock (Claude)' },
      { value: 'back', label: '↩ Back' }
    ]
  });
  return provider;
}

export async function selectOpenAIModel() {
  const model = await select({
    message: 'Select OpenAI Model:',
    options: [
      { value: 'gpt-4o', label: 'GPT-4o (Most capable)' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster, cheaper)' },
      { value: 'back', label: '↩ Back' }
    ]
  });
  return model;
}

export async function selectBedrockModel() {
  const model = await select({
    message: 'Select Bedrock Model:',
    options: [
      { 
        value: 'anthropic.claude-3-5-sonnet-20240620-v1:0', 
        label: 'Claude 3.5 Sonnet (Recommended)'
      },
      { 
        value: 'anthropic.claude-3-haiku-20240307-v1:0',
        label: 'Claude 3 Haiku (Faster)'
      },
      { value: 'back', label: '↩ Back' }
    ]
  });
  return model;
}

export async function selectAWSRegion() {
  const region = await select({
    message: 'Select AWS Region:',
    options: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-central-1', label: 'EU (Frankfurt)' },
      { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
      { value: 'back', label: '↩ Back' }
    ]
  });
  return region;
}

export async function getApiKey() {
  return await text({
    message: 'Enter your OpenAI API Key:',
    placeholder: 'sk-...',
    validate: (value) => {
      if (!value) return 'API key is required';
      if (!value.startsWith('sk-')) return 'API key must start with sk-';
      if (value.length < 20) return 'API key is too short';
      return;
    }
  });
}

export async function confirmAction(message: string) {
  return await confirm({
    message
  });
}

export function showSpinner(message: string) {
  return ora(message).start();
}

export function showSuccess(message: string) {
  console.log(boxen(gradient.pastel(message), {
    padding: 1,
    margin: 1,
    borderStyle: 'round'
  }));
}

export function showError(message: string) {
  console.log(boxen(gradient.passion(message), {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'red'
  }));
}

export function showStatus(config: Record<string, any>) {
  const table = new Table({
    head: [gradient.pastel('Setting'), gradient.pastel('Value')],
    style: {
      head: [],
      border: []
    }
  });

  const provider = config.AI_PROVIDER || 'openai';
  
  // Always show the current provider
  table.push(['AI Provider', provider]);

  if (provider === 'openai') {
    // Show OpenAI specific settings
    const apiKey = config.OPENAI_API_KEY;
    const model = config.OPENAI_MODEL || 'gpt-4o';
    table.push(
      ['OpenAI API Key', apiKey ? '*****' + apiKey.slice(-4) : 'Not configured'],
      ['Model', model]
    );
  } else {
    // Show Bedrock specific settings
    const model = config.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
    const region = config.AWS_REGION || 'eu-central-1';
    table.push(
      ['Model', model],
      ['AWS Region', region]
    );
  }

  console.log('\n' + boxen(table.toString(), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  }) + '\n');
} 