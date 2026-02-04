const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', 'globals.css');
const cleanContentPath = path.join(process.cwd(), 'app', 'hero-opt.css');

console.log('Reading:', filePath);

try {
    // Read as buffer to avoid encoding issues initially
    let buffer = fs.readFileSync(filePath);
    let content = buffer.toString('utf8');

    // Find the point before we messed up. 
    // We messed up around "/* PERFORMANCE: Zero-Runtime Hero Background" (or the emoji version)
    // Let's find the last known good line. 
    // Looking at the view_file from earlier, line 1284 was "}" (end of @layer utilities or similar) or close to it.
    // The previous view_file ended at line 1280ish? No, wait.

    // I'll search for the marker of my appended text and truncate BEFORE it.
    const markers = [
        '/* PERFORMANCE:',
        '/* ⚡ PERFORMANCE:',
        '.hero-static-bg'
    ];

    let truncateIndex = -1;
    for (const marker of markers) {
        const idx = content.indexOf(marker);
        if (idx !== -1) {
            console.log(`Found marker: "${marker}" at index ${idx}`);
            // If we found it, use the earliest one
            if (truncateIndex === -1 || idx < truncateIndex) {
                truncateIndex = idx;
            }
        }
    }

    // Also check for the corrupted chars if possible (optional)

    if (truncateIndex !== -1) {
        console.log(`Truncating at index ${truncateIndex}`);
        content = content.substring(0, truncateIndex);
    } else {
        console.log('No marker found. Maybe file is already clean or very messed up. appending anyway? No, verify first.');
        // If we didn't find our markers, maybe we should just confirm if the file ends with a }
    }

    // Clean up whitespace at end
    content = content.trim();
    if (!content.endsWith('}')) {
        // content += '\n}'; // unsafe if it wasn't supposed to end
    }

    // Now read the clean content we want to append
    let cleanCSS = fs.readFileSync(cleanContentPath, 'utf8');
    // Ensure no emojis in cleanCSS (just in case)
    cleanCSS = cleanCSS.replace(/⚡/g, '');

    const newContent = content + '\n\n' + cleanCSS;

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Aggressive fix applied.');

} catch (e) {
    console.error('Error:', e);
}
