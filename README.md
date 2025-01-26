# gpush 🚀

An AI-powered CLI tool that automatically generates meaningful commit messages and streamlines your git workflow.

## Features ✨

- 🤖 AI-powered commit message generation using OpenAI's GPT models
- 🔄 Seamless git workflow integration
- 🔐 Secure API key management
- 🎨 Interactive CLI with colored output
- ⚡ Support for force push and branch selection
- 🧪 Dry run mode to preview commit messages

## Installation 📦

```bash
npm install -g gpush
```

## Quick Start 🚀

1. Stage your changes using `git add`
2. Run `gpush push`
3. On first run, you'll be prompted to enter your OpenAI API key
4. Review the generated commit message
5. Confirm to commit and push your changes

## Usage 💻

### Basic Workflow

1. Stage your changes:
```bash
git add .  # or stage specific files
```

2. Generate commit message and push:
```bash
gpush push
```

The tool will:
1. Check for staged changes
2. Generate a commit message using AI
3. Show you the proposed message
4. Ask for confirmation
5. Commit and push your changes if confirmed

### Command Options

```bash
# Preview commit message without committing
gpush push --dry-run

# Force push changes
gpush push --force

# Push to a specific branch
gpush push --branch main

# Combine options
gpush push --force --branch main
```

### Configuration

```bash
# Set OpenAI API key
gpush config --set-key YOUR_API_KEY

# View current API key status
gpush config --show-key

# Set AI model (default: gpt-4o)
gpush ai:model gpt-4o
```

## Requirements 📋

- Node.js >= 16
- Git installed and configured
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Security 🔒

Your OpenAI API key is stored securely in your user configuration. Never share your API key or commit it to version control.

## License 📄

MIT

---
Made with ❤️ using DeepSeek, Claude and CursorAI