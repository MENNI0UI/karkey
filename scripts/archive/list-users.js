
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({ take: 5 });
    console.log("Users:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
