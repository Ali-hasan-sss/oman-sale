#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const src = path.join(mobileRoot, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const destDir = path.join(mobileRoot, 'build-output');
const dest = path.join(destDir, 'omansale.aab');

if (!fs.existsSync(src)) {
  console.error('Release AAB not found at', src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`→ AAB copied to ${dest}`);
