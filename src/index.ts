#!/usr/bin/env node
import { pdfProcessorAgent } from './agents/pdf-processor-agent.js';
import { config } from './config.js';

/**
 * Main entry point for the arXiv PDF Processing application
 *
 * This application uses Mastra.ai to:
 * 1. Download a PDF from a specified arXiv URL
 * 2. Process the PDF with Gemini 2.5 Flash
 * 3. Save the full paper content as structured markdown
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
  console.log('║      arXiv PDF Processor with Mastra.ai                  ║');
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
    console.log('📄 Processing paper with Gemini...\n');

    // Use the PDF processor agent to download, process, and save the paper
    const result = await pdfProcessorAgent.generate(
      `I need you to process an arXiv paper. Here are the details:
       - PDF URL: ${paperUrl}
       - arXiv ID: ${arxivId}

       You MUST follow these steps in order:

       Step 1: Call the "download-pdf" tool with these parameters:
       - pdfUrl: "${paperUrl}"
       - arxivId: "${arxivId}"

       Step 2: After you receive the PDF content, convert the ENTIRE content to markdown format, preserving all sections.

       Step 3: Call the "save-markdown" tool with these parameters:
       - arxivId: "${arxivId}"
       - markdown: [the complete markdown you created]

       IMPORTANT: You MUST use the tools. Do not just describe what you would do - actually call the tools!`,
      {
        onStepFinish: (step) => {
          console.log(`   Agent step: ${step.stepType}`);
        },
        onChunk: (chunk) => {
          // Show progress for long-running operations
          if (chunk.type === 'text-delta') {
            process.stdout.write('.');
          }
        },
      }
    );

    // Check if the file was saved successfully
    let savedFile: string | null = null;

    console.log(`\n   Debug: toolResults count: ${result.toolResults?.length || 0}`);

    if (result.toolResults) {
      for (const tr of result.toolResults) {
        const toolData = tr as any;
        console.log(`   Debug: Tool called - ${toolData.toolName}`);

        if (toolData.toolName === 'save-markdown' && toolData.result) {
          if (typeof toolData.result === 'object' && 'filePath' in toolData.result) {
            savedFile = toolData.result.filePath as string;
          }
        }
      }
    } else {
      console.log('   Debug: No tool results found in response');
      console.log(`   Debug: Result text: ${result.text?.substring(0, 200) || 'N/A'}`);
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('                        RESULTS                            ');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (savedFile) {
      console.log(`✅ Successfully processed paper: ${arxivId}`);
      console.log(`📁 Saved to: ${savedFile}\n`);
    } else {
      console.log('⚠️  Paper was processed but file save status is unclear\n');
    }

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
