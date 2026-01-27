"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import {
    CheckCircle,
    XCircle,
    Eye,
    Calendar,
    FileText,
    ZoomIn,
    X,
    AlertCircle,
    DollarSign,
    Mail,
    User,
    Shield,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n-context"

function formatImageSrc(base64String: string | null | undefined): string {
    if (!base64String) {
        return "/placeholder.svg?height=200&width=300"
    }

    // Remove any duplicate "data:image/jpeg;base64," prefixes
    let cleanedString = base64String
    const dataUrlPrefix = "data:image/jpeg;base64,"

    // Count how many times the prefix appears
    const prefixCount = (cleanedString.match(/data:image\/jpeg;base64,/g) || []).length

    if (prefixCount > 1) {
        // Remove all prefixes and add just one
        cleanedString = cleanedString.replace(/data:image\/jpeg;base64,/g, "")
        return `${dataUrlPrefix}${cleanedString}`
    }

    // If it's already a data URL, return as is
    if (cleanedString.startsWith("data:")) {
        return cleanedString
    }

    // If it's an external URL, return as is
    if (cleanedString.startsWith("http://") || cleanedString.startsWith("https://")) {
        return cleanedString
    }

    // Convert /uploads/ paths to /api/uploads/ for production serving
    // Next.js doesn't serve files added to public/ after build in production
    if (cleanedString.startsWith("/uploads/")) {
        return `/api${cleanedString}`
    }

    // Check for common image paths that might be missing a leading slash
    if (cleanedString.startsWith("uploads/")) {
        return `/api/${cleanedString}`
    }

    // If starts with /, return as is (other static files)
    if (cleanedString.startsWith("/")) {
        return cleanedString
    }

    // Check for common image extensions if it doesn't look like base64
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanedString)) {
        return cleanedString.startsWith("/") ? cleanedString : `/${cleanedString}`
    }

    // Otherwise, assume it's a base64 string and add the data URL prefix
    return `${dataUrlPrefix}${cleanedString}`
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return "just now"
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours}h ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
        return `${diffInDays}d ago`
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export interface PendingDirectSale {
    id: number
    user_id: number
    make: string
    model: string
    year: number
    mileage: number
    transmission: string
    fuel_type: string
    engine_size?: string | null
    doors?: string | null
    vehicle_condition: string
    location: string
    description: string
    price: string | number
    carte_grise_url: string
    special_features?: string | null
    verification_status: string
    created_at: string
    username: string
    email: string
    first_name: string
    last_name: string
    photos: string[]
}

interface VerificationSectionProps {
    directSales: PendingDirectSale[]
    directSalesTotal: number
    selectedDirectSale: PendingDirectSale | null
    setSelectedDirectSale: (ds: PendingDirectSale | null) => void
    directSaleRejectionReason: string
    setDirectSaleRejectionReason: (reason: string) => void
    handleApproveDirectSale: (directSaleId: number) => void
    handleRejectDirectSale: (directSaleId: number) => void
    processing: boolean
    loadPendingDirectSales: () => void
}

export function VerificationSection({
    directSales,
    directSalesTotal,
    selectedDirectSale,
    setSelectedDirectSale,
    directSaleRejectionReason,
    setDirectSaleRejectionReason,
    handleApproveDirectSale,
    handleRejectDirectSale,
    processing,
    loadPendingDirectSales,
}: VerificationSectionProps) {
    const { t } = useTranslation()
    const [viewingImage, setViewingImage] = useState<string | null>(null)
    // Default to showing the full image within the screen (no zoom)
    const [fitToScreen, setFitToScreen] = useState(true)

    const directSaleRejectionReasons = [
        "admin.rejection.vehicle_quality",
        "admin.rejection.vehicle_mismatch",
        "admin.rejection.vehicle_owner_mismatch",
        "admin.rejection.vehicle_missing_photos",
        "admin.rejection.vehicle_condition",
        "admin.rejection.vehicle_suspicious",
        "admin.rejection.vehicle_incomplete",
        "admin.rejection.other",
    ]

    return (
        <>
            {/* Direct Sales Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#103090] flex items-center gap-3">
                        <span className="p-2 bg-blue-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-[#103090]" />
                        </span>
                        Listings Verification
                    </h2>
                    <p className="text-slate-500 mt-2 ml-1">Review and manage vehicle listing requests pending approval</p>
                </div>
                <Badge variant="outline" className="text-slate-600 border-slate-200 bg-white px-3 py-1.5 shadow-sm text-sm">
                    {directSalesTotal} pending requests
                </Badge>
            </div>

            {/* Direct Sales Content */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Direct Sales List - Left Side */}
                <div className="xl:col-span-4 space-y-4">
                    <div className="sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar space-y-4 bg-transparent">
                        {directSales.length === 0 ? (
                            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-600 font-semibold text-lg">All Catch Up!</p>
                                    <p className="text-slate-400 mt-2">No pending verifications at the moment.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            directSales.map((ds) => (
                                <div
                                    key={ds.id}
                                    onClick={() => {
                                        setSelectedDirectSale(ds)
                                        setDirectSaleRejectionReason("")
                                    }}
                                    className={`group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer border ${selectedDirectSale?.id === ds.id
                                        ? "bg-white border-[#B8071C] shadow-lg shadow-red-900/5 ring-1 ring-[#B8071C]"
                                        : "bg-white border-slate-100 hover:border-[#B8071C]/30 hover:shadow-md"
                                        }`}
                                >
                                    {/* Selection Indicator Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${selectedDirectSale?.id === ds.id ? "bg-[#B8071C]" : "bg-transparent group-hover:bg-[#B8071C]/20"
                                        }`} />

                                    <div className="p-4 pl-5">
                                        <div className="flex items-start gap-4">
                                            {/* Thumbnail */}
                                            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                                                {ds.photos && ds.photos.length > 0 ? (
                                                    <Image
                                                        src={formatImageSrc(ds.photos[0]) || "/placeholder.svg"}
                                                        alt={`${ds.make} ${ds.model}`}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="96px"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <DollarSign className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-6">
                                                    <span className="text-[10px] font-bold text-white flex items-center gap-1 justify-center">
                                                        {ds.photos?.length || 0} <FileText className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 py-0.5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                                        Direct Sale
                                                    </Badge>
                                                    <span className="text-xs font-medium text-slate-400 font-mono">
                                                        {new Date(ds.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                <h4 className="font-bold text-slate-800 text-base truncate mb-1">
                                                    {ds.year} {ds.make} {ds.model}
                                                </h4>

                                                <p className="text-xs text-slate-500 mb-2 truncate">
                                                    by <span className="font-medium text-slate-700">@{ds.username}</span>
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                                        {typeof ds.price === 'number' ? ds.price.toLocaleString() : ds.price} MAD
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Direct Sale Details - Right Side */}
                <div className="xl:col-span-8">
                    {selectedDirectSale ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">

                            {/* Main Info Card */}
                            <Card className="border-0 shadow-lg bg-white overflow-hidden rounded-3xl">
                                <div className="h-2 bg-gradient-to-r from-[#B8071C] via-[#DEB735] to-[#103090]" />
                                <CardHeader className="border-b border-slate-100 bg-white px-8 py-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-3xl font-bold text-[#103090] tracking-tight">
                                                    {selectedDirectSale.year} {selectedDirectSale.make} {selectedDirectSale.model}
                                                </h2>
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 text-sm">
                                                    Reviewing
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                                    ID: #{selectedDirectSale.id}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                                    Listed {formatTimeAgo(selectedDirectSale.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Listing Price</p>
                                            <p className="text-4xl font-black text-[#B8071C] tracking-tight">
                                                {typeof selectedDirectSale.price === 'number' ? selectedDirectSale.price.toLocaleString() : selectedDirectSale.price} <span className="text-lg text-slate-400 font-bold">MAD</span>
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 bg-[#F8FAFC]">
                                    {/* Vehicle Key Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mileage</p>
                                            <p className="text-lg font-bold text-slate-800">{selectedDirectSale.mileage.toLocaleString()} km</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fuel Type</p>
                                            <p className="text-lg font-bold text-slate-800 capitalize">{selectedDirectSale.fuel_type}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transmission</p>
                                            <p className="text-lg font-bold text-slate-800 capitalize">{selectedDirectSale.transmission}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location</p>
                                            <p className="text-lg font-bold text-slate-800 flex items-center gap-1 truncate">
                                                {t(`location.city.${(selectedDirectSale.location || "").toLowerCase().replace(/\s+/g, '')}` as any) || selectedDirectSale.location}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Description */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                                            <h3 className="font-bold text-[#103090] mb-4 flex items-center gap-2">
                                                <FileText className="w-5 h-5" /> Description
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                                {selectedDirectSale.description || "No description provided."}
                                            </p>
                                            {selectedDirectSale.special_features && (
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Special Features</p>
                                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{selectedDirectSale.special_features}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Seller Info */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                                            <h3 className="font-bold text-[#103090] mb-4 flex items-center gap-2">
                                                <User className="w-5 h-5" /> Seller Information
                                            </h3>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">
                                                    {selectedDirectSale.first_name?.[0]}{selectedDirectSale.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-lg">
                                                        {selectedDirectSale.first_name} {selectedDirectSale.last_name}
                                                    </p>
                                                    <p className="text-slate-500 text-sm">@{selectedDirectSale.username}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700">{selectedDirectSale.email}</span>
                                                </div>
                                                {/* Add phone if available in type */}
                                                {/* Condition */}
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm font-medium text-slate-700">Vehicle Condition: <span className="text-emerald-600 capitalize">{selectedDirectSale.vehicle_condition}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Photos Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Images */}
                                <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="bg-white border-b border-slate-100 px-6 py-4">
                                        <CardTitle className="text-lg text-[#103090] flex items-center gap-2">
                                            <FileText className="w-5 h-5" /> Vehicle Photos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-3 gap-3">
                                            {selectedDirectSale.photos && selectedDirectSale.photos.length > 0 ? (
                                                selectedDirectSale.photos.map((photo, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative group cursor-pointer aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                                                        onClick={() => {
                                                            setFitToScreen(true)
                                                            setViewingImage(formatImageSrc(photo))
                                                        }}
                                                    >
                                                        <Image
                                                            src={formatImageSrc(photo) || "/placeholder.svg"}
                                                            alt={`Photo ${index + 1}`}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                            sizes="200px"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-3 py-8 text-center bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                                                    <p className="text-slate-400">No photos uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Carte Grise */}
                                <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="bg-white border-b border-slate-100 px-6 py-4">
                                        <CardTitle className="text-lg text-[#103090] flex items-center gap-2">
                                            <Shield className="w-5 h-5" /> Carte Grise
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {selectedDirectSale.carte_grise_url ? (
                                            <div
                                                className="relative group cursor-pointer w-full h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
                                                onClick={() => {
                                                    setFitToScreen(true)
                                                    setViewingImage(formatImageSrc(selectedDirectSale.carte_grise_url))
                                                }}
                                            >
                                                <Image
                                                    src={formatImageSrc(selectedDirectSale.carte_grise_url) || "/placeholder.svg"}
                                                    alt="Carte Grise"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                                        <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                                            <ZoomIn className="w-4 h-4" /> View Document
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 flex flex-col items-center justify-center bg-red-50 rounded-xl border-dashed border-2 border-red-200">
                                                <AlertCircle className="w-8 h-8 text-red-300 mb-2" />
                                                <p className="text-red-400 font-medium">Missing Document</p>
                                            </div>
                                        )}
                                        <div className="bg-blue-50 p-3 rounded-lg mt-4 border border-blue-100">
                                            <p className="text-xs text-blue-700 leading-tight">
                                                <strong>Verification Check:</strong> Ensure name on document matches <u>{selectedDirectSale.first_name} {selectedDirectSale.last_name}</u>.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Bar */}
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 lg:right-12 z-40 w-[90%] md:w-auto">
                                <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2 pl-4 flex items-center gap-4">
                                    {!directSaleRejectionReason.trim() && (
                                        <div className="hidden md:flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviewing</span>
                                            <span className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{selectedDirectSale.make} {selectedDirectSale.model}</span>
                                        </div>
                                    )}

                                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <Select value={directSaleRejectionReason} onValueChange={setDirectSaleRejectionReason}>
                                            <SelectTrigger className="w-full md:w-[280px] border-slate-200 bg-slate-50 focus:ring-[#B8071C] h-11 rounded-xl">
                                                <SelectValue placeholder="Select decision / rejection reason..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2 text-xs font-bold text-slate-400 uppercase">Rejection Reasons</div>
                                                {directSaleRejectionReasons.map((reason) => (
                                                    <SelectItem key={reason} value={`__t:${reason}`}>
                                                        {t(reason as any)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {directSaleRejectionReason.trim() ? (
                                            <Button
                                                onClick={() => handleRejectDirectSale(selectedDirectSale.id)}
                                                disabled={processing}
                                                className="bg-[#B8071C] hover:bg-red-700 text-white h-11 px-6 rounded-xl shadow-lg shadow-red-600/20 transition-all font-bold min-w-[120px]"
                                            >
                                                {processing ? "..." : (
                                                    <>
                                                        <XCircle className="w-5 h-5 mr-2" /> Reject
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleApproveDirectSale(selectedDirectSale.id)}
                                                disabled={processing}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 rounded-xl shadow-lg shadow-emerald-600/20 transition-all font-bold min-w-[120px]"
                                            >
                                                {processing ? "..." : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 mr-2" /> Approve
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center opacity-60">
                            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 transform rotate-3">
                                <Eye className="w-12 h-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">No Selection</h3>
                            <p className="text-slate-500 max-w-[300px]">Select a vehicle request from the list to start verification process.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer Modal */}
            <Dialog
                open={!!viewingImage}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingImage(null)
                        setFitToScreen(true)
                    }
                }}
            >
                <DialogContent hideClose className="p-0 w-[100vw] max-w-[100vw] h-[100vh] max-h-[100vh] overflow-hidden bg-black">
                    {/* Custom modern close button */}
                    <div className="absolute top-4 right-4 z-[60]">
                        <DialogClose asChild>
                            <button
                                type="button"
                                aria-label="Close"
                                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </DialogClose>
                    </div>
                    <div className={"h-full w-full flex items-center justify-center " + (fitToScreen ? "overflow-hidden" : "overflow-auto")}>
                        {viewingImage && (
                            <img
                                src={viewingImage}
                                alt="Document"
                                onClick={() => setFitToScreen((v) => !v)}
                                className={
                                    (fitToScreen
                                        ? "max-w-full max-h-full object-contain cursor-zoom-in"
                                        : "w-auto h-auto max-w-none max-h-none cursor-zoom-out") +
                                    " select-none"
                                }
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
