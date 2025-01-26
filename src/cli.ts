import { Command } from 'commander';
import { configureConfigCommands } from './config.js';
import { handlePushCommand } from './git.js';
import { configureAICommands } from './ai.js';
import { getConfig } from './config.js';
import { GPushError } from './errors.js';
import { 
  showWelcomeBanner, 
  showMenu, 
  configureSettings, 
  getApiKey, 
  showSuccess, 
  showError,
  showStatus,
  selectAIProvider,
  selectOpenAIModel,
  selectBedrockModel,
  selectAWSRegion
} from './ui.js';

export const program = new Command();

async function checkApiKey(): Promise<void> {
  const config = getConfig();
  try {
    config.OPENAI_API_KEY; // This will throw if key is not configured
  } catch (error) {
    const apiKey = await getApiKey();
    if (!apiKey) throw new GPushError('API key is required', 1);
    config.set('OPENAI_API_KEY', apiKey);
    showSuccess('API key successfully stored');
  }
}

async function handleInteractiveMode() {
  await showWelcomeBanner();

  while (true) {
    const action = await showMenu();
    
    try {
      switch (action) {
        case 'push':
          await checkApiKey();
          await handlePushCommand({});
          break;
          
        case 'config':
          while (true) {
            const setting = await configureSettings();
            if (setting === 'back') break;
            
            const config = getConfig();
            switch (setting) {
              case 'api_key':
                const apiKey = await getApiKey();
                if (apiKey) {
                  config.set('OPENAI_API_KEY', apiKey);
                  showSuccess('API key updated successfully');
                }
                break;
                
              case 'ai_provider':
                const provider = await selectAIProvider();
                if (provider && provider !== 'back') {
                  config.set('AI_PROVIDER', provider);
                  showSuccess(`AI provider set to ${String(provider)}`);
                  
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
                    showSuccess(`AI model set to ${String(model)}`);
                  }
                  
                  // If Bedrock is selected, prompt for region
                  if (provider === 'bedrock') {
                    const region = await selectAWSRegion();
                    if (region && region !== 'back') {
                      config.set('AWS_REGION', region);
                      showSuccess(`AWS region set to ${String(region)}`);
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
                  showSuccess(`AI model set to ${String(newModel)}`);
                }
                break;
                
              case 'aws_region':
                const region = await selectAWSRegion();
                if (region && region !== 'back') {
                  config.set('AWS_REGION', region);
                  showSuccess(`AWS region set to ${String(region)}`);
                }
                break;
            }
          }
          break;
          
        case 'status':
          showStatus(getConfig());
          break;
          
        case 'exit':
          return;
      }
    } catch (error) {
      if (error instanceof GPushError) {
        showError(`Error (${error.exitCode}): ${error.message}`);
      } else if (error instanceof Error) {
        showError(`Unexpected error: ${error.message}`);
      }
    }
  }
}

// Configure traditional CLI commands
program
  .name('gpush')
  .description('AI-powered git commit message generator and push tool')
  .version('1.0.0', '-v, --version', 'Show version information')
  .helpOption('-h, --help', 'Show help information')
  .option('-c, --cli', 'Run in traditional CLI mode (non-interactive)');

configureConfigCommands(program);
configureAICommands(program);

program
  .command('push')
  .description('Generate commit message and push changes')
  .option('-d, --dry-run', 'Show generated message without committing')
  .option('-f, --force', 'Force push changes')
  .option('-b, --branch <branch>', 'Specify target branch')
  .action(async (options) => {
    await checkApiKey();
    await handlePushCommand(options);
  });

// Add hook to check API key before any command except config
program.hook('preAction', async (thisCommand) => {
  if (thisCommand.name() !== 'config') {
    await checkApiKey();
  }
});

// Run in interactive mode by default, unless CLI mode is explicitly requested
if (process.argv.length <= 2 || !process.argv.includes('--cli')) {
  handleInteractiveMode().catch((error) => {
    showError('Unhandled error: ' + error.message);
    process.exit(1);
  });
} else {
  // Remove the --cli flag before parsing to avoid unknown option error
  const args = process.argv.filter(arg => arg !== '--cli');
  program.parseAsync(args).catch((error) => {
    showError('Unhandled error: ' + error.message);
    process.exit(1);
  });
}