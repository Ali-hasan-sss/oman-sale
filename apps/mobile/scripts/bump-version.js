#!/usr/bin/env node
/* eslint-disable no-console */
// Auto-increments the Android versionCode (and optionally the marketing version)
// stored in version.json. Runs automatically before each local build so every
// build gets a unique, monotonically increasing versionCode.
//
// Usage:
//   node scripts/bump-version.js              # bump versionCode by 1
//   node scripts/bump-version.js --minor      # also bump x.Y.0
//   node scripts/bump-version.js --major      # also bump X.0.0
//   node scripts/bump-version.js --patch      # also bump x.y.Z
//   node scripts/bump-version.js --set-code 42

const fs = require('node:fs');
const path = require('node:path');

const versionFile = path.resolve(__dirname, '..', 'version.json');

const read = () => {
  try {
    return JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  } catch {
    return { version: '0.1.0', versionCode: 1 };
  }
};

const args = process.argv.slice(2);
const data = read();

let versionCode = Number(data.versionCode) || 0;
const setCodeIndex = args.indexOf('--set-code');
if (setCodeIndex !== -1 && args[setCodeIndex + 1]) {
  versionCode = Number(args[setCodeIndex + 1]);
} else {
  versionCode += 1;
}

let version = typeof data.version === 'string' ? data.version : '0.1.0';
const [major = 0, minor = 0, patch = 0] = version.split('.').map((part) => Number(part) || 0);
if (args.includes('--major')) version = `${major + 1}.0.0`;
else if (args.includes('--minor')) version = `${major}.${minor + 1}.0`;
else if (args.includes('--patch')) version = `${major}.${minor}.${patch + 1}`;

const next = { version, versionCode };
fs.writeFileSync(versionFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8');

console.log(`→ version.json updated: version=${version}, versionCode=${versionCode}`);
