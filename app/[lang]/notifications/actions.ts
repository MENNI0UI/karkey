"use server"

import prisma from "@/lib/prisma"

export async function getNotificationsForUser(userId: number) {
	// returns an array of { id, user_id, title, message, type, is_read, created_at }
	try {
		const notifications = await prisma.notifications.findMany({
			where: { user_id: userId },
			select: {
				id: true,
				user_id: true,
				title: true,
				message: true,
				type: true,
				is_read: true,
				created_at: true
			},
			orderBy: { created_at: "desc" }
		})

		return notifications
	} catch (err) {
		console.error("[notifications/actions] getNotificationsForUser error:", err)
		return []
	}
}
