import { Agent } from '@mastra/core/agent';
import { createAnthropic } from '@ai-sdk/anthropic';
import { downloadPdfTool, saveMarkdownTool } from '../tools/pdf-tools.js';
import { config } from '../config.js';

// Create Anthropic provider with API key
const anthropic = createAnthropic({
  apiKey: config.anthropic.apiKey,
});

/**
 * Agent #2: PDF Processing Agent
 *
 * This agent downloads PDF files, processes them using Claude Sonnet 4.5,
 * and saves the structured markdown output to disk.
 */
export const pdfProcessorAgent = new Agent({
  name: 'pdf-processor-agent',
  instructions: `You are a PDF processing assistant powered by Claude Sonnet 4.5. Your job is to:
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
  model: anthropic(config.anthropic.model),
  tools: {
    downloadPdfTool,
    saveMarkdownTool,
  },
});
