"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"
import { useParams } from "next/navigation";

export default function NotFound() {
    const params = useParams();
    const lang = (params?.lang as string) || "en";

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-4 bg-gray-100 rounded-full text-gray-600">
                    <FileQuestion size={56} />
                </div>
                <h2 className="text-4xl font-bold tracking-tight">404</h2>
                <p className="text-xl font-semibold">Page Not Found</p>
                <p className="text-muted-foreground max-w-md">
                    The page you are looking for does not exist or has been moved.
                </p>
            </div>
            <Button asChild size="lg" className="mt-4">
                <Link href={`/${lang}`}>Return Home</Link>
            </Button>
        </div>
    )
}
