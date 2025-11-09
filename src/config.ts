import dotenv from 'dotenv';

dotenv.config();

export const config = {
  arxiv: {
    topic: process.env.ARXIV_TOPIC || 'LLM Graph Knowledge',
    maxResults: parseInt(process.env.ARXIV_MAX_RESULTS || '5', 10),
    apiUrl: 'http://export.arxiv.org/api/query',
  },
  vertex: {
    projectId: process.env.GOOGLE_PROJECT_ID || '',
    location: process.env.GOOGLE_LOCATION || 'us-central1',
    model: 'gemini-2.5-pro',
  },
  output: {
    directory: './arxiv',
  },
};
