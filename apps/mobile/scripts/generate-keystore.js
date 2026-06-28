#!/usr/bin/env node
/* eslint-disable no-console */
// Generates a new Android release keystore + a matching credentials.json for
// local EAS builds (`eas build --local`). Safe to run once per app identity.
//
// Usage:
//   node scripts/generate-keystore.js
//   KEYSTORE_PASSWORD=secret KEY_PASSWORD=secret node scripts/generate-keystore.js
//
// Env overrides:
//   KEY_ALIAS (default: omansale)
//   KEYSTORE_PASSWORD / KEY_PASSWORD (default: random 24-char strings)
//   KEYSTORE_FILE (default: credentials/omansale-release.keystore)
//   DNAME (default: CN=Oman Sale, OU=Mobile, O=Oman Sale, L=Muscat, C=OM)

const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const credentialsDir = path.join(projectRoot, 'credentials');

const keyAlias = process.env.KEY_ALIAS || 'omansale';
const relativeKeystorePath = process.env.KEYSTORE_FILE || 'credentials/omansale-release.keystore';
const keystorePath = path.resolve(projectRoot, relativeKeystorePath);
const dname = process.env.DNAME || 'CN=Oman Sale, OU=Mobile, O=Oman Sale, L=Muscat, C=OM';

const randomSecret = () => crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, '').slice(0, 24);
const keystorePassword = process.env.KEYSTORE_PASSWORD || randomSecret();
const keyPassword = process.env.KEY_PASSWORD || keystorePassword;

if (fs.existsSync(keystorePath)) {
  console.error(`\n✖ Keystore already exists at ${keystorePath}`);
  console.error('  Refusing to overwrite. Delete it manually if you really want a new one.\n');
  process.exit(1);
}

fs.mkdirSync(credentialsDir, { recursive: true });

console.log('\n→ Generating Android release keystore...');
try {
  execFileSync(
    'keytool',
    [
      '-genkeypair',
      '-v',
      '-keystore',
      keystorePath,
      '-alias',
      keyAlias,
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-storepass',
      keystorePassword,
      '-keypass',
      keyPassword,
      '-dname',
      dname
    ],
    { stdio: 'inherit' }
  );
} catch (error) {
  console.error('\n✖ keytool failed. Ensure a JDK is installed and keytool is on PATH.');
  console.error(error.message);
  process.exit(1);
}

const credentials = {
  android: {
    keystore: {
      keystorePath: relativeKeystorePath,
      keystorePassword,
      keyAlias,
      keyPassword
    }
  }
};

const credentialsPath = path.join(projectRoot, 'credentials.json');
fs.writeFileSync(credentialsPath, `${JSON.stringify(credentials, null, 2)}\n`, 'utf8');

console.log('\n✔ Keystore created:', keystorePath);
console.log('✔ credentials.json written (gitignored).');

// Print SHA-1 / SHA-256 so they can be registered in Firebase immediately.
try {
  const listOutput = execFileSync(
    'keytool',
    ['-list', '-v', '-keystore', keystorePath, '-alias', keyAlias, '-storepass', keystorePassword],
    { encoding: 'utf8' }
  );
  const grab = (label) => {
    const match = listOutput.match(new RegExp(`${label}:\\s*([0-9A-Fa-f:]+)`));
    return match ? match[1] : '(not found)';
  };
  const sha256 = grab('SHA-256') === '(not found)' ? grab('SHA256') : grab('SHA-256');
  console.log('\n=== Fingerprints (add SHA1 in Firebase) ===');
  console.log('SHA1   :', grab('SHA1'));
  console.log('SHA-256:', sha256);
} catch {
  console.log('\n(could not read fingerprints; run: npm run keystore:fingerprint)');
}
console.log('\nKeep these safe — losing them means you cannot update the app on the Play Store:');
console.log(`  Key alias        : ${keyAlias}`);
console.log(`  Keystore password: ${keystorePassword}`);
console.log(`  Key password     : ${keyPassword}`);
console.log('\nNext: place google-services.json in apps/mobile/, then run:');
console.log('  npm run build:android:local\n');
