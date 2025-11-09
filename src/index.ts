#!/usr/bin/env node
import { arxivWorkflow } from './workflows/arxiv-workflow.js';
import { config } from './config.js';

/**
 * Main entry point for the arXiv PDF Processing application
 *
 * This application uses Mastra.ai to:
 * 1. Search arXiv.org for papers by topic (Agent #1)
 * 2. Download and process PDFs with Google Vertex AI Gemini (Agent #2)
 * 3. Save structured markdown summaries to disk
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      arXiv PDF Processor with Mastra.ai                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📋 Configuration:');
  console.log(`   Topic: "${config.arxiv.topic}"`);
  console.log(`   Max Results: ${config.arxiv.maxResults}`);
  console.log(`   Model: ${config.vertex.model}`);
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
    console.error('  1. Your .env file has correct Google Vertex AI credentials');
    console.error('  2. The GOOGLE_PROJECT_ID and GOOGLE_LOCATION are set');
    console.error('  3. Your service account has Vertex AI permissions\n');
    process.exit(1);
  }
}

// Run the application
main();
