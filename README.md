# 🌟 gpush - AI-Powered Git Commit Assistant

Generate perfect commit messages effortlessly with AI!

gpush leverages OpenAI GPT-4o or AWS Bedrock Claude models to craft clear, conventional commit messages and push your changes—all in one command.

## 🚀 Features

- **AI-Driven Commit Messages**: Automatically generates concise, conventional commits from staged changes
- **Multi-Provider Support**: Choose between OpenAI or AWS Bedrock (Claude models)
- **Secure Configuration**: Encrypted API key storage and environment variables
- **Dry-Run Mode**: Preview generated messages without committing
- **Smart Diff Truncation**: Handles large diffs gracefully to stay within AI token limits

## 📦 Installation

```bash
npm install -g gpush-ai
```

### Prerequisites:
- Node.js v18+
- Git installed
- API key for OpenAI or AWS credentials for Bedrock access

## ⚙️ Configuration

### 1. Set API Key (OpenAI)
```bash
gpush config --set-key sk-your-openai-key-here
```

### 2. Choose AI Provider & Model

| Command | Description | Example |
|---------|-------------|---------|
| `gpush ai:provider <provider>` | Set provider (openai or bedrock) | `gpush ai:provider bedrock` |
| `gpush ai:model <model>` | Set model (e.g., gpt-4o, Claude models) | `gpush ai:model anthropic.claude-3-haiku-20240307-v1:0` |
| `gpush ai:aws-region <region>` | Set AWS region for Bedrock | `gpush ai:aws-region us-east-1` |

### 3. Verify Configuration
```bash
gpush status
```

## 🛠️ Usage

### Generate & Push Commit
```bash
gpush push
```

#### Options:
- `--dry-run`: Preview message without committing
- `--force`: Force push changes
- `--branch <name>`: Specify target branch

### Example Workflow:
```bash
git add .
gpush push --dry-run  # Preview message
gpush push            # Commit and push
```

## 🔍 All Commands

| Command | Description |
|---------|-------------|
| `gpush push` | Main command to generate and push commits |
| `gpush ai:provider` | Switch between OpenAI/Bedrock |
| `gpush ai:model` | Set default AI model |
| `gpush ai:aws-region` | Configure AWS region for Bedrock |
| `gpush config` | Manage API key |
| `gpush status` | Show current configuration |

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_DIFF_LENGTH` | Truncate diffs longer than this | 4000 |
| `GPUSH_ENCRYPTION_KEY` | Custom encryption key for config | - |

## 🚨 Troubleshooting

### Common Issues:
- "No API key configured": Run `gpush config --set-key`
- AWS Bedrock Access Denied: Ensure IAM permissions include `bedrock:InvokeModel`
- Long Diffs: Increase `MAX_DIFF_LENGTH` if truncation occurs

### Error Codes:
- 1: Configuration error
- 3: AI generation failure
- 4: API connection issue

## 🔒 Security
- API keys are encrypted using conf
- AWS credentials use the default AWS SDK credential chain

## 🤝 Contributing
Contributions welcome!
1. Fork the repository
2. Create a feature branch
3. Submit a PR with tests and documentation updates

## 📄 License
MIT

## ⚡ Inspired by
- CursorAI
- Me, myself and I
- Mom

---

Happy committing! ✨  
Made with ❤️ by Me