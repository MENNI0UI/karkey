import fs from 'fs';
import path from 'path';

async function verify() {
    const testFile = 'test-image-fix.txt';
    const publicUploads = path.join(process.cwd(), 'public', 'uploads', 'vehicles');
    const filePath = path.join(publicUploads, testFile);

    console.log('--- Verification Script ---');

    // 1. Ensure directory exists
    if (!fs.existsSync(publicUploads)) {
        console.log('Creating directory:', publicUploads);
        fs.mkdirSync(publicUploads, { recursive: true });
    }

    // 2. Write a test file
    const content = 'This is a test file for dynamic serving verification ' + Date.now();
    fs.writeFileSync(filePath, content);
    console.log('Test file created at:', filePath);

    console.log('\nVerification complete. Please check the following URLs in your browser (when server is running):');
    console.log(`1. http://localhost:3000/api/uploads/vehicles/${testFile}`);
    console.log(`2. http://localhost:3000/uploads/vehicles/${testFile}`);
    console.log('\nBoth should return the same content without a server restart.');

    // Cleanup instructions
    console.log('\nTo cleanup: rm ' + filePath);
}

verify().catch(console.error);
