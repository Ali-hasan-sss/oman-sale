#!/usr/bin/env node
/* eslint-disable no-console */
// Prints the SHA-1 / SHA-256 fingerprints of the local release keystore.
// Use the SHA-1 in Firebase Console > Project settings > Your apps > Android
// (required for Google sign-in and some FCM features).
//
// Usage:
//   node scripts/keystore-fingerprint.js
// Reads keystore path + passwords from credentials.json.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const credentialsPath = path.join(projectRoot, 'credentials.json');

if (!fs.existsSync(credentialsPath)) {
  console.error('\n✖ credentials.json not found. Run: npm run keystore:generate\n');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const keystore = credentials.android?.keystore;
if (!keystore?.keystorePath) {
  console.error('\n✖ credentials.json missing android.keystore.keystorePath\n');
  process.exit(1);
}

const keystorePath = path.resolve(projectRoot, keystore.keystorePath);
if (!fs.existsSync(keystorePath)) {
  console.error(`\n✖ Keystore file not found at ${keystorePath}\n`);
  process.exit(1);
}

let output = '';
try {
  output = execFileSync(
    'keytool',
    ['-list', '-v', '-keystore', keystorePath, '-alias', keystore.keyAlias, '-storepass', keystore.keystorePassword],
    { encoding: 'utf8' }
  );
} catch (error) {
  console.error('\n✖ keytool failed:', error.message);
  process.exit(1);
}

const grab = (label) => {
  const match = output.match(new RegExp(`${label}:\\s*([0-9A-Fa-f:]+)`));
  return match ? match[1] : '(not found)';
};

console.log('\n=== Keystore fingerprints ===');
console.log('Keystore :', keystorePath);
console.log('Alias    :', keystore.keyAlias);
console.log('SHA1     :', grab('SHA1'));
console.log('SHA-256  :', grab('SHA-256') === '(not found)' ? grab('SHA256') : grab('SHA-256'));
console.log('\nAdd the SHA1 (and SHA-256) in Firebase Console:');
console.log('Project settings > Your apps > Android (com.omansale.mobile) > Add fingerprint');
console.log('Then re-download google-services.json.\n');
