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
  const provider = config.get('AI_PROVIDER') || 'openai';

  if (provider === 'openai') {
    try {
      config.OPENAI_API_KEY; // This will throw if key is not configured
    } catch (error) {
      const apiKey = await getApiKey();
      if (!apiKey) throw new GPushError('OpenAI API key is required', 1);
      config.set('OPENAI_API_KEY', apiKey);
      showSuccess('OpenAI API key successfully stored');
    }
  }
  // For Bedrock, AWS credentials are handled by the SDK
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
          return; // Exit after push completes
          
        case 'config':
          // Reuse existing config command with interactive mode
          await program.parseAsync(['node', 'gpush', 'config', '--interactive']);
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
  .helpOption('-h, --help', 'Show help information');

configureConfigCommands(program);
configureAICommands(program);

program
  .command('push')
  .description('Generate commit message and push changes')
  .option('-d, --dry-run', 'Show generated message without committing')
  .option('-f, --force', 'Force push changes')
  .option('-b, --branch <branch>', 'Specify target branch')
  .action(async (options) => {
    await handlePushCommand(options);
  });

program
  .command('status')
  .description('Show current configuration')
  .action(() => {
    showStatus(getConfig());
  });

// Add hook to check API key before any command except config and status
program.hook('preAction', async (thisCommand) => {
  const noKeyCommands = ['config', 'status'];
  if (!noKeyCommands.includes(thisCommand.name())) {
    await checkApiKey();
  }
});

// Run in interactive mode only if no command is provided
if (process.argv.length === 2) {
  handleInteractiveMode().catch((error) => {
    showError('Unhandled error: ' + error.message);
    process.exit(1);
  });
}