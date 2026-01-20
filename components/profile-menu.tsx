"use client"
import React from "react"

export type MenuSection = { id: string; label: string; count?: number }

export default function ProfileMenu({ sections = [], profilePicture, username, userId }: any) {
	return (
		<nav className="p-4">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-10 h-10 rounded-full bg-gray-200"></div>
				<div>{username ?? "User"}</div>
			</div>
			<ul className="space-y-2">
				{sections.map((s: MenuSection) => (
					<li key={s.id}><a href={`#${s.id}`} className="text-sm">{s.label}</a></li>
				))}
			</ul>
		</nav>
	)
}
