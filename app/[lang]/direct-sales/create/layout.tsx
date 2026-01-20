import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Create Direct Sale - Karkey",
}

export default function CreateDirectSaleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
