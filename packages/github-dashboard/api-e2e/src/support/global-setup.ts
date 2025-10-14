import { waitForPortOpen } from '@nx/node/utils';

import { testDataManager } from './test-data';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await waitForPortOpen(port, { host });

  // Seed global test data
  try {
    await testDataManager.seedTestData();
    console.log('Global test data seeded successfully');
  } catch (error) {
    console.error('Failed to seed global test data:', error);
    throw error;
  }

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
