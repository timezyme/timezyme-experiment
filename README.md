# arXiv PDF Processor with Mastra.ai

A TypeScript application built with [Mastra.ai](https://mastra.ai) that automatically fetches arXiv papers by topic, downloads PDFs, and processes them using **Gemini 2.5 Flash** to generate structured markdown summaries.

## 🏗️ Architecture

This application follows a **clean, architecturally sound design** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Mastra Workflow                          │
│                 (arxiv-pdf-processing)                      │
└────────┬────────────────────────────────────┬───────────────┘
         │                                    │
         ▼                                    ▼
┌────────────────────┐            ┌─────────────────────────┐
│    Agent #1        │            │      Agent #2           │
│  arXiv Search      │────────▶   │   PDF Processor         │
│  (Gemini 2.5)      │  Papers    │  (Gemini 2.5)           │
└────────┬───────────┘            └──────────┬──────────────┘
         │                                    │
         ▼                                    ▼
┌────────────────────┐            ┌─────────────────────────┐
│  searchArxivTool   │            │  downloadPdfTool        │
│  (arXiv API)       │            │  saveMarkdownTool       │
└────────────────────┘            └─────────────────────────┘
```

### Components

**Workflow**: `src/workflows/arxiv-workflow.ts`
- Orchestrates the two-agent pipeline
- Sequential step execution with typed inputs/outputs

**Agent #1** (`src/agents/arxiv-agent.ts`): arXiv Search Agent
- Searches arXiv.org API for papers by topic
- Returns PDF URLs and paper metadata
- Uses: Gemini 2.5 Flash (fast, efficient)

**Agent #2** (`src/agents/pdf-processor-agent.ts`): PDF Processing Agent
- Downloads PDFs from URLs
- Processes content with **Gemini 2.5 Flash**
- Generates structured markdown summaries
- Saves to disk with arXiv ID as filename

**Tools**: Type-safe, Zod-validated operations
- `searchArxivTool`: Query arXiv API
- `downloadPdfTool`: Fetch and parse PDFs
- `saveMarkdownTool`: Write markdown to disk

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Platform account with Vertex AI API enabled
- Service account credentials with Vertex AI permissions

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Google Vertex AI Configuration (for both agents)
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_LOCATION=us-central1

# arXiv Configuration (easily changeable!)
ARXIV_TOPIC="LLM Graph Knowledge"
ARXIV_MAX_RESULTS=5
```

### API Setup

#### Google Vertex AI
1. Enable Vertex AI API in your GCP project
2. Create a service account with `Vertex AI User` role
3. Generate and download a JSON key file
4. Extract `client_email` and `private_key` to your `.env`

[See Google Cloud Documentation](https://cloud.google.com/vertex-ai/docs/authentication)

## 📖 Usage

### Run the application

**Development mode** (with TypeScript):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

### Change the topic

Simply update the `ARXIV_TOPIC` in your `.env` file:
```env
ARXIV_TOPIC="Quantum Computing"
ARXIV_MAX_RESULTS=10
```

Or pass environment variables directly:
```bash
ARXIV_TOPIC="Neural Networks" npm run dev
```

### Output

Markdown files are saved to `./arxiv/` directory:
```
arxiv/
├── 2510.20691.md
├── 2510.19832.md
└── ...
```

Each file contains:
- Title
- Authors
- Abstract/Summary
- Key Findings
- Methodology
- Conclusions
- Citations

## 🎯 Example Workflow Execution

```
╔═══════════════════════════════════════════════════════════╗
║      arXiv PDF Processor with Mastra.ai                  ║
╚═══════════════════════════════════════════════════════════╝

📋 Configuration:
   Topic: "LLM Graph Knowledge"
   Max Results: 5
   Search Model: gemini-2.5-flash-001 (Gemini)
   Processing Model: gemini-2.5-flash-001 (Gemini)
   Output Directory: ./arxiv

🔍 Step 1: Searching arXiv...
   Topic: "LLM Graph Knowledge"
   Max Results: 5
   ✅ Found 5 papers

📄 Step 2: Processing papers with Gemini...

   Processing paper 1/5:
   Title: Graph-based Knowledge Representation in LLMs
   PDF: https://arxiv.org/pdf/2510.20691
      Tool called: download-pdf
      Tool called: save-markdown
   ✅ Saved: arxiv/2510.20691.md

   [... more papers ...]

✅ Processing complete: 5/5 papers saved

═══════════════════════════════════════════════════════════
                        RESULTS
═══════════════════════════════════════════════════════════

✅ Successfully processed 5 papers

📁 Saved files:
   1. arxiv/2510.20691.md
   2. arxiv/2510.19832.md
   3. arxiv/2510.18945.md
   4. arxiv/2510.17234.md
   5. arxiv/2510.16521.md

✨ Done!
```

## 📁 Project Structure

```
.
├── src/
│   ├── agents/
│   │   ├── arxiv-agent.ts           # Agent #1: arXiv search
│   │   └── pdf-processor-agent.ts   # Agent #2: PDF processing
│   ├── tools/
│   │   ├── arxiv-tools.ts           # arXiv API integration
│   │   └── pdf-tools.ts             # PDF download/save tools
│   ├── workflows/
│   │   └── arxiv-workflow.ts        # Main workflow orchestration
│   ├── config.ts                    # Configuration management
│   └── index.ts                     # Application entry point
├── arxiv/                           # Output directory for .md files
├── .env                             # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

All configuration is centralized in `src/config.ts` and driven by environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ARXIV_TOPIC` | Topic to search for | `"LLM Graph Knowledge"` |
| `ARXIV_MAX_RESULTS` | Max papers to fetch | `5` |
| `GOOGLE_PROJECT_ID` | GCP Project ID | Required |
| `GOOGLE_LOCATION` | Vertex AI region | `us-central1` |
| `GOOGLE_CLIENT_EMAIL` | Service account email | Required |
| `GOOGLE_PRIVATE_KEY` | Service account key | Required |

## 🛠️ Development

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in `dist/` directory.

### Type Checking

TypeScript provides full type safety across:
- Agent configurations
- Tool schemas (via Zod)
- Workflow steps
- AI SDK integrations

## 📚 Key Technologies

- **[Mastra.ai](https://mastra.ai)**: AI agent framework
- **[Vercel AI SDK](https://ai-sdk.dev)**: LLM provider integrations
- **[Google Vertex AI](https://cloud.google.com/vertex-ai)**: Gemini 2.5 Flash for both agents
- **[Zod](https://zod.dev)**: Schema validation
- **[arXiv API](https://info.arxiv.org/help/api)**: Academic paper search
- **TypeScript**: Type-safe development

## 🎯 Design Principles

This application follows the **"Architecturally sound, not over-complicated"** philosophy:

✅ **Clean separation of concerns**: Agents, tools, workflows clearly separated
✅ **Type safety**: Zod schemas ensure runtime validation
✅ **Modular design**: Easy to extend with new agents/tools
✅ **Configuration-driven**: Change behavior via environment variables
❌ **Not over-engineered**: Pragmatic patterns, no unnecessary abstraction
🎯 **Easy onboarding**: Understand the codebase in <30 minutes

## 📖 Extending the Application

### Add a new tool

```typescript
// src/tools/my-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const myTool = createTool({
  id: 'my-tool',
  description: 'Description of what this tool does',
  inputSchema: z.object({
    param: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  execute: async ({ context }) => {
    // Tool logic here
    return { result: 'success' };
  },
});
```

### Add a new agent

```typescript
// src/agents/my-agent.ts
import { Agent } from '@mastra/core/agent';
import { vertex } from '@ai-sdk/google-vertex';
import { myTool } from '../tools/my-tool.js';
import { config } from '../config.js';

export const myAgent = new Agent({
  name: 'my-agent',
  instructions: 'What this agent does...',
  model: vertex('gemini-2.5-flash-001', {
    project: config.vertex.projectId,
    location: config.vertex.location,
  }),
  tools: { myTool },
});
```

### Add workflow steps

```typescript
const myStep = createStep({
  id: 'my-step',
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ output: z.string() }),
  execute: async ({ context }) => {
    // Step logic
    return { output: 'result' };
  },
});
```

## 🐛 Troubleshooting

**Error: "Failed to search arXiv"**
- Check your internet connection
- Verify arXiv API is accessible

**Error: "Authentication failed" (Vertex AI)**
- Verify `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are correct
- Ensure service account has Vertex AI User role
- Check `GOOGLE_PROJECT_ID` matches your GCP project
- Make sure `GOOGLE_PRIVATE_KEY` includes all `\n` characters

**Error: "Model not found"**
- Ensure Vertex AI API is enabled in your GCP project
- Verify the model is available in your region (`GOOGLE_LOCATION`)
- Check model name is correct (`gemini-2.5-flash-001`)

## 📄 License

MIT

## 🙏 Acknowledgments

- [Mastra.ai](https://mastra.ai) for the excellent AI framework
- [Google Cloud](https://cloud.google.com/) for Vertex AI and Gemini 2.5 Flash
- [arXiv.org](https://arxiv.org) for providing open access to research papers
