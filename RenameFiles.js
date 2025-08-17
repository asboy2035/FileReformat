#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const folder = args[0];
const mode = args.find(a => a === '--show' || a === '--rename');
const formatArg = args.find(a => a.startsWith('--format='));
const format = formatArg ? formatArg.split('=')[1].toLowerCase() : 'pascal';

if (!folder || !mode) {
  console.log('Usage: node RenameFiles.js <folder> --show|--rename [--format=pascal|snake|dash|camel|screaming]');
  process.exit(1);
}

// extension normalization map
const EXT_MAP = {
  '.JPG': '.jpeg',
  '.JPEG': '.jpeg',
  '.PNG': '.png',
  '.GIF': '.gif',
  '.TIFF': '.tiff',
  '.BMP': '.bmp',
};

function normalizeExtension(ext) {
  if (!ext) return '';
  const upper = ext.toUpperCase();
  return EXT_MAP[upper] || ext.toLowerCase();
}

// formatting functions
function splitWords(name) {
  return name
    .split(/[_\-.]/g) // split on common separators
    .map(part => part
      .split(/(?=[A-Z])/g) // split before uppercase letters
      .map(w => w.toLowerCase()) // normalize fully uppercase words
      .filter(Boolean)
    )
    .flat()
    .filter(Boolean);
}

function toPascalCase(name) {
  return splitWords(name)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function toCamelCase(name) {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(name) {
  return splitWords(name)
    .map(w => w.toLowerCase())
    .join('_');
}

function toDashCase(name) {
  return splitWords(name)
    .map(w => w.toLowerCase())
    .join('-');
}

function toScreamingCase(name) {
  return splitWords(name)
    .map(w => w.toUpperCase())
    .join('_');
}

function formatName(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const newExt = normalizeExtension(ext);

  let newBase;
  switch(format) {
    case 'snake': newBase = toSnakeCase(base); break;
    case 'dash': newBase = toDashCase(base); break;
    case 'camel': newBase = toCamelCase(base); break;
    case 'screaming': newBase = toScreamingCase(base); break;
    case 'pascal':
    default:
      newBase = toPascalCase(base);
  }

  return newBase + newExt;
}

// recursive walk
function walk(dir) {
  let results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.name.startsWith('.')) return; // ignore dotfiles/folders
    if (dirent.isDirectory()) {
      results = results.concat(walk(res));
    } else {
      results.push(res);
    }
  });
  return results;
}

const files = walk(folder);

// group by directory
const grouped = {};
files.forEach(file => {
  const dir = path.dirname(file);
  const base = path.basename(file);
  const newName = formatName(base);

  if (file !== path.join(dir, newName)) {
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push({ old: base, new: newName });
  }
});

// output
if (mode === '--show') {
  for (const dir in grouped) {
    console.log(`directory: ${dir}`);
    console.log('files:');
    grouped[dir].forEach(f => {
      console.log(`${f.old} → ${f.new}`);
    });
    console.log('');
  }
} else if (mode === '--rename') {
  for (const dir in grouped) {
    grouped[dir].forEach(f => {
      const oldPath = path.join(dir, f.old);
      const newPath = path.join(dir, f.new);
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${oldPath} → ${newPath}`);
    });
  }
}
