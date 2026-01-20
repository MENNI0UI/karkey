/**
 * Simple script: walk project files and remove lines that start with "// filepath:"
 * Usage: node ./scripts/strip-filepath-comments.js
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..') // project root
const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'] // file types to scan

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['.git', 'node_modules', '.next', 'dist'].includes(e.name)) continue
      walk(full)
      continue
    }
    if (!exts.includes(path.extname(full).toLowerCase())) continue
    try {
      let content = fs.readFileSync(full, 'utf8')
      const original = content
      // remove lines that exactly contain "// filepath:" followed by any text
      const cleaned = content
        .split(/\r?\n/)
        .filter(line => !line.trim().toLowerCase().startsWith('// filepath:'))
        .join('\n')
      if (cleaned !== original) {
        fs.writeFileSync(full, cleaned, 'utf8')
        console.log('Cleaned:', path.relative(root, full))
      }
    } catch (err) {
      // ignore binary/read errors
    }
  }
}

console.log('Scanning project for "// filepath:" comments...')
walk(root)
console.log('Done.')
