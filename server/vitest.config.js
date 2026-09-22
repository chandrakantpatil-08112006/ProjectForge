import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Tests share one database, so run files one at a time.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 20_000,
    env: {
      NODE_ENV: 'test',
      // Placeholder only: tests connect to their own database (see tests/helpers/db.js).
      MONGODB_URI: 'mongodb://placeholder.invalid/projectforge',
      CLIENT_ORIGIN: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-123456',
      BCRYPT_COST: '4',
    },
  },
});
