const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = process.argv[2];
const DEST_DIR = path.join(__dirname, '../public/icons');

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

async function generateIcons() {
    try {
        console.log(`Generating icons from ${SOURCE_IMAGE}...`);

        await sharp(SOURCE_IMAGE)
            .resize(192, 192)
            .toFile(path.join(DEST_DIR, 'icon-192x192.png'));

        await sharp(SOURCE_IMAGE)
            .resize(512, 512)
            .toFile(path.join(DEST_DIR, 'icon-512x512.png'));

        console.log('Icons generated successfully!');
    } catch (err) {
        console.error('Error generating icons:', err);
    }
}

generateIcons();
