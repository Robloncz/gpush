import { simpleGit, SimpleGit } from 'simple-git';
import { generateCommitMessage } from './ai.js';
import { getConfig } from './config.js';
import { truncateDiff } from './utils.js';
import { showSpinner, confirmAction, showSuccess, showError } from './ui.js';

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
  const config = getConfig();
  
  try {
    const diff = await getStagedDiff();
    if (!diff) throw new Error('No changes detected');

    const spinner = showSpinner('Generating commit message...');
    const aiResponse = await generateCommitMessage(diff);
    const commitMessage = extractCommitMessage(aiResponse);
    spinner.succeed('Generated commit message');

    showSuccess(`Generated commit message:\n${commitMessage}`);

    if (options.dryRun) return;

    const proceed = await confirmAction('Proceed with commit and push?');
    if (!proceed) {
      showError('Operation cancelled');
      return;
    }

    const commitSpinner = showSpinner('Committing changes...');
    await git.add('.');
    await git.commit(commitMessage);
    commitSpinner.succeed('Changes committed');
    
    const pushSpinner = showSpinner('Pushing changes...');
    const pushArgs: string[] = [];
    if (options.force) pushArgs.push('--force');
    if (options.branch) pushArgs.push('origin', options.branch);

    await git.push(pushArgs);
    pushSpinner.succeed('Changes pushed successfully');
    
    showSuccess('All changes have been committed and pushed! 🎉');
  } catch (error: unknown) {
    if (error instanceof Error) {
      showError(error.message);
    } else {
      showError('An unknown error occurred');
    }
    process.exit(1);
  }
} 