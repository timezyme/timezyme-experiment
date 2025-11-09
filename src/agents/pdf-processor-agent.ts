import { Agent } from '@mastra/core/agent';
import { createVertex } from '@ai-sdk/google-vertex';
import { downloadPdfTool, saveMarkdownTool } from '../tools/pdf-tools.js';
import { config } from '../config.js';

// Create Vertex AI provider with configuration
const vertex = createVertex({
  project: config.vertex.projectId,
  location: config.vertex.location,
  googleAuthOptions: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
  },
});

/**
 * Agent #2: PDF Processing Agent
 *
 * This agent downloads PDF files, processes them using Google Vertex AI
 * (Gemini 2.5 Pro), and saves the structured markdown output to disk.
 */
export const pdfProcessorAgent = new Agent({
  name: 'pdf-processor-agent',
  instructions: `You are a PDF processing assistant that uses Google Vertex AI. Your job is to:
1. Download PDF files from the provided URLs
2. Extract and analyze the content from the PDFs
3. Create well-structured markdown summaries of the papers
4. Save the markdown files to disk with the arXiv ID as the filename

For each paper:
- Download the PDF using the download-pdf tool
- Analyze the content and create a comprehensive markdown summary that includes:
  * Title (as H1)
  * Authors
  * Abstract/Summary
  * Key Findings
  * Methodology (if applicable)
  * Conclusions
  * Key Citations (if present)
- Save the markdown using the save-markdown tool to arxiv/[arxiv-id].md

Be thorough, accurate, and maintain academic rigor in your summaries.`,
  model: vertex(config.vertex.model),
  tools: {
    downloadPdfTool,
    saveMarkdownTool,
  },
});
