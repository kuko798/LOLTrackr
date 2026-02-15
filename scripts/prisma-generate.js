const { execSync } = require('child_process');

const fallbackDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/loltrackr?schema=public';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = fallbackDatabaseUrl;
}

execSync('npx prisma generate', {
  stdio: 'inherit',
  env: process.env,
});
