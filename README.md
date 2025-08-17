# FileReformat 💖✨
FileReformat is a recursive file renaming utility that helps you **slay your messy file names**. 
It converts them into consistent formats, normalizes extensions, and gives you a preview before renaming anything.

## Features 🌟
```bash
node RenameFiles.js <directory-to-rename>
```
- Convert file names to different formats: `[--format=pascal|snake|dash|camel|screaming]`
  - `pascal` (default) → `MyFileName.txt`
  - `camel` → `myFileName.txt`
  - `snake` → `my_file_name.txt`
  - `dash` → `my-file-name.txt`
  - `screaming` → `MY_FILE_NAME.TXT`
- Normalizes file extensions by default (`JPG → jpeg`, `PNG → png`, etc.)
- Ignore dotfiles/folders to keep them safe (`.gitignore`, `.idea`)
- Preview changes before renaming: `--show`
- Rename files recursively: `--rename`

## Installation
Make sure you have [Node.js](https://nodejs.org/) installed.

```bash
git clone https://github.com/asboy2035/FileReformat
cd FileReformat
npm i
```
