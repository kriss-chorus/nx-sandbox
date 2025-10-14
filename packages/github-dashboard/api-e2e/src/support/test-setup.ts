 
import axios from 'axios';
import nock from 'nock';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3001';
  axios.defaults.baseURL = `http://${host}:${port}`;

  // Block all unexpected external HTTP calls by default
  nock.disableNetConnect();
  // Allow local API and PostGraphile
  nock.enableNetConnect((host) => /^(localhost|127\.0\.0\.1)(:|$)/.test(host));

  // Mock GitHub API commonly used endpoints
  const gh = nock('https://api.github.com')
    .persist();

  // Mock user endpoints
  gh.get('/users/octocat').reply(200, {
    login: 'octocat',
    id: 1,
    avatar_url: 'https://github.com/images/error/octocat_happy.gif',
  });

  gh.get('/users/nonexistentuser12345').reply(404, {
    message: 'Not Found',
    documentation_url: 'https://docs.github.com/rest'
  });

  gh.get('/users/octocat/repos')
    .query(true)
    .reply(200, [
      { id: 1296269, full_name: 'octocat/Hello-World', private: false },
      { id: 1296270, full_name: 'octocat/Hello-World-2', private: false },
      { id: 1296271, full_name: 'octocat/Hello-World-3', private: false },
      { id: 1296272, full_name: 'octocat/Hello-World-4', private: false },
      { id: 1296273, full_name: 'octocat/Hello-World-5', private: false }
    ]);

  // Mock repository endpoints
  gh.get('/repos/octocat/Hello-World').reply(200, {
    id: 1296269,
    full_name: 'octocat/Hello-World',
    html_url: 'https://github.com/octocat/Hello-World'
  });

  gh.get('/repos/nonexistentuser/nonexistentrepo').reply(404, {
    message: 'Not Found',
    documentation_url: 'https://docs.github.com/rest'
  });

  // Mock activity endpoints
  gh.get('/repos/octocat/Hello-World/commits')
    .query(true)
    .reply(200, []);

  // Mock rate limit endpoint
  gh.get('/rate_limit').reply(200, {
    resources: {
      core: {
        limit: 5000,
        remaining: 4999,
        reset: Math.floor(Date.now() / 1000) + 3600
      }
    }
  });

  // Mock specific activity endpoints that might be called
  gh.get('/repos/octocat/Hello-World/pulls')
    .query(true)
    .reply(200, []);

  gh.get('/repos/octocat/Hello-World/issues')
    .query(true)
    .reply(200, []);

  gh.get('/repos/octocat/Hello-World/commits')
    .query(true)
    .reply(200, []);

  gh.get('/repos/octocat/Hello-World/contributors')
    .query(true)
    .reply(200, []);

  gh.get('/repos/octocat/Hello-World/stats/contributors')
    .query(true)
    .reply(200, []);

  gh.get('/repos/octocat/Hello-World/stats/participation')
    .query(true)
    .reply(200, []);

  // Mock any other GitHub API calls with a generic response
  gh.get(/.*/)
    .reply(200, { message: 'Mocked response' });

  gh.post(/.*/)
    .reply(200, { message: 'Mocked response' });

  gh.patch(/.*/)
    .reply(200, { message: 'Mocked response' });

  gh.put(/.*/)
    .reply(200, { message: 'Mocked response' });

  gh.delete(/.*/)
    .reply(200, { message: 'Mocked response' });
};
