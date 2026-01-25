const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, '../public/zellige.png');
const outputFile = path.join(__dirname, '../public/zellige.webp');

async function optimizeImage() {
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file not found at ${inputFile}`);
        process.exit(1);
    }

    const initialSize = fs.statSync(inputFile).size;
    console.log(`Initial size (PNG): ${(initialSize / 1024 / 1024).toFixed(2)} MB`);

    try {
        await sharp(inputFile)
            .webp({ quality: 80, effort: 6 })
            .toFile(outputFile);

        const finalSize = fs.statSync(outputFile).size;
        console.log(`Final size (WebP): ${(finalSize / 1024).toFixed(2)} KB`);
        console.log(`Reduction: ${(((initialSize - finalSize) / initialSize) * 100).toFixed(2)}%`);
        console.log(`Success: Asset optimized and saved to ${outputFile}`);
    } catch (error) {
        console.error('Error optimizing image:', error);
        process.exit(1);
    }
}

optimizeImage();
