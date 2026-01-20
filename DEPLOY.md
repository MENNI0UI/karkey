# 🚀 Karkey Deployment Guide (VPS)

This guide explains how to deploy Karkey to a VPS (Ubuntu/Debian recommended) using PM2 and **pnpm**.

## Prerequisites

1.  **Node.js (v18+)**: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs`
2.  **PM2**: `npm install -g pm2`
3.  **pnpm**: `npm install -g pnpm`
4.  **Git**: `sudo apt install git`
5.  **Database**: A running MySQL/MariaDB instance.

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

## 4. Install & Build (Critical Step)

Navigate to the project directory and run:

\`\`\`bash
pnpm install
pnpm build
\`\`\`

> ⚠️ **Warning:** Without `pnpm build`, the server will fail with 500 errors.

## 5. Database Migration

Run migrations to set up your production database schema:

\`\`\`bash
npx prisma migrate deploy
\`\`\`

## 6. Start with PM2

Use the included ecosystem file to start the app (Direct Binary mode for maximum stability):

\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

## 7. Configuration Notes

- **Port**: The app runs on port `3000` by default (managed in `ecosystem.config.js`). 
- **Nginx**: Use Nginx as a reverse proxy to handle SSL and forward traffic to port 3000.

## 8. Update Application

To update the app later:

\`\`\`bash
git pull
pnpm install
pnpm build
pm2 restart karkey-app
\`\`\`

## 🌀 Separation of Concerns

- **Source Code**: Managed via Git.
- **Build/Cache**: Generated locally on the VPS (ignored by Git).
- **Uploads**: Stored in \`public/uploads\` (excluded from Git).
