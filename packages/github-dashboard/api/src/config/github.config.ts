import { registerAs } from '@nestjs/config';

export default registerAs('github', () => ({
  token: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_BASE_URL || 'https://api.github.com',
  rateLimit: {
    unauthenticated: 60, // requests per hour
    authenticated: 5000, // requests per hour
  },
}));
