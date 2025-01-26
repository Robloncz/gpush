import { Command } from 'commander';
import { configureConfigCommands } from './config.js';
import { handlePushCommand } from './git.js';
import { configureAICommands } from './ai.js';
import chalk from 'chalk';
import { getConfig } from './config.js';
import inquirer from 'inquirer';
import { validateApiKey } from './utils.js';
import { GPushError } from './errors.js';

export const program = new Command();

async function checkApiKey(): Promise<void> {
  const config = getConfig();
  try {
    config.OPENAI_API_KEY; // This will throw if key is not configured
  } catch (error) {
    console.log(chalk.yellow('No API key configured. Please enter your OpenAI API key:'));
    const { apiKey } = await inquirer.prompt({
      type: 'password',
      name: 'apiKey',
      message: 'OpenAI API Key:',
      validate: (input: string) => {
        try {
          validateApiKey(input);
          return true;
        } catch (error) {
          if (error instanceof GPushError) {
            return error.message;
          }
          return 'Invalid API key format. Please check your API key and try again.';
        }
      }
    });
    config.set('OPENAI_API_KEY', apiKey);
    console.log(chalk.green('API key successfully stored'));
  }
}

program
  .name('gpush')
  .description(chalk.blueBright('AI-powered git commit message generator and push tool'))
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
    await checkApiKey();
    await handlePushCommand(options);
  });

// Add hook to check API key before any command except config
program.hook('preAction', async (thisCommand) => {
  if (thisCommand.name() !== 'config') {
    await checkApiKey();
  }
});