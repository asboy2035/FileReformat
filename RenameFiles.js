#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const LAST_TASK_FILE = path.resolve(__dirname, 'LastTask.json');

let args = process.argv.slice(2);

// Check if continuing previous task
let continueTask = args.includes('--continue');
let folder, mode, format;

// If continuing, read LastTask.json
if (continueTask) {
  if (!fs.existsSync(LAST_TASK_FILE)) {
    console.log('No LastTask.json found to continue.');
    process.exit(1);
  }
  const task = JSON.parse(fs.readFileSync(LAST_TASK_FILE, 'utf8'));
  folder = task.directory;
  format = task.format;
  mode = '--rename';
} else {
  folder = args[0];
  mode = args.find(a => a === '--show' || a === '--rename');
  const formatArg = args.find(a => a.startsWith('--format='));
  format = formatArg ? formatArg.split('=')[1].toLowerCase() : 'pascal';

  if (!folder || !mode) {
    console.log('Usage: node RenameFiles.js <folder> --show|--rename [--format=pascal|snake|dash|camel|screaming] or --continue');
    process.exit(1);
  }
}

// Save task for continuation if showing
if (mode === '--show' && !continueTask) {
  fs.writeFileSync(LAST_TASK_FILE, JSON.stringify({ directory: folder, format }, null, 2));
}

function splitWords(name) {
  return name
    .split(/[_\-.]/g)
    .map(part => part
      .split(/(?=[A-Z])/g)
      .map(w => w.toLowerCase())
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

const EXT_MAP = { '.JPG': '.jpeg', '.JPEG': '.jpeg', '.PNG': '.png', '.GIF': '.gif', '.TIFF': '.tiff', '.BMP': '.bmp' };
function normalizeExtension(ext) { if (!ext) return ''; const upper = ext.toUpperCase(); return EXT_MAP[upper] || ext.toLowerCase(); }

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

function walk(dir) {
  let results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.name.startsWith('.')) return;
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
    grouped[dir].forEach(f => console.log(`${f.old} → ${f.new}`));
    console.log('');
  }
  console.log(`Preview saved! Run "node RenameFiles.js --continue" to rename files.`);
} else if (mode === '--rename') {
  // prompt for confirmation
  const readline = require('readline-sync');
  console.log(`Ready to rename ${files.length} files in ${folder} using format "${format}".`);
  const confirm = readline.question('Confirm? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Aborted.');
    process.exit(0);
  }

  for (const dir in grouped) {
    grouped[dir].forEach(f => {
      const oldPath = path.join(dir, f.old);
      const newPath = path.join(dir, f.new);
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${oldPath} → ${newPath}`);
    });
  }
  // delete LastTask.json after completing
  if (fs.existsSync(LAST_TASK_FILE)) fs.unlinkSync(LAST_TASK_FILE);
  console.log('All done!');
}
