const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const prismaCli = path.resolve(__dirname, '../../../node_modules/prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, '--config', 'prisma.config.ts', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.resolve(__dirname, '..')
});

process.exit(result.status ?? 1);
