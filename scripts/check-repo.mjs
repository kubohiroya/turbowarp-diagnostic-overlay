import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);
const errors = [];

const packageMetadata = JSON.parse(await readFile('package.json', 'utf8'));
const policy = JSON.parse(await readFile('repo-policy.json', 'utf8'));
const readme = await readFile('README.md', 'utf8');
const changelog = await readFile('CHANGELOG.md', 'utf8');
const license = await readFile('LICENSE', 'utf8');
const config = await readFile('src/config.ts', 'utf8');
const bundle = await readFile(policy.extension.standaloneBundle, 'utf8');
const compositionTypes = await readFile(policy.extension.compositionTypes, 'utf8');
const pages = [
  await readFile('docs/index.html', 'utf8'),
  await readFile('docs/ja/index.html', 'utf8')
];

checkPolicy();
checkPackageMetadata();
checkReadme();
checkChangelog();
checkLicense();
checkBundleMetadata();
await checkPackContents();

if (errors.length > 0) {
  throw new Error(`Repository policy check failed:\n- ${errors.join('\n- ')}`);
}

process.stdout.write('Repository policy is aligned.\n');

function checkPolicy() {
  if (policy.schemaVersion !== 1) errors.push('repo-policy.json schemaVersion must be 1');
  if (policy.productName !== 'TurboWarp-Diagnostic-Overlay') {
    errors.push('repo-policy.json productName must be TurboWarp-Diagnostic-Overlay');
  }
  if (policy.packageType !== 'extension-composition') {
    errors.push('repo-policy.json packageType must be extension-composition');
  }
  if (policy.licensePolicy !== 'mpl-2.0') errors.push('repo-policy.json licensePolicy must be mpl-2.0');
  if (policy.packageManager !== 'pnpm') errors.push('repo-policy.json packageManager must be pnpm');
  if (policy.homepage !== 'pages') errors.push('repo-policy.json homepage must record Pages as the user entrypoint');
  if (policy.node?.minimum !== '22.12.0') errors.push('repo-policy.json node.minimum must be 22.12.0');
}

function checkPackageMetadata() {
  for (const key of ['description', 'author', 'license', 'homepage', 'packageManager']) {
    if (typeof packageMetadata[key] !== 'string' || packageMetadata[key].trim().length === 0) {
      errors.push(`package.json ${key} must be a non-empty string`);
    }
  }
  if (packageMetadata.license !== 'MPL-2.0') errors.push('package.json license must be MPL-2.0');
  if (packageMetadata.homepage !== 'https://kubohiroya.github.io/turbowarp-diagnostic-overlay/') {
    errors.push('package.json homepage must point to the Pages user guide');
  }
  if (packageMetadata.engines?.node !== '>=22.12.0') {
    errors.push('package.json engines.node must be >=22.12.0');
  }
  if (packageMetadata.packageManager !== 'pnpm@11.11.0') {
    errors.push('package.json packageManager must pin pnpm@11.11.0');
  }
}

function checkReadme() {
  if (!readme.startsWith(`# ${policy.productName}\n`)) {
    errors.push('README.md H1 must match repo-policy.json productName');
  }
  const installLine = `pnpm add --save-exact ${packageMetadata.name}@${packageMetadata.version}`;
  const cdnUrl = `https://cdn.jsdelivr.net/npm/${packageMetadata.name}@${packageMetadata.version}/dist/diagnostic-overlay.js`;
  if (!readme.includes(installLine)) errors.push('README.md install example must match package version');
  if (!readme.includes(cdnUrl)) errors.push('README.md CDN URL must match package version');
  if (!readme.includes('SPDX-License-Identifier: MPL-2.0')) {
    errors.push('README.md License section must include the SPDX identifier');
  }
  for (const page of pages) {
    if (!page.includes(installLine) || !page.includes(cdnUrl)) {
      errors.push('Pages guides must match package version install and CDN examples');
    }
  }
}

function checkChangelog() {
  if (!changelog.includes(`## [${packageMetadata.version}]`)) {
    errors.push('CHANGELOG.md must contain the current package version section');
  }
}

function checkLicense() {
  if (!license.startsWith('Mozilla Public License Version 2.0\n==================================')) {
    errors.push('LICENSE must contain the Mozilla Public License Version 2.0 full text');
  }
  if (!license.includes('Exhibit A - Source Code Form License Notice')) {
    errors.push('LICENSE must include the MPL-2.0 Exhibit A text');
  }
}

function checkBundleMetadata() {
  if (!config.includes("license: 'MPL-2.0'")) {
    errors.push('src/config.ts license metadata must be MPL-2.0');
  }
  if (!bundle.includes('// License: MPL-2.0')) {
    errors.push('dist/diagnostic-overlay.js license metadata must be MPL-2.0');
  }
  if (!bundle.includes('// ID: kubohiroyadiagnosticoverlay')) {
    errors.push('dist/diagnostic-overlay.js must retain Diagnostic Overlay extension ID');
  }
  if (!compositionTypes.includes('createDiagnosticOverlayComposition')) {
    errors.push('dist/lib/composition.d.ts must retain Composition API types');
  }
}

async function checkPackContents() {
  const {stdout} = await execFileAsync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json']);
  const [pack] = JSON.parse(stdout);
  const files = new Set(pack.files.map((file) => file.path));
  for (const file of [
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    policy.extension.standaloneBundle,
    policy.extension.compositionTypes
  ]) {
    if (!files.has(file)) errors.push(`npm pack must include ${file}`);
  }
  if (pack.version !== packageMetadata.version) {
    errors.push('npm pack version must match package.json version');
  }
}
