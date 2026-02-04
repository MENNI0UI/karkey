const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', 'globals.css');
console.log('Reading:', filePath);

try {
    let content = fs.readFileSync(filePath, 'utf8'); // Try utf8 first

    // If that worked, replace the emoji
    if (content.includes('⚡')) {
        console.log('Found emoji, removing...');
        content = content.replace(/⚡/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed utf8 content.');
    } else {
        // Maybe it wasn't utf8 when read? 
        // If the problematic append was done with `type`, it might have been UTF-16LE appended to UTF-8
        // which creates a mess.
        console.log('No emoji found in utf8 read. Checking for binary mess...');
    }
} catch (e) {
    console.error('Error reading utf8:', e.message);
    // If regular read fails, we might need to handle mixed encoding stripping
    // But let's hope it's valid enough for Node to read.
}
