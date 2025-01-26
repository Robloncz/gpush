import { simpleGit, SimpleGit } from 'simple-git';
import { generateCommitMessage } from './ai.js';
import { getConfig } from './config.js';
import { truncateDiff } from './utils.js';
import { showSpinner, confirmAction, showSuccess, showError } from './ui.js';
import { GPushError } from './errors.js';

interface PushOptions {
  dryRun?: boolean;
  force?: boolean;
  branch?: string;
}

export class GitManager {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async getStagedDiff(): Promise<string> {
    const spinner = showSpinner('Getting staged changes...');
    try {
      const diff = await this.git.diff(['--cached', '--diff-algorithm=minimal']);
      spinner.succeed('Retrieved staged changes');
      return truncateDiff(diff);
    } catch (error) {
      spinner.fail('Failed to get staged changes');
      throw error;
    }
  }

  async commitAndPush(message: string, options: PushOptions = {}): Promise<void> {
    const spinner = showSpinner('Committing and pushing changes...');
    try {
      await this.git.commit(message);
      
      const pushArgs: string[] = [];
      if (options.force) pushArgs.push('--force');
      if (options.branch) pushArgs.push('origin', options.branch);
      await this.git.push(pushArgs);
      
      spinner.succeed('Changes committed and pushed successfully');
    } catch (error) {
      spinner.fail('Failed to commit and push changes');
      throw error;
    }
  }

  async hasChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.staged.length > 0;
  }
}

// Singleton instance
const gitManager = new GitManager();

export async function handlePushCommand(options: PushOptions = {}) {
  try {
    // Check for staged changes
    const diff = await gitManager.getStagedDiff();
    if (!diff) {
      throw new GPushError('No staged changes found. Stage your changes first with `git add`', 1);
    }

    // Generate commit message
    const spinner = showSpinner('Generating commit message...');
    try {
      const commitMessage = await generateCommitMessage(diff);
      spinner.succeed('Generated commit message');
      showSuccess(`Generated commit message:\n${commitMessage}`);

      if (options.dryRun) {
        return;
      }

      // Confirm and push
      const proceed = await confirmAction('Proceed with commit and push?');
      if (!proceed) {
        showError('Operation cancelled');
        process.exit(1);
      }

      await gitManager.commitAndPush(commitMessage, options);
      showSuccess(`Committed and pushed with message:\n${commitMessage}`);
      process.exit(0);
    } catch (error) {
      spinner.fail('Operation failed');
      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      showError(error.message);
    } else {
      showError('An unknown error occurred');
    }
    process.exit(1);
  }
} 