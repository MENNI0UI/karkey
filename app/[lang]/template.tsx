// "use client" - Removed as we don't need hooks anymore for simple CSS animation

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
        >
            {children}
        </div>
    )
}
