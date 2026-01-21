"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnsubscribePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid unsubscribe link");
            return;
        }

        const unsubscribe = async () => {
            try {
                const res = await fetch(`/api/reminders/unsubscribe?token=${encodeURIComponent(token)}`);
                const data = await res.json();

                if (data.success) {
                    if (data.alreadyUnsubscribed) {
                        setStatus("already");
                        setMessage("You have already unsubscribed from auction reminders.");
                    } else {
                        setStatus("success");
                        setMessage("You have been successfully unsubscribed from auction reminders.");
                    }
                } else {
                    setStatus("error");
                    setMessage(data.error || "Something went wrong");
                }
            } catch {
                setStatus("error");
                setMessage("Failed to process your request. Please try again.");
            }
        };

        unsubscribe();
    }, [token]);

    return (
        <div className="min-h-[calc(100vh-var(--site-header-height,76px))] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
            >
                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto text-[#00A651] animate-spin mb-6" />
                        <h1 className="text-2xl font-serif text-slate-800 mb-2">Processing...</h1>
                        <p className="text-slate-500">Please wait while we process your request.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <m.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <CheckCircle className="w-16 h-16 mx-auto text-[#00A651] mb-6" />
                        </m.div>
                        <h1 className="text-2xl font-serif text-slate-800 mb-2">Unsubscribed</h1>
                        <p className="text-slate-500 mb-6">{message}</p>
                        <Link href="/auctions">
                            <Button className="bg-[#00A651] hover:bg-[#008C44] text-white rounded-xl">
                                Back to Auctions
                            </Button>
                        </Link>
                    </>
                )}

                {status === "already" && (
                    <>
                        <m.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <CheckCircle className="w-16 h-16 mx-auto text-amber-500 mb-6" />
                        </m.div>
                        <h1 className="text-2xl font-serif text-slate-800 mb-2">Already Unsubscribed</h1>
                        <p className="text-slate-500 mb-6">{message}</p>
                        <Link href="/auctions">
                            <Button className="bg-[#00A651] hover:bg-[#008C44] text-white rounded-xl">
                                Back to Auctions
                            </Button>
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <m.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
                        </m.div>
                        <h1 className="text-2xl font-serif text-slate-800 mb-2">Error</h1>
                        <p className="text-slate-500 mb-6">{message}</p>
                        <Link href="/auctions">
                            <Button variant="outline" className="rounded-xl">
                                Back to Auctions
                            </Button>
                        </Link>
                    </>
                )}
            </m.div>
        </div>
    );
}
