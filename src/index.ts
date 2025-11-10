#!/usr/bin/env node
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from './config.js';

/**
 * Main entry point for the arXiv PDF Processing application
 *
 * Direct implementation without complex agent/tool overhead
 */

/**
 * Extract arXiv ID from URL
 * Example: https://arxiv.org/pdf/2502.14902 -> 2502.14902
 */
function extractArxivId(url: string): string {
  const match = url.match(/\/(\d+\.\d+)(\.pdf)?$/);
  if (!match) {
    throw new Error(`Invalid arXiv URL format: ${url}`);
  }
  return match[1];
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      arXiv PDF Processor with Gemini                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Validate configuration
  if (!config.arxiv.paperUrl) {
    console.error('❌ Error: ARXIV_PAPER_URL is not set in .env file\n');
    console.error('Please add the arXiv paper URL to your .env file:');
    console.error('ARXIV_PAPER_URL=https://arxiv.org/pdf/2502.14902\n');
    process.exit(1);
  }

  const paperUrl = config.arxiv.paperUrl;
  let arxivId: string;

  try {
    arxivId = extractArxivId(paperUrl);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}\n`);
    console.error('Expected format: https://arxiv.org/pdf/XXXX.XXXXX\n');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Paper URL: ${paperUrl}`);
  console.log(`   arXiv ID: ${arxivId}`);
  console.log(`   Model: ${config.vertex.model} (Gemini)`);
  console.log(`   Output Directory: ${config.output.directory}\n`);

  try {
    // Step 1: Download and parse PDF
    console.log('📄 Step 1: Downloading PDF...\n');
    console.log(`📥 Downloading PDF: ${paperUrl}`);

    const response = await axios.get(paperUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const pdfBuffer = Buffer.from(response.data);

    console.log(`📄 Parsing PDF content...`);
    const pdfData = await pdfParse(pdfBuffer);
    let textContent = pdfData.text;

    // Limit content to avoid API timeouts
    const MAX_CONTENT_LENGTH = 50000;
    if (textContent.length > MAX_CONTENT_LENGTH) {
      console.log(`⚠️  PDF too large (${textContent.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
      textContent = textContent.substring(0, MAX_CONTENT_LENGTH) + '\n\n[... Content truncated due to length ...]';
    }

    console.log(`✅ Successfully downloaded and parsed PDF (${pdfData.numpages} pages, ${textContent.length} chars)\n`);

    // Step 2: Convert to markdown with Gemini
    console.log('📝 Step 2: Converting to markdown with Gemini...\n');

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

    const { text: markdown } = await generateText({
      model: vertex(config.vertex.model) as any,
      prompt: `Convert this academic paper to well-structured markdown format. Preserve ALL content and sections.

Paper content:
${textContent}

Create markdown with:
- Title as H1
- Authors
- Abstract
- All sections (Introduction, Methods, Results, Discussion, Conclusions)
- References
- Preserve hierarchical structure with H2, H3, H4
- Include all equations, figures, tables

Do NOT summarize - extract EVERYTHING.`,
    });

    console.log(`✅ Markdown generated (${markdown.length} chars)\n`);

    // Step 3: Save markdown
    console.log('💾 Step 3: Saving markdown file...\n');

    await fs.mkdir(config.output.directory, { recursive: true });

    const cleanId = arxivId.replace(/[\/\\]/g, '-');
    const fileName = `${cleanId}.md`;
    const filePath = path.join(config.output.directory, fileName);

    console.log(`💾 Saving markdown to: ${filePath}`);
    await fs.writeFile(filePath, markdown, 'utf-8');
    console.log(`✅ Successfully saved markdown file\n`);

    // Display results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                        RESULTS                            ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`✅ Successfully processed paper: ${arxivId}`);
    console.log(`📁 Saved to: ${filePath}\n`);
    console.log('✨ Done!\n');
  } catch (error) {
    console.error('\n❌ Error processing paper:', error);
    console.error('\nPlease check:');
    console.error('  1. Your .env file has correct credentials');
    console.error('  2. Google Vertex AI: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID');
    console.error('  3. Your Google service account has Vertex AI permissions');
    console.error('  4. The arXiv paper URL is valid and accessible\n');
    process.exit(1);
  }
}

// Run the application
main();
