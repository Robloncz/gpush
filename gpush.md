I'll provide the complete implementation across multiple files. Here's the full codebase:

1. package.json

json
Copy
{
  "name": "gpush-ai",
  "version": "1.0.0",
  "description": "AI-powered git commit message generator and push tool",
  "main": "dist/index.js",
  "bin": {
    "gpush": "./bin/gpush"
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "keywords": [
    "git",
    "commit",
    "ai",
    "openai",
    "cli"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "conf": "^12.0.0",
    "inquirer": "^9.2.12",
    "openai": "^4.0.0",
    "simple-git": "^3.22.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.0.0"
  }
}
2. tsconfig.json

json
Copy
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
3. bin/gpush

bash
Copy
#!/usr/bin/env node

require('../dist/index.js');
4. src/index.ts

typescript
Copy
import { program } from './cli';
import { configureErrorHandling } from './errors';

configureErrorHandling();
program.parseAsync(process.argv).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
5. src/cli.ts

typescript
Copy
import { Command } from 'commander';
import { configureConfigCommands } from './config';
import { handlePushCommand } from './git';
import { configureAICommands } from './ai';
import chalk from 'chalk';

export const program = new Command();

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
  .action(handlePushCommand);
6. src/git.ts

typescript
Copy
import simpleGit, { SimpleGit } from 'simple-git';
import { generateCommitMessage } from './ai';
import { getConfig } from './config';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { truncateDiff } from './utils';

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
    
    const pushOptions = [
      options.force && '--force',
      options.branch && `origin ${options.branch}`
    ].filter(Boolean);

    await git.push(pushOptions);
    console.log(chalk.green('Successfully pushed changes!'));
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
7. src/ai.ts

typescript
Copy
import OpenAI from 'openai';
import { getConfig } from './config';
import { GPushError } from './errors';
import { validateApiKey } from './utils';

let openaiInstance: OpenAI | null = null;

export function initializeOpenAI() {
  const config = getConfig();
  validateApiKey(config.OPENAI_API_KEY);
  
  openaiInstance = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
  });
}

export async function generateCommitMessage(diff: string): Promise<string> {
  if (!openaiInstance) initializeOpenAI();

  try {
    const completion = await openaiInstance!.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Generate a concise, conventional commit message for this diff. Focus on technical accuracy and clarity.'
        },
        {
          role: 'user',
          content: diff
        }
      ],
      max_tokens: 200
    });

    const message = completion.choices[0].message.content;
    if (!message) throw new GPushError('Failed to generate commit message', 3);
    
    return message.trim();
  } catch (error) {
    throw new GPushError(`AI API Error: ${error.message}`, 4);
  }
}

export function configureAICommands(program: Command) {
  program
    .command('ai:model')
    .description('Set default AI model')
    .argument('<model>', 'Model name (e.g., gpt-4, gpt-4-turbo)')
    .action((model) => {
      getConfig().set('OPENAI_MODEL', model);
      console.log(`Default AI model set to: ${model}`);
    });
}
8. src/config.ts

typescript
Copy
import Conf from 'conf';
import { GPushError } from './errors';
import { validateApiKey } from './utils';

interface ConfigSchema {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
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
    set: config.set.bind(config)
  };
}

export function configureConfigCommands(program: Command) {
  program
    .command('config')
    .description('Manage configuration')
    .option('--set-key <key>', 'Set OpenAI API key')
    .option('--show-key', 'Show current API key status', false)
    .action((options) => {
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
9. src/errors.ts

typescript
Copy
import chalk from 'chalk';

export class GPushError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = this.constructor.name;
  }
}

export function configureErrorHandling() {
  process.on('uncaughtException', (error) => {
    if (error instanceof GPushError) {
      console.error(chalk.red(`Error (${error.exitCode}):`), error.message);
      process.exit(error.exitCode);
    }
    console.error(chalk.red('Unhandled Error:'), error);
    process.exit(1);
  });
}
10. src/utils.ts

typescript
Copy
import { GPushError } from './errors';

const MAX_DIFF_LENGTH = parseInt(process.env.MAX_DIFF_LENGTH || '4000', 10);

export function truncateDiff(diff: string): string {
  if (!diff) throw new GPushError('No git diff available', 5);
  return diff.length > MAX_DIFF_LENGTH 
    ? diff.substring(0, MAX_DIFF_LENGTH) + '\n... (truncated due to length)'
    : diff;
}

export function validateApiKey(key: string): void {
  if (!/^sk-[A-Za-z0-9]{48}$/.test(key)) {
    throw new GPushError('Invalid API key format', 3);
  }
}
11. test/index.test.ts

typescript
Copy
import { describe, expect, test, beforeEach } from '@jest/globals';
import { truncateDiff } from '../src/utils';

describe('GPush Utilities', () => {
  describe('truncateDiff', () => {
    test('should truncate long diffs', () => {
      const longDiff = 'a'.repeat(5000);
      const result = truncateDiff(longDiff);
      expect(result.length).toBe(4000 + 23); // 23 for truncation message
    });

    test('should leave short diffs unchanged', () => {
      const shortDiff = 'test diff';
      const result = truncateDiff(shortDiff);
      expect(result).toBe(shortDiff);
    });
  });
});
12. jest.config.js

javascript
Copy
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
13. .github/workflows/ci.yml

yaml
Copy
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test