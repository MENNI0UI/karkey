"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"
import { resetPasswordWithRecoveryKey } from "./actions"

export default function ForgotPasswordPage() {
    const [recoveryKey, setRecoveryKey] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<{
        adminName: string
        newRecoveryKey: string
    } | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!recoveryKey.trim()) {
            setError("Recovery key is required")
            return
        }

        if (!newPassword.trim()) {
            setError("New password is required")
            return
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)
        try {
            const result = await resetPasswordWithRecoveryKey(recoveryKey.trim(), newPassword)
            if (result.success && result.newRecoveryKey) {
                setSuccess({
                    adminName: result.adminName || "Admin",
                    newRecoveryKey: result.newRecoveryKey
                })
            } else {
                setError(result.error || "Failed to reset password")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleCopyKey = () => {
        if (success?.newRecoveryKey) {
            navigator.clipboard.writeText(success.newRecoveryKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <Card className="border-0 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#B8071C] to-[#7d0866] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-[#103090]">
                            {success ? "Success" : "CEO Recovery"}
                        </CardTitle>
                        <p className="text-slate-500 mt-2">
                            {success
                                ? "Password has been successfully reset"
                                : "Enter your CEO recovery key to reset your password"
                            }
                        </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {success ? (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-green-700 mb-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Success!</span>
                                    </div>
                                    <p className="text-green-600 text-sm">
                                        Password for <strong>{success.adminName}</strong> has been reset.
                                    </p>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-amber-700 text-sm font-medium mb-2">
                                        ⚠️ New Recovery Key (Save this securely!)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-white border border-amber-300 rounded px-3 py-2 text-xs font-mono break-all">
                                            {success.newRecoveryKey}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyKey}
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-amber-600 text-xs mt-2">
                                        Your old recovery key is no longer valid. Store this new key in a safe place.
                                    </p>
                                </div>

                                <Link href="/admin/login">
                                    <Button className="w-full bg-[#B8071C] hover:bg-[#910515]">
                                        Go to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="recoveryKey">Recovery Key</Label>
                                    <Input
                                        id="recoveryKey"
                                        type="text"
                                        value={recoveryKey}
                                        onChange={(e) => setRecoveryKey(e.target.value)}
                                        placeholder="Enter your 64-character recovery key"
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-slate-500">
                                        This key was provided when your admin account was created.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#B8071C] hover:bg-[#6B0F28]"
                                >
                                    {loading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-slate-500 text-sm mt-6">
                    Don't have a recovery key?{" "}
                    <span className="text-slate-700">Contact your system administrator.</span>
                </p>
            </div>
        </div>
    )
}
