import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { arxivAgent } from '../agents/arxiv-agent.js';
import { pdfProcessorAgent } from '../agents/pdf-processor-agent.js';

/**
 * Step 1: Search arXiv for papers by topic
 */
const searchArxivStep = createStep({
  id: 'search-arxiv-step',
  inputSchema: z.object({
    topic: z.string().describe('The topic to search for on arXiv'),
    maxResults: z.number().default(5).describe('Maximum number of results'),
  }),
  outputSchema: z.object({
    papers: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        pdfUrl: z.string(),
        published: z.string(),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    console.log('\n🔍 Step 1: Searching arXiv...');
    console.log(`   Topic: "${inputData.topic}"`);
    console.log(`   Max Results: ${inputData.maxResults}`);

    // Use Agent #1 to search arXiv
    const result = await arxivAgent.generate(
      `Search arXiv for papers about "${inputData.topic}". Return up to ${inputData.maxResults} most recent papers.`,
      {
        onStepFinish: (step) => {
          console.log(`   Agent step: ${step.stepType}`);
        },
      }
    );

    // Extract papers from the tool results
    let papers: any[] = [];

    if (result.toolResults && result.toolResults.length > 0) {
      for (const toolResult of result.toolResults) {
        // Tool was called, check the result
        const resultData = toolResult as any;
        if (resultData.result && typeof resultData.result === 'object' && 'papers' in resultData.result) {
          papers = resultData.result.papers as any[];
          break;
        }
      }
    }

    console.log(`   ✅ Found ${papers.length} papers\n`);

    return { papers };
  },
});

/**
 * Step 2: Process each paper with Agent #2
 */
const processPapersStep = createStep({
  id: 'process-papers-step',
  inputSchema: z.object({
    papers: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        pdfUrl: z.string(),
        published: z.string(),
      })
    ),
  }),
  outputSchema: z.object({
    processedCount: z.number(),
    savedFiles: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    console.log('📄 Step 2: Processing papers with Gemini...');

    const papers = inputData.papers;
    const savedFiles: string[] = [];

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      console.log(`\n   Processing paper ${i + 1}/${papers.length}:`);
      console.log(`   Title: ${paper.title}`);
      console.log(`   PDF: ${paper.pdfUrl}`);

      try {
        // Use Agent #2 to download, process, and save the paper
        const result = await pdfProcessorAgent.generate(
          `Download and process the PDF from "${paper.pdfUrl}" (arXiv ID: ${paper.id}).

           The paper is titled: "${paper.title}"

           Steps:
           1. Download the PDF using the download-pdf tool
           2. Create a comprehensive markdown summary of the paper
           3. Save the markdown file using the save-markdown tool with filename: arxiv/${paper.id}.md

           Make sure to extract and structure all key information from the paper.`,
          {
            onStepFinish: (step) => {
              console.log(`      Agent step: ${step.stepType}`);
            },
          }
        );

        // Check if the file was saved successfully
        if (result.toolResults) {
          for (const tr of result.toolResults) {
            const toolData = tr as any;
            if (toolData.toolName === 'save-markdown' && toolData.result) {
              if (typeof toolData.result === 'object' && 'filePath' in toolData.result) {
                savedFiles.push(toolData.result.filePath as string);
                console.log(`   ✅ Saved: ${toolData.result.filePath}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing paper ${paper.id}:`, error);
      }
    }

    console.log(`\n✅ Processing complete: ${savedFiles.length}/${papers.length} papers saved\n`);

    return {
      processedCount: savedFiles.length,
      savedFiles,
    };
  },
});

/**
 * Main Workflow: arXiv Paper Processing
 *
 * This workflow orchestrates the two agents:
 * 1. Agent #1 searches arXiv for papers by topic
 * 2. Agent #2 downloads PDFs and processes them with Gemini
 */
export const arxivWorkflow = createWorkflow({
  id: 'arxiv-pdf-processing-workflow',
  inputSchema: z.object({
    topic: z.string(),
    maxResults: z.number().default(5),
  }),
  outputSchema: z.object({
    processedCount: z.number(),
    savedFiles: z.array(z.string()),
  }),
})
  .then(searchArxivStep)
  .then(processPapersStep)
  .commit();
