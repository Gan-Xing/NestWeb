const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const i18nDir = path.join(root, 'src', 'i18n');
const allowedLocales = ['en', 'zh'];

function listEntries(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.'));
}

function listJsonFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(prefix, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listJsonFiles(fullPath, relativePath);
    }

    return entry.isFile() && entry.name.endsWith('.json') ? [relativePath] : [];
  });
}

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(child, nextPrefix);
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compareArrays(label, left, right) {
  const missingInRight = left.filter((item) => !right.includes(item));
  const missingInLeft = right.filter((item) => !left.includes(item));
  return { label, missingInRight, missingInLeft };
}

function compareLocaleFile(relativeFile) {
  const zhKeys = flattenKeys(readJson(path.join(i18nDir, 'zh', relativeFile))).sort();
  const enKeys = flattenKeys(readJson(path.join(i18nDir, 'en', relativeFile))).sort();
  return compareArrays(relativeFile, zhKeys, enKeys);
}

function main() {
  const entries = listEntries(i18nDir);
  const unexpected = entries.filter((entry) => !allowedLocales.includes(entry));
  const missingLocales = allowedLocales.filter((locale) => !entries.includes(locale));

  const zhFiles = listJsonFiles(path.join(i18nDir, 'zh')).sort();
  const enFiles = listJsonFiles(path.join(i18nDir, 'en')).sort();
  const fileProblems = compareArrays('locale files', zhFiles, enFiles);
  const sharedFiles = zhFiles.filter((file) => enFiles.includes(file));
  const keyProblems = sharedFiles
    .map(compareLocaleFile)
    .filter(({ missingInRight, missingInLeft }) => missingInRight.length || missingInLeft.length);

  if (
    !unexpected.length &&
    !missingLocales.length &&
    !fileProblems.missingInRight.length &&
    !fileProblems.missingInLeft.length &&
    !keyProblems.length
  ) {
    console.log('i18n check passed: zh and en are the only supported backend locales and keys match.');
    return;
  }

  if (unexpected.length) {
    console.error(`Unexpected locale directories: ${unexpected.join(', ')}`);
  }
  if (missingLocales.length) {
    console.error(`Missing locale directories: ${missingLocales.join(', ')}`);
  }
  if (fileProblems.missingInRight.length) {
    console.error(`Missing in en: ${fileProblems.missingInRight.join(', ')}`);
  }
  if (fileProblems.missingInLeft.length) {
    console.error(`Missing in zh: ${fileProblems.missingInLeft.join(', ')}`);
  }
  for (const problem of keyProblems) {
    if (problem.missingInRight.length) {
      console.error(`[${problem.label}] Missing in en: ${problem.missingInRight.join(', ')}`);
    }
    if (problem.missingInLeft.length) {
      console.error(`[${problem.label}] Missing in zh: ${problem.missingInLeft.join(', ')}`);
    }
  }

  process.exit(1);
}

main();
