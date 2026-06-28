#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const src = path.join(mobileRoot, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const destDir = path.join(mobileRoot, 'build-output');
const dest = path.join(destDir, 'omansale.apk');

if (!fs.existsSync(src)) {
  console.error('Release APK not found at', src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`→ APK copied to ${dest}`);
