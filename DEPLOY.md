# 🚀 Karkey Deployment Guide (VPS)

This guide explains how to deploy Karkey to a VPS (Ubuntu/Debian recommended) using PM2 and **pnpm**.

## Prerequisites

1.  **Node.js (v18+)**: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs`
2.  **PM2**: `npm install -g pm2`
3.  **pnpm**: `npm install -g pnpm`
4.  **Git**: `sudo apt install git`
5.  **Database**: A running MySQL/MariaDB instance.

**Verify installation:**
\`\`\`bash
node -v
pnpm -v
pm2 -v
\`\`\`

## 1. Upgrade & Prepare

\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

## 2. Clone Repository

\`\`\`bash
# Use --depth=1 to minimize download size (optional)
git clone --depth=1 https://github.com/MENNI0UI/karkey.git
cd karkey
\`\`\`

## 3. Configure Environment

Create a `.env` file with your production secrets:

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

**Important:**
- Ensure \`DATABASE_URL\` and \`AUTH_SECRET\` are set correctly.
- ❌ **NEVER** commit \`.env\` file to GitHub.

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
# Only required if Prisma is used
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
- **Security**: PM2 processes should never be exposed directly to the internet.
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

## 📂 Project Structure (Production)

- \`app/\`: Next.js source code.
- \`backend/\`: API / scripts.
- \`public/uploads\`: Runtime uploads (ignored by Git).
- \`.next/\`: Build output (generated on VPS).

## 🔧 Troubleshooting

- **500 Error**: Ensure \`pnpm build\` was executed successfully.
- **Port already in use**: Check PM2 list or Nginx config.
- **App not starting**: Check logs with \`pm2 logs karkey-app\`.

## 🚀 Advanced Configuration (Roadmap)

To reach 100% production grade, consider implementing these next steps:

1.  **Nginx + SSL + HTTP/2**: Use Nginx as a reverse proxy in front of PM2 to handle HTTPS (Let's Encrypt) and serve static files (gzip/brotli).
2.  **Separate Backend**: If your backend grows, run it as a separate app in `ecosystem.config.js` (e.g., `karkey-api`).
3.  **Cloudflare R2**: improved performance and lower costs, offload image storage (`public/uploads`) to Cloudflare R2 or AWS S3.
4.  **CI/CD (GitHub Actions)**: Automate the deploy process so that `git push` triggers a build and deploy on your VPS automatically.
