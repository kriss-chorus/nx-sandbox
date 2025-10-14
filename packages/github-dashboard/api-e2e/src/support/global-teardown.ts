import { killPort } from '@nx/node/utils';
import nock from 'nock';

import { testDataManager } from './test-data';

module.exports = async function () {
  // Clean up nock mocks
  nock.cleanAll();
  nock.restore();

  // Clean up test data
  try {
    await testDataManager.cleanupTestData();
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }

  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await killPort(port);
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
