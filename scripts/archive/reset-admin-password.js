// ============================================
// Emergency Admin Password Reset Script
// ============================================
// Usage: node scripts/reset-admin-password.js
// ============================================

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer)
        })
    })
}

async function main() {
    console.log('\n🔐 Emergency Admin Password Reset\n')
    console.log('='.repeat(40))

    try {
        // List all admins
        const admins = await prisma.admins.findMany({
            select: { id: true, nom: true, prenom: true, role: true }
        })

        if (admins.length === 0) {
            console.log('\n❌ No admins found in database.')
            return
        }

        console.log('\nAvailable admins:')
        admins.forEach((admin, index) => {
            console.log(`  ${index + 1}. ${admin.prenom} ${admin.nom} (${admin.role}) - ID: ${admin.id}`)
        })

        const selection = await question('\nEnter admin number to reset: ')
        const adminIndex = parseInt(selection) - 1

        if (isNaN(adminIndex) || adminIndex < 0 || adminIndex >= admins.length) {
            console.log('\n❌ Invalid selection.')
            return
        }

        const selectedAdmin = admins[adminIndex]
        console.log(`\n✓ Selected: ${selectedAdmin.prenom} ${selectedAdmin.nom}`)

        const newPassword = await question('Enter new password (min 6 chars): ')

        if (!newPassword || newPassword.length < 6) {
            console.log('\n❌ Password must be at least 6 characters.')
            return
        }

        const confirmPassword = await question('Confirm new password: ')

        if (newPassword !== confirmPassword) {
            console.log('\n❌ Passwords do not match.')
            return
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update the admin
        await prisma.admins.update({
            where: { id: selectedAdmin.id },
            data: {
                password_hash: hashedPassword,
                password_version: { increment: 1 }
            }
        })

        console.log('\n✅ Password reset successfully!')
        console.log(`   Admin: ${selectedAdmin.prenom} ${selectedAdmin.nom}`)
        console.log(`   Role: ${selectedAdmin.role}`)
        console.log('\n⚠️  Old sessions will be invalidated.')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
        rl.close()
    }
}

main()
