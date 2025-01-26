# gpush-ai 🚀

An AI-powered CLI tool that automatically generates meaningful commit messages and streamlines your git workflow.

## Features ✨

- 🤖 AI-powered commit message generation using OpenAI's GPT models
- 🔄 Seamless git workflow integration
- 🔐 Secure API key storage with encryption
- 🎨 Beautiful CLI interface with colored output
- ⚡ Support for force push and branch selection
- 🧪 Dry run mode to preview commit messages

## Installation 📦

You can install gpush-ai directly from npm:

```bash
npm install -g gpush-ai
```

## Setup 🔧

1. Get your OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys)
2. Configure gpush with your API key:
```bash
gpush config --set-key YOUR_API_KEY
```

## Usage 💻

### Basic Push
```bash
gpush push
```
This will:
1. Generate a commit message for your staged changes
2. Show you the message
3. Ask for confirmation
4. Commit and push your changes

### Options
- `--dry-run` (`-d`): Preview the generated commit message without committing
- `--force` (`-f`): Force push changes
- `--branch <branch>` (`-b`): Specify target branch

```bash
# Preview commit message
gpush push --dry-run

# Force push to a specific branch
gpush push --force --branch main
```

### Configuration
```bash
# Set OpenAI API key
gpush config --set-key YOUR_API_KEY

# Check API key status
gpush config --show-key

# Set default AI model
gpush ai:model gpt-4o
```

## Environment Variables 🔐

- `GPUSH_ENCRYPTION_KEY`: Custom encryption key for storing sensitive data
- `OPENAI_MODEL`: Override default AI model
- `MAX_DIFF_LENGTH`: Maximum diff length to send to OpenAI (default: 4000)

## Development 🛠️

### Local Setup

1. Download or clone the repository:
```bash
# Using git
git clone https://github.com/YOUR_USERNAME/gpush-ai.git

# Or download the ZIP from GitHub
```

2. Install dependencies and build:
```bash
cd gpush-ai
npm install
npm run build
```

3. Link the package locally:
```bash
npm link
```

### Project Structure
```
gpush-ai/
├── src/           # Source code
├── dist/          # Compiled JavaScript
├── bin/           # CLI executable
├── test/          # Test files
└── package.json   # Dependencies and scripts
```

### Development Commands
```bash
npm run build        # Build the TypeScript code
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Requirements 📋

- Node.js >= 16
- Git installed and configured
- OpenAI API key

## Security 🔒

Your OpenAI API key is stored securely using encryption. For additional security, you can set a custom encryption key using the `GPUSH_ENCRYPTION_KEY` environment variable.

## License 📄

MIT

---
Made with ❤️ using OpenAI's GPT models 