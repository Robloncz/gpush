import Conf from 'conf';
import { Command } from 'commander';
import { GPushError } from './errors.js';
import { validateApiKey } from './utils.js';
import { AIProviderType } from './ai.js';
import { 
  configureSettings, 
  getApiKey, 
  selectAIProvider,
  selectOpenAIModel,
  selectBedrockModel,
  selectAWSRegion
} from './ui.js';

interface ConfigSchema {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  AI_PROVIDER?: AIProviderType;
  AWS_REGION?: string;
  BEDROCK_MODEL?: string;
}

export class ConfigManager {
  private store: Conf<ConfigSchema>;

  constructor() {
    this.store = new Conf<ConfigSchema>({
      projectName: 'gpush-ai',
      encryptionKey: process.env.GPUSH_ENCRYPTION_KEY,
    });
  }

  // AI Provider
  get AI_PROVIDER(): AIProviderType {
    return this.store.get('AI_PROVIDER') || 'openai';
  }

  setAiProvider(provider: AIProviderType) {
    if (!['openai', 'bedrock'].includes(provider)) {
      throw new GPushError('Invalid AI provider', 1);
    }
    this.store.set('AI_PROVIDER', provider);
  }

  // OpenAI
  get OPENAI_API_KEY(): string {
    const key = this.store.get('OPENAI_API_KEY');
    if (!key) throw new GPushError('No API key configured. Use `gpush config --set-key`', 2);
    return key;
  }

  setOpenAIKey(key: string) {
    validateApiKey(key);
    this.store.set('OPENAI_API_KEY', key);
  }

  get OPENAI_MODEL(): string {
    return this.store.get('OPENAI_MODEL') || 'gpt-4o';
  }

  setOpenAIModel(model: string) {
    this.store.set('OPENAI_MODEL', model);
  }

  // AWS Bedrock
  get AWS_REGION(): string {
    return this.store.get('AWS_REGION') || 'eu-central-1';
  }

  setAWSRegion(region: string) {
    this.store.set('AWS_REGION', region);
  }

  get BEDROCK_MODEL(): string {
    return this.store.get('BEDROCK_MODEL') || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
  }

  setBedrockModel(model: string) {
    this.store.set('BEDROCK_MODEL', model);
  }

  // Direct store access for flexibility
  get(key: keyof ConfigSchema) {
    return this.store.get(key);
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]) {
    this.store.set(key, value);
  }
}

// Singleton instance
const configManager = new ConfigManager();
export const getConfig = () => configManager;

export function configureConfigCommands(program: Command) {
  program
    .command('config')
    .description('Manage configuration')
    .option('--set-key <key>', 'Set OpenAI API key')
    .option('--show-key', 'Show current API key status', false)
    .option('-i, --interactive', 'Interactive configuration mode')
    .action(async (options: { setKey?: string; showKey?: boolean; interactive?: boolean }) => {
      if (options.interactive) {
        // Interactive mode
        const setting = await configureSettings();
        if (setting === 'back') return;
        
        const config = configManager;
        switch (setting) {
          case 'api_key':
            const apiKey = await getApiKey();
            if (apiKey) {
              config.set('OPENAI_API_KEY', apiKey);
              console.log('API key updated successfully');
            }
            break;
            
          case 'ai_provider':
            const provider = await selectAIProvider();
            if (provider && provider !== 'back') {
              config.set('AI_PROVIDER', provider);
              console.log(`AI provider set to ${String(provider)}`);
              
              // Prompt for model based on provider
              const model = provider === 'openai' 
                ? await selectOpenAIModel()
                : await selectBedrockModel();
                
              if (model && model !== 'back') {
                if (provider === 'openai') {
                  config.set('OPENAI_MODEL', model);
                } else {
                  config.set('BEDROCK_MODEL', model);
                }
                console.log(`AI model set to ${String(model)}`);
              }
              
              // If Bedrock is selected, prompt for region
              if (provider === 'bedrock') {
                const region = await selectAWSRegion();
                if (region && region !== 'back') {
                  config.set('AWS_REGION', region);
                  console.log(`AWS region set to ${String(region)}`);
                }
              }
            }
            break;
            
          case 'ai_model':
            const currentProvider = config.get('AI_PROVIDER') || 'openai';
            const newModel = currentProvider === 'openai'
              ? await selectOpenAIModel()
              : await selectBedrockModel();
              
            if (newModel && newModel !== 'back') {
              if (currentProvider === 'openai') {
                config.set('OPENAI_MODEL', newModel);
              } else {
                config.set('BEDROCK_MODEL', newModel);
              }
              console.log(`AI model set to ${String(newModel)}`);
            }
            break;
            
          case 'aws_region':
            const region = await selectAWSRegion();
            if (region && region !== 'back') {
              config.set('AWS_REGION', region);
              console.log(`AWS region set to ${String(region)}`);
            }
            break;
        }
      } else if (options.setKey) {
        configManager.setOpenAIKey(options.setKey);
        console.log('API key successfully stored');
      } else if (options.showKey) {
        const key = configManager.get('OPENAI_API_KEY');
        console.log(`API key: ${key ? '*****' + key.slice(-4) : 'Not configured'}`);
      } else {
        // Show all configuration when no options provided
        const config = configManager;
        console.log('Current Configuration:');
        console.log('---------------------');
        console.log(`AI Provider: ${config.AI_PROVIDER}`);
        if (config.AI_PROVIDER === 'openai') {
          const key = config.get('OPENAI_API_KEY');
          console.log(`OpenAI API Key: ${key ? '*****' + key.slice(-4) : 'Not configured'}`);
          console.log(`OpenAI Model: ${config.OPENAI_MODEL}`);
        } else {
          console.log(`AWS Region: ${config.AWS_REGION}`);
          console.log(`Bedrock Model: ${config.BEDROCK_MODEL}`);
        }
        console.log('\nTip: Use --interactive or -i for interactive configuration mode');
      }
    });
} 