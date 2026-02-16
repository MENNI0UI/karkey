const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.error('Error: GOOGLE_GENERATIVE_AI_API_KEY is not set');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.models) {
                console.log('Available Models:');
                response.models.map(m => m.name).filter(name => name.includes('gemini')).forEach(name => {
                    console.log(name.replace('models/', ''));
                });
            } else {
                console.log('Error listing models:', JSON.stringify(response, null, 2));
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
        }
    });

}).on('error', (err) => {
    console.error('Error making request:', err.message);
});
