# Quick Setup Guide

## Step-by-Step Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-api03-...`)

### 3. Configure Google Vertex AI

#### Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin > Service Accounts**
3. Click **Create Service Account**
4. Name: `mastra-arxiv-processor`
5. Grant role: **Vertex AI User**
6. Click **Done**

#### Generate Key

1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key > Create new key**
4. Choose **JSON** format
5. Download the key file

### 4. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Anthropic API (for Claude Sonnet 4.5 - PDF Processing)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Google Vertex AI (for Gemini 2.0 Flash - arXiv Search)
GOOGLE_CLIENT_EMAIL=<client_email from JSON>
GOOGLE_PRIVATE_KEY=<private_key from JSON (keep the quotes and \n characters)>
GOOGLE_PROJECT_ID=<project_id from JSON>
GOOGLE_LOCATION=us-central1

# Easily change the topic!
ARXIV_TOPIC="LLM Graph Knowledge"
ARXIV_MAX_RESULTS=5
```

**Important**: Keep the `\n` characters in the private key!

### 5. Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

Or enable via [Cloud Console](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)

### 6. Run the Application

```bash
npm run dev
```

## Changing the Topic

Just edit `.env`:
```env
ARXIV_TOPIC="Quantum Computing"
ARXIV_MAX_RESULTS=10
```

Then run again:
```bash
npm run dev
```

## Troubleshooting

### "Authentication failed" (Anthropic)
- Verify your `ANTHROPIC_API_KEY` is correct
- Check your API key is active at [Anthropic Console](https://console.anthropic.com/)
- Ensure you have sufficient credits

### "Authentication failed" (Google Vertex AI)
- Double-check your `GOOGLE_PRIVATE_KEY` includes all `\n` characters
- Verify the service account email matches
- Ensure the service account has **Vertex AI User** role

### "Model not found"
- Make sure Vertex AI API is enabled
- Try a different region in `GOOGLE_LOCATION` (e.g., `us-east1`)

### "No papers found"
- Try a broader search topic
- Increase `ARXIV_MAX_RESULTS`

## Example Topics

- `"LLM Graph Knowledge"`
- `"Quantum Machine Learning"`
- `"Neural Architecture Search"`
- `"Transformer Models"`
- `"Reinforcement Learning"`
- `"Computer Vision"`
- `"Natural Language Processing"`

## Output

Markdown files will be saved to:
```
arxiv/
├── 2510.20691.md
├── 2510.19832.md
└── ...
```

Each file contains a comprehensive summary of the paper!
