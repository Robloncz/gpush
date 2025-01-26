import { showError } from './ui.js';

export class GPushError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = this.constructor.name;
  }
}

export function configureErrorHandling() {
  process.on('uncaughtException', (error) => {
    if (error instanceof GPushError) {
      showError(`Error (${error.exitCode}): ${error.message}`);
      process.exit(error.exitCode);
    }
    showError('Unhandled Error: ' + error.message);
    process.exit(1);
  });
} 