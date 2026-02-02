"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Trash2,
    Pencil,
    Car,
    Check,
    X,
    MessageCircle,
    Hash,
    MapPin,
    Calendar,
    Settings2,
    Fuel,
    Info,
    DollarSign,
    Loader2,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Upload
} from "lucide-react"
import { CAR_COLORS } from "@/lib/car-colors"

interface KarkeyCarPhoto {
    id: number
    photo_url: string
    position_order: number
}

interface KarkeyCar {
    id: number
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
    interior_color?: string | null
    exterior_color?: string | null
    is_original_paint?: boolean | null
    special_features?: string | null
    price: string | number
    is_active: boolean
    photos: KarkeyCarPhoto[]
    _count?: {
        inquiries: number
    }
}

const normalizePhotoUrl = (p: string | null | undefined): string => {
    if (!p) return "/placeholder-car.jpg"
    const s = String(p).trim()

    // Validate protocols explicitly to prevent XSS via javascript: or other dangerous protocols
    if (s.startsWith("data:image/")) return s  // Only allow data URLs for images
    if (s.startsWith("blob:")) return s

    // For http/https URLs, validate they're proper URLs
    if (s.startsWith("http://") || s.startsWith("https://")) {
        try {
            const url = new URL(s)
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return s
            }
        } catch {
            return "/placeholder-car.jpg"
        }
    }

    const filename = s.includes("/") ? (s.split("/").pop() || s) : s;
    return `https://img.karkey.space/vehicles/${filename}`
}

export function KarkeyCarsManager() {
    const [cars, setCars] = useState<KarkeyCar[]>([])
    const [loading, setLoading] = useState(true)
    const [editingCar, setEditingCar] = useState<Partial<KarkeyCar> | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState<Partial<KarkeyCar>>({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        mileage: 0,
        transmission: "automatic",
        fuel_type: "gasoline",
        engine_size: "",
        doors: "4",
        vehicle_condition: "excellent",
        location: "Casablanca",
        description: "",
        interior_color: "",
        exterior_color: "",
        is_original_paint: true,
        special_features: "",
        price: "",
        photos: []
    })

    const [photos, setPhotos] = useState<{ url: string; file?: File; isExisting?: boolean }[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchCars()
    }, [])

    const fetchCars = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/karkey-cars?includeInactive=true")
            const data = await res.json()
            if (data.success) {
                setCars(data.cars)
            }
        } catch (err) {
            console.error("Failed to fetch Karkey cars", err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            const newPhotos = newFiles.map(file => ({
                url: URL.createObjectURL(file),
                file
            }))
            setPhotos(prev => [...prev, ...newPhotos])
        }
    }

    const removePhoto = (index: number) => {
        setPhotos(prev => {
            const photoToRemove = prev[index]
            if (photoToRemove.file) {
                URL.revokeObjectURL(photoToRemove.url)
            }
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editingCar?.id ? `/api/admin/karkey-cars/${editingCar.id}` : "/api/admin/karkey-cars"
            const formDataToSubmit = new FormData()

            // Append basic fields (excluding the photos array which we handle separately)
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== "photos" && value !== undefined && value !== null) {
                    formDataToSubmit.append(key, value.toString())
                }
            })

            // Filter existing photos and new files
            const existingPhotoUrls = photos.filter(p => !p.file).map(p => p.url)
            const newFiles = photos.filter(p => p.file).map(p => p.file as File)

            // Append existing photos as JSON string to handle their order/presence
            formDataToSubmit.append("existingPhotos", JSON.stringify(existingPhotoUrls))

            // Append new files
            newFiles.forEach(file => {
                formDataToSubmit.append("photos", file)
            })

            const res = await fetch(url, {
                method: editingCar?.id ? "PUT" : "POST",
                body: formDataToSubmit
            })

            const data = await res.json()
            if (data.success) {
                alert(editingCar?.id ? "Car updated successfully" : "Car created successfully")
                setShowForm(false)
                setEditingCar(null)
                fetchCars()
            } else {
                alert("Error: " + (data.error || "Failed to save"))
            }
        } catch (err) {
            console.error("Save error:", err)
            alert("Failed to save car")
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (car: KarkeyCar) => {
        setEditingCar(car)
        setFormData({
            make: car.make,
            model: car.model,
            year: car.year,
            mileage: car.mileage,
            transmission: car.transmission,
            fuel_type: car.fuel_type,
            engine_size: car.engine_size || "",
            doors: car.doors || "",
            vehicle_condition: car.vehicle_condition,
            location: car.location,
            description: car.description,
            interior_color: car.interior_color || "",
            exterior_color: car.exterior_color || "",
            is_original_paint: car.is_original_paint ?? true,
            special_features: car.special_features || "",
            price: car.price,
            is_active: car.is_active
        })
        setPhotos(car.photos.map(p => ({ url: p.photo_url, isExisting: true })))
        setShowForm(true)
    }

    const handleToggleActive = async (carId: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/karkey-cars/${carId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentStatus })
            })
            if (res.ok) {
                fetchCars()
            }
        } catch (err) {
            console.error("Toggle error:", err)
        }
    }

    const handleDelete = async (carId: number) => {
        if (!confirm("Are you sure you want to delete this car? (This will deactivate it)")) return
        try {
            const res = await fetch(`/api/admin/karkey-cars/${carId}`, { method: "DELETE" })
            if (res.ok) {
                fetchCars()
            }
        } catch (err) {
            console.error("Delete error:", err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#B8071C]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#103090]">Manage Karkey Cars</h3>
                <Button onClick={() => {
                    setEditingCar(null)
                    setFormData({
                        make: "",
                        model: "",
                        year: new Date().getFullYear(),
                        mileage: 0,
                        transmission: "automatic",
                        fuel_type: "gasoline",
                        engine_size: "",
                        doors: "4",
                        vehicle_condition: "excellent",
                        location: "Casablanca",
                        description: "",
                        interior_color: "",
                        exterior_color: "",
                        is_original_paint: true,
                        special_features: "",
                        price: "",
                        photos: []
                    })
                    setPhotos([])
                    setShowForm(true)
                }} className="bg-[#B8071C] hover:bg-[#910515]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Car
                </Button>
            </div>

            {showForm && (
                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardHeader className="bg-[#B8071C]/5 border-b">
                        <CardTitle className="text-base flex items-center justify-between">
                            {editingCar ? `Edit ${editingCar.make} ${editingCar.model}` : "Add New Karkey Car"}
                            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Make *</Label>
                                    <Input name="make" value={formData.make} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Model *</Label>
                                    <Input name="model" value={formData.model} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Year *</Label>
                                    <Input name="year" type="number" value={formData.year} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Price (MAD) *</Label>
                                    <Input name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mileage (km) *</Label>
                                    <Input name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Location *</Label>
                                    <Input name="location" value={formData.location} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Transmission</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.transmission}
                                        onChange={(e) => handleSelectChange("transmission", e.target.value)}
                                    >
                                        <option value="automatic">Automatic</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fuel Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.fuel_type}
                                        onChange={(e) => handleSelectChange("fuel_type", e.target.value)}
                                    >
                                        <option value="gasoline">Gasoline</option>
                                        <option value="diesel">Diesel</option>
                                        <option value="electric">Electric</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Condition</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.vehicle_condition}
                                        onChange={(e) => handleSelectChange("vehicle_condition", e.target.value)}
                                    >
                                        <option value="excellent">Excellent</option>
                                        <option value="good">Good</option>
                                        <option value="fair">Fair</option>
                                        <option value="poor">Poor</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Doors</Label>
                                    <Input name="doors" value={formData.doors || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Engine Size (L)</Label>
                                    <Input name="engine_size" value={formData.engine_size || ""} onChange={handleInputChange} placeholder="e.g., 2.0" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Exterior Color</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.exterior_color || ""}
                                        onChange={(e) => handleSelectChange("exterior_color", e.target.value)}
                                    >
                                        <option value="">Select color...</option>
                                        {CAR_COLORS.map(c => (
                                            <option key={c.value} value={c.value}>{c.value.charAt(0).toUpperCase() + c.value.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Interior Color</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.interior_color || ""}
                                        onChange={(e) => handleSelectChange("interior_color", e.target.value)}
                                    >
                                        <option value="">Select color...</option>
                                        {CAR_COLORS.map(c => (
                                            <option key={c.value} value={c.value}>{c.value.charAt(0).toUpperCase() + c.value.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_original_paint_admin"
                                    name="is_original_paint"
                                    className="w-4 h-4 text-[#B8071C] border-gray-300 rounded focus:ring-[#B8071C]"
                                    checked={formData.is_original_paint !== false}
                                    onChange={handleInputChange}
                                />
                                <Label htmlFor="is_original_paint_admin">Original Paint</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Special Features</Label>
                                <textarea
                                    name="special_features"
                                    value={formData.special_features || ""}
                                    onChange={handleInputChange}
                                    placeholder="List any special features, upgrades, or unique selling points..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description *</Label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Photos (Upload)</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Photos
                                    </Button>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {photos.map((photo, idx) => (
                                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-slate-50 group">
                                            <Image
                                                src={normalizePhotoUrl(photo.url)}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            {photo.file && (
                                                <div className="absolute bottom-1 left-1">
                                                    <Badge className="text-[8px] px-1 h-3 bg-blue-500 text-white">New</Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {photos.length === 0 && (
                                        <div
                                            className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No photos added yet. Click to upload.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button type="submit" disabled={saving} className="bg-[#B8071C] hover:bg-[#910515]">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    {editingCar ? "Update Car" : "Create Car"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map(car => (
                    <Card key={car.id} className={`border-0 shadow-sm transition-all hover:shadow-md ${!car.is_active ? 'opacity-60 saturate-50' : ''}`}>
                        <div className="relative aspect-video bg-slate-100 overflow-hidden rounded-t-xl">
                            {car.photos?.[0] ? (
                                <Image
                                    src={normalizePhotoUrl(car.photos[0].photo_url)}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Car className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                {!car.is_active && <Badge className="bg-slate-500 text-white">Inactive</Badge>}
                                <Badge className="bg-[#B8071C] text-white">Karkey</Badge>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="font-bold text-[#103090] leading-tight">{car.make} {car.model}</h4>
                                    <p className="text-xs text-slate-500">{car.year} • {car.location}</p>
                                </div>
                                <div className="text-lg font-bold text-[#B8071C]">
                                    {new Intl.NumberFormat('en-US').format(Number(car.price))} MAD
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t text-[10px] text-slate-500">
                                <div className="flex flex-col items-center">
                                    <MessageCircle className="w-4 h-4 mb-1 text-[#B8071C]" />
                                    <span>{car._count?.inquiries || 0} Inquiries</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Settings2 className="w-4 h-4 mb-1" />
                                    <span className="capitalize">{car.transmission}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Fuel className="w-4 h-4 mb-1" />
                                    <span className="capitalize">{car.fuel_type}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" className="flex-1 h-9" onClick={() => handleEdit(car)}>
                                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`flex-1 h-9 ${car.is_active ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
                                    onClick={() => handleToggleActive(car.id, car.is_active)}
                                >
                                    {car.is_active ? <X className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                                    {car.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button variant="outline" className="h-9 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(car.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {cars.length === 0 && !showForm && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed">
                        <Car className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                        <h4 className="text-lg font-medium text-slate-500">No Karkey cars found</h4>
                        <p className="text-sm text-slate-400">Click "Add New Car" to get started</p>
                    </div>
                )}
            </div>
        </div>
    )
}

interface Inquiry {
    id: number
    karkey_car_id: number
    user_id?: number | null
    name: string
    phone: string
    email: string
    message: string
    is_processed: boolean
    created_at: string
    karkey_cars?: {
        make: string
        model: string
        year: number
        price: number
        photos: { photo_url: string }[]
    }
}

export function KarkeyInquiriesList({
    inquiries,
    loading,
    onMarkProcessed
}: {
    inquiries: Inquiry[],
    loading: boolean,
    onMarkProcessed: (id: number) => void
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#B8071C]" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#103090]">Karkey Car Inquiries</h3>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b">
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Car</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Message</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {inquiries.map(inquiry => (
                            <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-sm text-slate-600">
                                    {new Date(inquiry.created_at).toLocaleDateString()}
                                    <br />
                                    <span className="text-[10px] text-slate-400">{new Date(inquiry.created_at).toLocaleTimeString()}</span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-semibold text-slate-900">{inquiry.name}</div>
                                    <div className="text-xs text-slate-500">{inquiry.email}</div>
                                    <div className="text-xs text-slate-500">{inquiry.phone}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                            {inquiry.karkey_cars?.photos?.[0]?.photo_url ? (
                                                <img
                                                    src={normalizePhotoUrl(inquiry.karkey_cars.photos[0].photo_url)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Car className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-[#B8071C]">
                                                {inquiry.karkey_cars ? `${inquiry.karkey_cars.make} ${inquiry.karkey_cars.model} (${inquiry.karkey_cars.year})` : `Car #${inquiry.karkey_car_id}`}
                                            </div>
                                            {inquiry.karkey_cars && <div className="text-xs text-slate-500">{new Intl.NumberFormat().format(inquiry.karkey_cars.price)} MAD</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">{inquiry.message}</p>
                                </td>
                                <td className="p-4 text-center">
                                    {inquiry.is_processed ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Processed</Badge>
                                    ) : (
                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">Pending</Badge>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {!inquiry.is_processed && (
                                        <Button
                                            size="sm"
                                            onClick={() => onMarkProcessed(inquiry.id)}
                                            className="bg-[#B8071C] hover:bg-[#910515] text-xs h-8"
                                        >
                                            <Check className="w-3.5 h-3.5 mr-1" /> Mark Processed
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {inquiries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-20 text-center text-slate-400">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No inquiries found for Karkey cars.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
