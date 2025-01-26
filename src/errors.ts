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