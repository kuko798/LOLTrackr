const { execSync } = require('child_process');

const env = process.env;

if (env.DATABASE_URL) {
  execSync('npx prisma db push', {
    stdio: 'inherit',
    env,
  });
}

execSync('next build', {
  stdio: 'inherit',
  env,
});
