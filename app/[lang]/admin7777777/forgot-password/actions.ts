"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function resetPasswordWithRecoveryKey(recoveryKey: string, newPassword: string) {
    if (!recoveryKey || recoveryKey.length < 32) {
        return { success: false, error: "Invalid recovery key" }
    }

    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" }
    }

    try {
        // Find admin by recovery key (must be a CEO)
        const admin = await prisma.admins.findFirst({
            where: {
                recovery_key: recoveryKey,
                role: "ceo"
            }
        })

        if (!admin) {
            return { success: false, error: "Invalid recovery key or unauthorized role. Please check and try again." }
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Generate a new recovery key (old one is now invalid)
        const { randomBytes } = await import("crypto")
        const newRecoveryKey = randomBytes(32).toString("hex")

        // Update the admin
        await prisma.admins.update({
            where: { id: admin.id },
            data: {
                password_hash: hashedPassword,
                recovery_key: newRecoveryKey,
                password_version: { increment: 1 },
                updated_at: new Date()
            }
        })

        return {
            success: true,
            newRecoveryKey,
            adminName: `${admin.prenom} ${admin.nom}`,
            message: "Password reset successfully! A new recovery key has been generated."
        }
    } catch (error) {
        console.error("[v0] Error resetting password with recovery key:", error)
        return { success: false, error: "Failed to reset password. Please try again." }
    }
}
