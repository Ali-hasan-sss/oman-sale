#!/usr/bin/env node
/* eslint-disable no-console */
// Stops Gradle daemons before prebuild --clean (avoids EBUSY on Windows).

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const androidDir = path.resolve(__dirname, '..', 'android');
const gradlew = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(gradlew)) {
  console.log('→ No android/ project yet — skip Gradle stop');
  process.exit(0);
}

console.log('→ Stopping Gradle daemons before prebuild...');
const result = spawnSync(gradlew, ['--stop'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.status !== 0) {
  console.warn('→ gradlew --stop exited with code', result.status ?? 'unknown');
}

// Brief pause so Windows releases file handles on android/.
if (process.platform === 'win32') {
  spawnSync('powershell', ['-Command', 'Start-Sleep -Seconds 2'], { stdio: 'ignore' });
}

console.log('→ Gradle stop complete');
