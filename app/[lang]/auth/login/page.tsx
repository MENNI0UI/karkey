"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n-context";
import { Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/";
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	// Ensure login writes fast-path data and notifies header immediately
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const form = new FormData(e.target as HTMLFormElement);
			const email = String(form.get("email") ?? "").trim();
			const password = String(form.get("password") ?? "");

			const { signIn } = await import("next-auth/react");
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError(t("auth.login.failed"));
				return;
			}

			// CRITICAL: Remove auth:disabled flag to re-enable auth sync
			try {
				localStorage.removeItem("auth:disabled");
				localStorage.removeItem("auth:logout");
				if (typeof window !== "undefined") {
					delete (window as any).__preventAuthSync;
				}
			} catch { }

			// Notify header and other listeners to update immediately (fast-path)
			try {
				window.dispatchEvent(
					new CustomEvent("auth:changed", {
						detail: { action: "login" }
					})
				);
			} catch { }

			// Redirect to callback URL or home
			router.replace(callbackUrl);
			// Force a refresh to ensure all components see the new session
			router.refresh();
		} catch (err: any) {
			console.error("[login] error:", err);
			setError(t("auth.login.network_error"));
		} finally {
			setLoading(false);
		}
	}

	return (
		// use full viewport, ensure no extra top gap and allow slight vertical breathing on small screens
		<div className="min-h-screen flex items-center justify-center px-4 py-6 relative bg-[#f8fafc]">
			<Link href="/" aria-label="Karkey home" className="absolute top-8 left-8 md:left-20 z-50 transition-transform hover:scale-105 active:scale-95 duration-300">
				<span className="font-logo text-[32px] md:text-[36px] font-bold leading-none tracking-tight text-[#B8071C] select-none whitespace-nowrap drop-shadow-sm">
					Karkey
				</span>
			</Link>

			{/* Container with shadow - Wavy top, Square bottom */}
			<div className="w-full max-w-[480px] relative drop-shadow-[0_45px_90px_rgba(0,0,0,0.08)] group transition-all duration-500">
				{/* The Wavy Clipped Card - Refined Top Wave, Sharp Bottom */}
				<div
					className="bg-white border-0 rounded-t-[4rem] rounded-b-none pt-36 pb-16 px-10 md:px-14 relative transition-all duration-700"
					style={{
						clipPath: 'path("M 0 50 C 120 -10 360 110 480 50 L 480 2000 L 0 2000 Z")',
					}}
				>
					{/* Red Star Ornament (Magical Sparkle) */}
					<div className="absolute top-14 left-10 md:left-12 z-20 animate-pulse duration-&lsqb;3000ms&rsqb;">
						<Sparkles className="w-6 h-6 text-[#B8071C] drop-shadow-[0_0_8px_rgba(184,7,28,0.4)]" />
					</div>
					{/* Title and Subtitle - positioned clearly in the white area */}
					<div className="mb-12 text-center relative z-10">
						<h2 className="text-4xl font-poster font-bold font-serif text-[#103090] mb-3 tracking-tight">
							{t("auth.login.title")}
						</h2>
						<p className="text-[#94a3b8] text-lg font-light tracking-wide">{t("auth.login.subtitle")}</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-8 relative z-10">
						{error && (
							<Alert className="bg-red-50 border-red-100 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
								<AlertDescription className="text-red-800 text-center font-medium tracking-wide italic">{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-6">
							<div className="space-y-2 group/input">
								<label
									htmlFor="email"
									className="text-[11px] font-bold text-[#103090]/40 uppercase tracking-[0.2em] ml-7"
								>
									{t("auth.login.email_placeholder")}
								</label>
								<div className="relative">
									<Input
										id="email"
										type="email"
										placeholder="john@example.com"
										name="email"
										required
										className="border-gray-100 bg-[#f8fafc]/30 rounded-[2.4rem] h-14 px-8 text-lg text-[#103090] placeholder:text-gray-300 focus:border-[#B8071C]/20 focus:bg-white focus:ring-8 focus:ring-[#B8071C]/5 transition-all duration-500 shadow-sm hover:border-gray-200"
									/>
								</div>
							</div>

							<div className="space-y-2 group/input">
								<label
									htmlFor="password"
									className="text-[11px] font-bold text-[#103090]/40 uppercase tracking-[0.2em] ml-7"
								>
									{t("auth.login.password_placeholder")}
								</label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="••••••••"
										name="password"
										required
										className="border-gray-100 bg-[#f8fafc]/30 rounded-[2.4rem] h-14 px-8 text-lg text-[#103090] placeholder:text-gray-300 focus:border-[#B8071C]/20 focus:bg-white focus:ring-8 focus:ring-[#B8071C]/5 transition-all duration-500 shadow-sm hover:border-gray-200 pe-16"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute end-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#B8071C] transition-all duration-300 p-1"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-[#B8071C] to-[#d90a2c] hover:from-[#910515] hover:to-[#b8071c] text-white rounded-[2.2rem] h-14 text-lg font-bold tracking-wide transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_-10px_rgba(184,7,28,0.3)] active:scale-[0.98] shadow-xl shadow-red-900/10 border-0"
							disabled={loading}
						>
							{loading ? (
								<span className="flex items-center gap-2">
									<span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									{t("common.loading")}...
								</span>
							) : (
								t("auth.login.submit")
							)}
						</Button>
						<div className="text-center pt-2">
							<p className="text-[#94a3b8] font-medium">
								{t("auth.login.no_account")}{" "}
								<Link
									href="/auth/register"
									className="text-[#B8071C] hover:text-[#910515] font-bold hover:underline decoration-2 underline-offset-4 transition-all"
								>
									{t("auth.login.signup")}
								</Link>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

