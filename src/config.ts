import Conf from 'conf';
import { Command } from 'commander';
import { GPushError } from './errors.js';
import { validateApiKey } from './utils.js';

interface ConfigSchema {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  AI_PROVIDER?: 'openai' | 'bedrock';
  AWS_REGION?: string;
  BEDROCK_MODEL?: string;
}

interface ConfigOptions {
  setKey?: string;
  showKey?: boolean;
}

const config = new Conf<ConfigSchema>({
  projectName: 'gpush-ai',
  encryptionKey: process.env.GPUSH_ENCRYPTION_KEY,
});

export function getConfig() {
  return {
    get OPENAI_API_KEY() {
      const key = config.get('OPENAI_API_KEY');
      if (!key) throw new GPushError('No API key configured. Use `gpush config --set-key`', 2);
      return key;
    },
    get OPENAI_MODEL() {
      return config.get('OPENAI_MODEL') || 'gpt-4';
    },
    get AI_PROVIDER() {
      return config.get('AI_PROVIDER') || 'openai';
    },
    get AWS_REGION() {
      return config.get('AWS_REGION') || 'eu-central-1';
    },
    get BEDROCK_MODEL() {
      return config.get('BEDROCK_MODEL') || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
    },
    get: config.get.bind(config),
    set: config.set.bind(config)
  };
}

export function configureConfigCommands(program: Command) {
  program
    .command('status')
    .description('Show current configuration status')
    .action(() => {
      const conf = getConfig();
      console.log('\nCurrent Configuration:');
      console.log('--------------------');
      console.log(`AI Provider: ${conf.AI_PROVIDER}`);
      
      if (conf.AI_PROVIDER === 'openai') {
        const key = config.get('OPENAI_API_KEY');
        console.log(`OpenAI API Key: ${key ? '*****' + key.slice(-4) : 'Not configured'}`);
        console.log(`OpenAI Model: ${conf.OPENAI_MODEL}`);
      } else {
        console.log(`AWS Region: ${conf.AWS_REGION}`);
        console.log(`Bedrock Model: ${conf.BEDROCK_MODEL}`);
      }
      console.log('--------------------\n');
    });

  program
    .command('config')
    .description('Manage configuration')
    .option('--set-key <key>', 'Set OpenAI API key')
    .option('--show-key', 'Show current API key status', false)
    .action((options: ConfigOptions) => {
      if (options.setKey) {
        validateApiKey(options.setKey);
        config.set('OPENAI_API_KEY', options.setKey);
        console.log('API key successfully stored');
      }
      if (options.showKey) {
        const key = config.get('OPENAI_API_KEY');
        console.log(`API key: ${key ? '*****' + key.slice(-4) : 'Not configured'}`);
      }
    });
} 