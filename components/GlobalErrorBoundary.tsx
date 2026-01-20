import React from "react"

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
export default GlobalErrorBoundary
