const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', 'globals.css');
const heroOptPath = path.join(process.cwd(), 'app', 'hero-opt.css');

console.log('Reading:', filePath);
const fileContent = fs.readFileSync(filePath, 'utf8');

// Split by lines
const lines = fileContent.split(/\r?\n/);
const cleanLines = [];

for (const line of lines) {
    // Filter out lines that look like our failed append or corruption
    if (line.includes('') || line.includes('/* ') || line.includes('PERFORMANCE:') || line.includes('hero-static-bg') || line.includes('text-shimmer-anim')) {
        console.log('Dropping corrupted/duplicate line:', line);
        continue;
    }
    cleanLines.push(line);
}

// Reassemble
let newContent = cleanLines.join('\n').trim();

// Append the GOOD hero-opt css
const heroOpt = fs.readFileSync(heroOptPath, 'utf8');
// remove emoji from heroOpt just to be absolutely safe
const safeHeroOpt = heroOpt.replace(/⚡/g, '');

newContent += '\n\n' + safeHeroOpt;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('File cleaned and repopulated.');
