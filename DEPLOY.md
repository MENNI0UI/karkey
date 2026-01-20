# 🚀 Karkey Deployment Guide (VPS)

This guide explains how to deploy Karkey to a VPS (Ubuntu/Debian recommended) using PM2.

## Prerequisites

1.  **Node.js (v18+)**: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs`
2.  **PM2**: `npm install -g pm2`
3.  **Git**: `sudo apt install git`
4.  **Database**: A running MySQL/MariaDB instance.

## 1. Upgrade & Prepare

\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

## 2. Clone Repository

\`\`\`bash
git clone https://github.com/MENNI0UI/karkey.git
cd karkey
\`\`\`

## 3. Configure Environment

Create a `.env` file with your production secrets:

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

**Important:** Ensure \`DATABASE_URL\` and \`AUTH_SECRET\` are set correctly.

## 4. Install & Build

\`\`\`bash
npm install
npm run build
\`\`\`

## 5. Database Migration

Run migrations to set up your production database schema:

\`\`\`bash
npx prisma migrate deploy
\`\`\`

## 6. Start with PM2

Use the included ecosystem file to start the app (runs in fork mode for Next.js stability):

\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

## 7. Update Application

To update the app later:

\`\`\`bash
git pull
npm install
npm run build
pm2 restart karkey-app
\`\`\`

## 🌀 Separation of Concerns

- **Source Code**: Managed via Git.
- **Build/Cache**: generated locally on the VPS (ignored by Git).
- **Uploads**: Stored in \`public/uploads\` (excluded from Git).
- **Data**: Stored in your database.
