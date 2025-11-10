import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { config } from '../config.js';

/**
 * Tool to download PDF from URL
 */
export const downloadPdfTool = createTool({
  id: 'download-pdf',
  description: 'Download a PDF file from a URL',
  inputSchema: z.object({
    pdfUrl: z.string().url().describe('The URL of the PDF to download'),
    arxivId: z.string().describe('The arXiv ID for naming the file'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string().optional(),
    content: z.string().optional(),
    numPages: z.number().optional(),
    contentLength: z.number().optional(),
    wasTruncated: z.boolean().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { pdfUrl, arxivId } = context;

    try {
      console.log(`📥 Downloading PDF: ${pdfUrl}`);

      // Download PDF
      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      const pdfBuffer = Buffer.from(response.data);

      // Parse PDF to extract text
      console.log(`📄 Parsing PDF content...`);
      const pdfData = await pdfParse(pdfBuffer);
      let textContent = pdfData.text;
      let wasTruncated = false;

      // Limit content to avoid API timeouts (max ~50,000 characters)
      const MAX_CONTENT_LENGTH = 50000;
      if (textContent.length > MAX_CONTENT_LENGTH) {
        console.log(`⚠️  PDF too large (${textContent.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
        textContent = textContent.substring(0, MAX_CONTENT_LENGTH) + '\n\n[... Content truncated due to length ...]';
        wasTruncated = true;
      }

      console.log(`✅ Successfully downloaded and parsed PDF (${pdfData.numpages} pages, ${textContent.length} chars)`);

      return {
        success: true,
        content: textContent,
        numPages: pdfData.numpages,
        contentLength: textContent.length,
        wasTruncated,
        filePath: `${arxivId}.pdf`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error downloading/parsing PDF: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Tool to save markdown content to disk
 */
export const saveMarkdownTool = createTool({
  id: 'save-markdown',
  description: 'Save markdown content to disk',
  inputSchema: z.object({
    arxivId: z.string().describe('The arXiv ID for naming the file'),
    markdown: z.string().describe('The markdown content to save'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { arxivId, markdown } = context;

    try {
      // Ensure output directory exists
      await fs.mkdir(config.output.directory, { recursive: true });

      // Clean arxivId for filename (remove any path separators)
      const cleanId = arxivId.replace(/[\/\\]/g, '-');
      const fileName = `${cleanId}.md`;
      const filePath = path.join(config.output.directory, fileName);

      console.log(`💾 Saving markdown to: ${filePath}`);

      // Write markdown to file
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`✅ Successfully saved markdown file`);

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error saving markdown: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
