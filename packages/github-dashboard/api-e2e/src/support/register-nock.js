/*
  Test-only HTTP mocking for the API process.
  Usage:
  NODE_OPTIONS="--require <absolute-path>/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e
*/

// CommonJS required so it can be preloaded via NODE_OPTIONS --require
const nock = require('nock');

// Block all external calls except localhost
nock.disableNetConnect();
nock.enableNetConnect(/^(localhost|127\.(?:0|[1-9]\d?)\.0\.1)(:|$)/);

// Base GitHub scope
const gh = nock('https://api.github.com').persist();

// Minimal endpoints used by tests
gh.get('/users/octocat').reply(200, {
  login: 'octocat',
  id: 1,
  avatar_url: 'https://example.com/octo.png',
});

gh.get('/users/octocat/repos')
  .query(true)
  .reply(200, [
    { id: 1, full_name: 'octocat/Hello-World', private: false },
  ]);

gh.get('/repos/octocat/Hello-World').reply(200, {
  id: 1,
  full_name: 'octocat/Hello-World',
});

// Common activity-related endpoints
gh.get(/\/repos\/octocat\/Hello-World\/(pulls|issues|commits|stats\/contributors|stats\/participation)/)
  .query(true)
  .reply(200, []);

// Negative cases used by tests
gh.get('/users/nonexistentuser12345').reply(404, { message: 'Not Found' });
gh.get('/repos/nonexistentuser/nonexistentrepo').reply(404, { message: 'Not Found' });

// Optional catch-alls to guard any unmocked GitHub endpoints used by the API during tests
gh.get(/.*/).reply(200, { message: 'Mocked response' });
gh.post(/.*/).reply(200, { message: 'Mocked response' });
gh.patch(/.*/).reply(200, { message: 'Mocked response' });
gh.put(/.*/).reply(200, { message: 'Mocked response' });
gh.delete(/.*/).reply(200, { message: 'Mocked response' });

// Export nothing; preload side-effects only
module.exports = {};


