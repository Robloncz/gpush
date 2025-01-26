import { simpleGit } from 'simple-git';
import { generateCommitMessage } from './ai.js';
import { getConfig } from './config.js';
import { truncateDiff } from './utils.js';
import { showSpinner, showSuccess, showError, confirmAction } from './ui.js';

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  const spinner = showSpinner('Getting staged changes...');
  try {
    const diff = await git.diff(['--cached', '--diff-algorithm=minimal']);
    spinner.succeed('Retrieved staged changes');
    return truncateDiff(diff);
  } catch (error) {
    spinner.fail('Failed to get staged changes');
    throw error;
  }
}

function extractCommitMessage(aiResponse: string): string {
  // Look for content between triple backticks
  const match = aiResponse.match(/```(?:\w*\n)?(.*?)```/s);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback: if no backticks, just take the first non-empty paragraph
  const firstParagraph = aiResponse.split('\n\n')[0].trim();
  return firstParagraph;
}

export async function handlePushCommand(options: {
  dryRun?: boolean;
  force?: boolean;
  branch?: string;
}) {
  const spinner = showSpinner('Processing changes...');
  
  try {
    // Get staged changes
    const diff = await git.diff(['--cached', '--diff-algorithm=minimal']);
    if (!diff) {
      spinner.fail('No staged changes found');
      throw new Error('No changes detected. Stage your changes first with `git add`');
    }

    // Generate commit message
    const aiResponse = await generateCommitMessage(truncateDiff(diff));
    const commitMessage = extractCommitMessage(aiResponse);
    
    if (options.dryRun) {
      spinner.succeed('Generated commit message');
      showSuccess(`Generated commit message:\n${commitMessage}`);
      return;
    }

    // Show commit message and ask for confirmation
    spinner.succeed('Generated commit message');
    showSuccess(`Generated commit message:\n${commitMessage}`);
    
    const proceed = await confirmAction('Proceed with commit and push?');
    if (!proceed) {
      showError('Operation cancelled');
      process.exit(1);
    }

    // Start a new spinner for commit/push
    const pushSpinner = showSpinner('Committing and pushing changes...');
    
    // Commit and push in one operation
    await git.commit(commitMessage);
    
    const pushArgs: string[] = [];
    if (options.force) pushArgs.push('--force');
    if (options.branch) pushArgs.push('origin', options.branch);
    await git.push(pushArgs);
    
    pushSpinner.succeed('Changes committed and pushed successfully');
    showSuccess(`Committed and pushed with message:\n${commitMessage}`);
    process.exit(0); // Exit cleanly after successful push
  } catch (error: unknown) {
    spinner.fail('Operation failed');
    if (error instanceof Error) {
      showError(error.message);
    } else {
      showError('An unknown error occurred');
    }
    process.exit(1);
  }
} 