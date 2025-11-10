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
 * This agent downloads PDF files, extracts the COMPLETE content using Gemini 2.5 Flash,
 * and saves the full structured markdown output to disk (preserving all sections).
 */
export const pdfProcessorAgent = new Agent({
  name: 'pdf-processor-agent',
  instructions: `You are a PDF processing assistant powered by Gemini 2.5 Flash. Your job is to:
1. Download PDF files from the provided URLs
2. Extract the ENTIRE content from the PDFs
3. Convert the full paper content to well-structured markdown format
4. Save the complete markdown files to disk with the arXiv ID as the filename

For each paper:
- Download the PDF using the download-pdf tool
- Extract the FULL paper content and convert it to markdown, preserving ALL sections and content
- Maintain the original paper structure including:
  * Title (as H1)
  * Authors
  * Abstract
  * Introduction
  * All body sections (Methods, Results, Discussion, etc.)
  * Conclusions
  * References/Citations
  * Appendices (if present)
- Preserve the hierarchical structure of sections (use H2, H3, H4 as appropriate)
- Include equations, figures captions, tables, and all other content from the paper
- Do NOT summarize or omit content - extract the complete paper
- Save the full markdown using the save-markdown tool to arxiv/[arxiv-id].md

Be thorough and accurate. Extract EVERYTHING from the paper, not just a summary.`,
  model: vertex(config.vertex.pdfProcessingModel),
  tools: {
    downloadPdfTool,
    saveMarkdownTool,
  },
});
