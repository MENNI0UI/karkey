
const { SignJWT } = require('jose');
const fs = require('fs');
const path = require('path');

function getEnvSecret() {
    try {
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/JWT_SECRET=(.*)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
    } catch (e) {
        console.error("Failed to read .env:", e);
    }
    return "dev-secret-change-in-prod";
}

async function main() {
    const rawSecret = getEnvSecret();
    console.log("Using Secret:", rawSecret ? rawSecret.slice(0, 5) + "..." : "default");
    const secret = new TextEncoder().encode(rawSecret);
    const alg = 'HS256';

    // Use valid user from DB (id: 1)
    const jwt = await new SignJWT({ userId: 1, email: "Abdelstefin07@gmail.com" })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);

    console.log("Generated Token:", jwt);

    // Test /api/auth/me
    console.log("\nTesting /api/auth/me...");
    const res = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
            'Cookie': `auth_token=${jwt}`
        }
    });

    console.log("Status:", res.status);
    const text = await res.text();
    if (res.status === 200) {
        console.log("Success JSON:", text.slice(0, 500));
    } else {
        console.log("Error Body:", text.slice(0, 2000));
    }

    // Test /api/notifications/unread-count
    console.log("\nTesting /api/notifications/unread-count...");
    const res2 = await fetch('http://localhost:3000/api/notifications/unread-count', {
        headers: {
            'Cookie': `auth_token=${jwt}`
        }
    });

    console.log("Status:", res2.status);
    const text2 = await res2.text();
    if (res2.status === 200) {
        console.log("Success JSON:", text2.slice(0, 500));
    } else {
        console.log("Error Body:", text2.slice(0, 2000));
    }
}

main().catch(console.error);
