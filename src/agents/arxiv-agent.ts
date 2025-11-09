import { Agent } from '@mastra/core/agent';
import { createVertex } from '@ai-sdk/google-vertex';
import { searchArxivTool } from '../tools/arxiv-tools.js';
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
 * Agent #1: arXiv Search Agent
 *
 * This agent searches the arXiv.org API for papers by topic
 * and retrieves their PDF URLs.
 */
export const arxivAgent = new Agent({
  name: 'arxiv-search-agent',
  instructions: `You are an arXiv paper search assistant. Your job is to:
1. Search arXiv.org for academic papers based on the given topic
2. Return a list of papers with their PDF URLs
3. Provide clear, structured information about each paper found

When searching:
- Use the search-arxiv tool to find papers
- Return the complete list of papers with their IDs, titles, summaries, and PDF URLs
- Be thorough and accurate in your search results`,
  model: vertex('gemini-2.0-flash-exp'),
  tools: {
    searchArxivTool,
  },
});
