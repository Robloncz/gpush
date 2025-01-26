import { program } from './cli.js';
import { configureErrorHandling } from './errors.js';

configureErrorHandling();
program.parseAsync(process.argv).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});