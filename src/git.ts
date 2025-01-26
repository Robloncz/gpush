import { simpleGit, SimpleGit } from 'simple-git';
import { generateCommitMessage } from './ai.js';
import { getConfig } from './config.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { truncateDiff } from './utils.js';

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  const diff = await git.diff(['--cached', '--diff-algorithm=minimal']);
  return truncateDiff(diff);
}

export async function handlePushCommand(options: {
  dryRun?: boolean;
  force?: boolean;
  branch?: string;
}) {
  const config = getConfig();
  
  try {
    const diff = await getStagedDiff();
    if (!diff) throw new Error('No changes detected');

    const commitMessage = await generateCommitMessage(diff);
    console.log(chalk.green('\nGenerated commit message:'));
    console.log(chalk.yellow(commitMessage));

    if (options.dryRun) return;

    const { proceed } = await inquirer.prompt({
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with commit and push?',
      default: true
    });

    if (!proceed) {
      console.log(chalk.red('Operation cancelled'));
      return;
    }

    await git.add('.');
    await git.commit(commitMessage);
    
    const pushArgs: string[] = [];
    if (options.force) pushArgs.push('--force');
    if (options.branch) pushArgs.push('origin', options.branch);

    await git.push(pushArgs);
    console.log(chalk.green('Successfully pushed changes!'));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
    } else {
      console.error(chalk.red('Error:'), 'An unknown error occurred');
    }
    process.exit(1);
  }
} 