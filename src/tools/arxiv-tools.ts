import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { config } from '../config.js';

const parseXml = promisify(parseString);

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  published: string[];
  'arxiv:comment'?: Array<{ _: string }>;
}

interface ArxivFeed {
  feed: {
    entry?: ArxivEntry[];
  };
}

/**
 * Tool to search arXiv papers by topic
 */
export const searchArxivTool = createTool({
  id: 'search-arxiv',
  description: 'Search arXiv.org for papers by topic and retrieve their PDF URLs',
  inputSchema: z.object({
    topic: z.string().describe('The topic to search for (e.g., "LLM Graph Knowledge")'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
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
  execute: async ({ context }) => {
    const { topic, maxResults } = context;

    try {
      // Build arXiv API query
      const searchQuery = encodeURIComponent(`all:${topic}`);
      const url = `${config.arxiv.apiUrl}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

      console.log(`🔍 Searching arXiv for: "${topic}"`);

      const response = await axios.get(url);
      const parsed = await parseXml(response.data) as ArxivFeed;

      if (!parsed.feed.entry) {
        console.log('⚠️  No papers found');
        return { papers: [] };
      }

      const papers = parsed.feed.entry.map((entry: ArxivEntry) => {
        // Extract arXiv ID from the entry ID URL
        const idMatch = entry.id[0].match(/\/abs\/(.+?)v?\d*$/);
        const arxivId = idMatch ? idMatch[1] : entry.id[0];

        return {
          id: arxivId,
          title: entry.title[0].trim().replace(/\s+/g, ' '),
          summary: entry.summary[0].trim().replace(/\s+/g, ' '),
          pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
          published: entry.published[0],
        };
      });

      console.log(`✅ Found ${papers.length} papers`);
      papers.forEach((paper, idx) => {
        console.log(`   ${idx + 1}. ${paper.title}`);
        console.log(`      PDF: ${paper.pdfUrl}`);
      });

      return { papers };
    } catch (error) {
      console.error('❌ Error searching arXiv:', error);
      throw new Error(`Failed to search arXiv: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
