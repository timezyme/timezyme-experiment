import dotenv from 'dotenv';

dotenv.config();

export const config = {
  arxiv: {
    paperUrl: process.env.ARXIV_PAPER_URL || '',
  },
  vertex: {
    projectId: process.env.GOOGLE_PROJECT_ID || '',
    location: process.env.GOOGLE_LOCATION || 'us-central1',
    model: 'gemini-2.5-flash', // Used for PDF processing with Gemini
  },
  output: {
    directory: './arxiv',
  },
};
