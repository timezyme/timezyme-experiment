#!/usr/bin/env node
import { arxivWorkflow } from './workflows/arxiv-workflow.js';
import { config } from './config.js';

/**
 * Main entry point for the arXiv PDF Processing application
 *
 * This application uses Mastra.ai to:
 * 1. Search arXiv.org for papers by topic (Agent #1 - Gemini 2.5 Flash)
 * 2. Download and process PDFs with Gemini 2.5 Flash (Agent #2)
 * 3. Save structured markdown summaries to disk
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      arXiv PDF Processor with Mastra.ai                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📋 Configuration:');
  console.log(`   Topic: "${config.arxiv.topic}"`);
  console.log(`   Max Results: ${config.arxiv.maxResults}`);
  console.log(`   Search Model: ${config.vertex.model} (Gemini)`);
  console.log(`   Processing Model: ${config.vertex.pdfProcessingModel} (Gemini)`);
  console.log(`   Output Directory: ${config.output.directory}\n`);

  try {
    // Create a workflow run
    const run = await arxivWorkflow.createRunAsync();

    // Execute the workflow with input data
    const result = await run.start({
      inputData: {
        topic: config.arxiv.topic,
        maxResults: config.arxiv.maxResults,
      },
    });

    // Display results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                        RESULTS                            ');
    console.log('═══════════════════════════════════════════════════════════\n');

    const workflowOutput = (result as any).result;

    console.log(`✅ Successfully processed ${workflowOutput.processedCount} papers\n`);

    if (workflowOutput.savedFiles && workflowOutput.savedFiles.length > 0) {
      console.log('📁 Saved files:');
      workflowOutput.savedFiles.forEach((file: string, idx: number) => {
        console.log(`   ${idx + 1}. ${file}`);
      });
    }

    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('\n❌ Error running workflow:', error);
    console.error('\nPlease check:');
    console.error('  1. Your .env file has correct credentials');
    console.error('  2. Google Vertex AI: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID');
    console.error('  3. Your Google service account has Vertex AI permissions\n');
    process.exit(1);
  }
}

// Run the application
main();
