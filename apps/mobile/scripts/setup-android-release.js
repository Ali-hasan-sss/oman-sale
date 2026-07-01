#!/usr/bin/env node
/* eslint-disable no-console */
// Patches the generated Android project for release signing and copies the keystore.
// Run after `npx expo prebuild -p android`.

const fs = require('node:fs');
const path = require('node:path');

const mobileRoot = path.resolve(__dirname, '..');
const androidApp = path.join(mobileRoot, 'android', 'app');
const buildGradle = path.join(androidApp, 'build.gradle');
const gradleProps = path.join(mobileRoot, 'android', 'gradle.properties');
const credentialsPath = path.join(mobileRoot, 'credentials.json');
const keystoreSrc = path.join(mobileRoot, 'credentials', 'omansale-release.keystore');
const keystoreDest = path.join(androidApp, 'omansale-release.keystore');

if (!fs.existsSync(buildGradle)) {
  console.error('android/app/build.gradle not found — run expo prebuild first.');
  process.exit(1);
}

if (!fs.existsSync(credentialsPath)) {
  console.error('credentials.json not found — run npm run keystore:generate first.');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const keystore = credentials.android?.keystore;
if (!keystore) {
  console.error('credentials.json is missing android.keystore section.');
  process.exit(1);
}

fs.copyFileSync(keystoreSrc, keystoreDest);
console.log('→ Copied release keystore to android/app/');

let gradle = fs.readFileSync(buildGradle, 'utf8');

if (!gradle.includes('OMANSALE_UPLOAD_STORE_FILE')) {
  gradle = gradle.replace(
    `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`,
    `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('OMANSALE_UPLOAD_STORE_FILE')) {
                storeFile file(OMANSALE_UPLOAD_STORE_FILE)
                storePassword OMANSALE_UPLOAD_STORE_PASSWORD
                keyAlias OMANSALE_UPLOAD_KEY_ALIAS
                keyPassword OMANSALE_UPLOAD_KEY_PASSWORD
            }
        }
    }`
  );

  gradle = gradle.replace(
    `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`,
    `        release {
            signingConfig project.hasProperty('OMANSALE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`
  );

  fs.writeFileSync(buildGradle, gradle, 'utf8');
  console.log('→ Patched android/app/build.gradle for release signing');
}

let props = fs.readFileSync(gradleProps, 'utf8');
const signingBlock = `
# Release signing (keystore copied into android/app)
OMANSALE_UPLOAD_STORE_FILE=omansale-release.keystore
OMANSALE_UPLOAD_KEY_ALIAS=${keystore.keyAlias}
OMANSALE_UPLOAD_STORE_PASSWORD=${keystore.keystorePassword}
OMANSALE_UPLOAD_KEY_PASSWORD=${keystore.keyPassword}
`;

if (!props.includes('OMANSALE_UPLOAD_STORE_FILE')) {
  fs.appendFileSync(gradleProps, signingBlock, 'utf8');
  console.log('→ Added signing properties to gradle.properties');
}

const kotlinStabilityBlock = `
# Avoid intermittent "Could not connect to Kotlin compile daemon" on Windows
kotlin.compiler.execution.strategy=in-process
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8
`;

if (!props.includes('kotlin.compiler.execution.strategy')) {
  fs.appendFileSync(gradleProps, kotlinStabilityBlock, 'utf8');
  console.log('→ Added Kotlin in-process compiler settings to gradle.properties');
}

if (props.includes('newArchEnabled=true')) {
  props = props.replace('newArchEnabled=true', 'newArchEnabled=false');
  fs.writeFileSync(gradleProps, props, 'utf8');
  console.log('→ Disabled newArchEnabled in gradle.properties');
}

if (!gradle.includes('root = file("../../")')) {
  gradle = gradle.replace(
    'react {',
    `react {
    root = file("../../")`
  );
  fs.writeFileSync(buildGradle, gradle, 'utf8');
  console.log('→ Set react.root to apps/mobile for monorepo bundling');
}

const envPath = path.join(mobileRoot, '.env');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('EXPO_NO_METRO_WORKSPACE_ROOT')) {
    envContent = `${envContent.trimEnd()}\nEXPO_NO_METRO_WORKSPACE_ROOT=1\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('→ Added EXPO_NO_METRO_WORKSPACE_ROOT=1 to .env (monorepo Metro root fix)');
  }
}

console.log('Android release setup complete.');
