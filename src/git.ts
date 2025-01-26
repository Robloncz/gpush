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

export async function getStagedChanges(): Promise<string> {
  const git: SimpleGit = simpleGit();
  const spinner = showSpinner('Getting staged changes...');

  try {
    const status = await git.status();
    const staged = status.staged;
    
    if (staged.length === 0) {
      spinner.stop('No staged changes found');
      throw new Error('No staged changes found. Use git add to stage your changes.');
    }

    const diff = await git.diff(['--cached']);
    spinner.stop('Retrieved staged changes');
    return diff;
  } catch (error) {
    spinner.stop('Failed to get staged changes');
    throw error;
  }
}

export async function commitAndPush(commitMessage: string): Promise<void> {
  const git: SimpleGit = simpleGit();
  const spinner = showSpinner('Committing and pushing changes...');

  try {
    await git.commit(commitMessage);
    await git.push();
    spinner.stop('Changes committed and pushed successfully');
    showSuccess('Changes committed and pushed successfully');
  } catch (error) {
    spinner.stop('Failed to commit and push changes');
    showError('Failed to commit and push changes');
    throw error;
  }
}

export async function handleGitPush(): Promise<void> {
  try {
    // Get staged changes
    const stagedChanges = await getStagedChanges();
    
    // Generate commit message
    const spinner = showSpinner('Generating commit message...');
    let commitMessage: string;
    
    try {
      commitMessage = await generateCommitMessage(stagedChanges);
      spinner.stop('Generated commit message');
      showSuccess(`Generated commit message:\n${commitMessage}`);
    } catch (error) {
      spinner.stop('Failed to generate commit message');
      throw error;
    }

    // Confirm commit message
    const confirmed = await confirmAction(`Use this commit message?\n\n${commitMessage}`);
    
    if (!confirmed) {
      showError('Operation cancelled');
      return;
    }

    // Commit and push
    await commitAndPush(commitMessage);

  } catch (error) {
    if (error instanceof Error) {
      showError(error.message);
    } else {
      showError('An unknown error occurred');
    }
    throw error;
  }
}

export async function handlePushCommand(options: PushOptions = {}) {
  try {
    // Check for staged changes
    const diff = await getStagedChanges();
    if (!diff) {
      throw new GPushError('No staged changes found. Stage your changes first with `git add`', 1);
    }

    // Generate commit message
    const spinner = showSpinner('Generating commit message...');
    try {
      const commitMessage = await generateCommitMessage(diff);
      spinner.stop('Generated commit message');
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

      await commitAndPush(commitMessage);
      process.exit(0);
    } catch (error) {
      spinner.stop('Failed to generate commit message');
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