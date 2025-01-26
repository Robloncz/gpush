# gpush-ai 🚀

An AI-powered CLI tool that automatically generates meaningful commit messages and streamlines your git workflow.

## Features ✨

- 🤖 AI-powered commit message generation using OpenAI's GPT models
- 🔄 Seamless git workflow integration
- 🔐 Secure API key storage with encryption
- 🎨 Beautiful CLI interface with colored output
- ⚡ Support for force push and branch selection
- 🧪 Dry run mode to preview commit messages

## Development 🛠️

### Local Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/gpush-ai.git
cd gpush-ai

# Install dependencies
npm install

# Build the project
npm run build

# Link the package locally
npm link
```

### Testing Locally
1. After running `npm link`, the `gpush` command will be available globally
2. Set up your OpenAI API key:
```bash
gpush config --set-key YOUR_API_KEY
```
3. Make some changes in any git repository
4. Stage your changes:
```bash
git add .
```
5. Run gpush:
```bash
gpush push --dry-run  # Test without actually committing
```

### Development Commands
```bash
npm run build        # Build the TypeScript code
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Installation 📦

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
gpush ai:model gpt-4
```

## Environment Variables 🔐

- `GPUSH_ENCRYPTION_KEY`: Custom encryption key for storing sensitive data
- `OPENAI_MODEL`: Override default AI model
- `MAX_DIFF_LENGTH`: Maximum diff length to send to OpenAI (default: 4000)

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