"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    LifeBuoy,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Clock,
    User,
    ArrowUpRight,
    Search,
    Filter,
    Car,
    Inbox,
    Phone,
    Mail
} from "lucide-react"
import { KarkeyCarsManager, KarkeyInquiriesList } from "../karkey-cars-manager"

export function SupportSection() {
    // Default to inventory as "General Support" is removed
    const [activeTab, setActiveTab] = useState("inventory")

    // Karkey Inquiries State
    const [karkeyInquiries, setKarkeyInquiries] = useState<any[]>([])
    const [karkeyLoading, setKarkeyLoading] = useState(false)

    // Direct Sale Inquiries State
    const [directSaleInquiries, setDirectSaleInquiries] = useState<any[]>([])
    const [dsLoading, setDsLoading] = useState(false)
    const [dsSearchQuery, setDsSearchQuery] = useState("")

    useEffect(() => {
        if (activeTab === "karkey-inquiries") {
            loadKarkeyInquiries()
        } else if (activeTab === "direct-sale-inquiries") {
            loadDirectSaleInquiries()
        }
    }, [activeTab])

    const loadKarkeyInquiries = async () => {
        setKarkeyLoading(true)
        try {
            const res = await fetch("/api/admin/karkey-car-inquiries")
            const data = await res.json()
            if (data.success) {
                setKarkeyInquiries(data.inquiries || [])
            }
        } catch (error) {
            console.error("Failed to load karkey inquiries", error)
        } finally {
            setKarkeyLoading(false)
        }
    }

    const loadDirectSaleInquiries = async () => {
        setDsLoading(true)
        try {
            const res = await fetch("/api/admin/support-contacts")
            const data = await res.json()
            if (data.success) {
                setDirectSaleInquiries(data.contacts || [])
            }
        } catch (error) {
            console.error("Failed to load direct sale inquiries", error)
        } finally {
            setDsLoading(false)
        }
    }

    const handleMarkKarkeyInquiryProcessed = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/karkey-car-inquiries`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inquiry_id: id, is_processed: true })
            })
            if (res.ok) {
                setKarkeyInquiries(prev => prev.map(inq =>
                    inq.id === id ? { ...inq, is_processed: true } : inq
                ))
            }
        } catch (error) {
            console.error("Failed to mark karkey inquiry processed", error)
        }
    }

    // Filter Direct Sale inquiries
    const filteredDsInquiries = directSaleInquiries?.filter(contact =>
        contact.contact_name?.toLowerCase().includes(dsSearchQuery.toLowerCase()) ||
        contact.message?.toLowerCase().includes(dsSearchQuery.toLowerCase()) ||
        contact.vehicle_make?.toLowerCase().includes(dsSearchQuery.toLowerCase())
    ) || []

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#103090] flex items-center gap-3">
                    <span className="p-2 bg-amber-50 rounded-lg">
                        <LifeBuoy className="w-6 h-6 text-[#DEB735]" />
                    </span>
                    Inventory & Inquiries
                </h2>
                <p className="text-slate-500 mt-2 ml-1">Manage Karkey inventory and all vehicle-related inquiries</p>
            </div>

            <Tabs defaultValue="inventory" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-8 w-full md:w-auto inline-flex">
                    <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#B8071C] data-[state=active]:shadow-sm px-6">
                        <Car className="w-4 h-4 mr-2" />
                        Karkey Inventory
                    </TabsTrigger>
                    <TabsTrigger value="karkey-inquiries" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#103090] data-[state=active]:shadow-sm px-6">
                        <Inbox className="w-4 h-4 mr-2" />
                        Karkey Inquiries
                    </TabsTrigger>
                    <TabsTrigger value="direct-sale-inquiries" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#103090] data-[state=active]:shadow-sm px-6">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Direct Sale Inquiries
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory">
                    <KarkeyCarsManager />
                </TabsContent>

                <TabsContent value="karkey-inquiries">
                    <KarkeyInquiriesList
                        inquiries={karkeyInquiries}
                        loading={karkeyLoading}
                        onMarkProcessed={handleMarkKarkeyInquiryProcessed}
                    />
                </TabsContent>

                <TabsContent value="direct-sale-inquiries">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[600px]">
                        {/* Inquiries List */}
                        <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden h-fit">
                            <CardHeader className="bg-white border-b border-slate-100 px-6 py-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                                            <MessageSquare className="w-5 h-5 text-[#DEB735]" />
                                        </div>
                                        <CardTitle className="text-[#103090] text-lg">Direct Sale Inquiries</CardTitle>
                                    </div>
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search inquiries..."
                                            value={dsSearchQuery}
                                            onChange={(e) => setDsSearchQuery(e.target.value)}
                                            className="w-full h-10 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#103090] focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {dsLoading ? (
                                        <div className="flex items-center justify-center py-20">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#103090]"></div>
                                        </div>
                                    ) : filteredDsInquiries && filteredDsInquiries.length > 0 ? (
                                        filteredDsInquiries.map((inquiry: any) => (
                                            <div
                                                key={inquiry.id}
                                                onClick={() => setDirectSaleInquiries(prev => prev.map(p => ({ ...p, selected: p.id === inquiry.id })))}
                                                className={`p-4 transition-all cursor-pointer border-l-4 ${inquiry.selected ? 'bg-blue-50 border-l-[#103090]' : 'hover:bg-slate-50 border-l-transparent'}`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${inquiry.processed ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                        <span className="font-bold text-slate-700 text-sm truncate max-w-[150px]">{inquiry.contact_name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                        {new Date(inquiry.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 line-clamp-2 mb-2">{inquiry.message}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-100/50 p-1.5 rounded">
                                                    <Car className="w-3 h-3" />
                                                    <span className="truncate">{inquiry.vehicle_make} {inquiry.vehicle_model}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 px-4">
                                            <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                                            <p className="text-sm text-slate-500">No inquiries found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed View */}
                        <div className="space-y-6">
                            {directSaleInquiries.find(i => i.selected) ? (
                                (() => {
                                    const selectedInquiry = directSaleInquiries.find(i => i.selected);
                                    return (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                            {/* Vehicle Card */}
                                            <Card className="border-0 shadow-lg bg-white overflow-hidden rounded-3xl">
                                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                                    <div className="flex items-center gap-2 text-[#103090] font-bold text-sm uppercase tracking-wider">
                                                        <Car className="w-4 h-4" />
                                                        Vehicle Details
                                                    </div>
                                                </CardHeader>
                                                <div className="flex flex-col sm:flex-row">
                                                    <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-slate-200">
                                                        {selectedInquiry.vehicle_photo ? (
                                                            <img src={selectedInquiry.vehicle_photo} alt="Vehicle" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <Car className="w-10 h-10" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <Badge className="bg-[#B8071C] text-white border-0 shadow-sm">
                                                                {selectedInquiry.vehicle_price?.toLocaleString()} MAD
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 flex-1 space-y-3">
                                                        <h3 className="text-xl font-bold text-slate-800">
                                                            {selectedInquiry.vehicle_year} {selectedInquiry.vehicle_make} {selectedInquiry.vehicle_model}
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 uppercase">Mileage</span>
                                                                <span className="font-medium">{selectedInquiry.vehicle_mileage?.toLocaleString()} km</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 uppercase">Fuel</span>
                                                                <span className="font-medium">{selectedInquiry.vehicle_fuel}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 uppercase">Transmission</span>
                                                                <span className="font-medium">{selectedInquiry.vehicle_transmission}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 uppercase">Location</span>
                                                                <span className="font-medium">{selectedInquiry.vehicle_location}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Participants Card */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Seller */}
                                                <Card className="border-0 shadow-md bg-white rounded-3xl overflow-hidden">
                                                    <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-3">
                                                        <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
                                                            <User className="w-3.5 h-3.5" /> Seller (Owner)
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4 space-y-3">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{selectedInquiry.seller_first_name} {selectedInquiry.seller_last_name}</p>
                                                            <p className="text-xs text-slate-400">ID: #{selectedInquiry.seller_id}</p>
                                                        </div>
                                                        <div className="space-y-1.5 text-sm">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Phone className="w-3.5 h-3.5 text-blue-500" />
                                                                {selectedInquiry.seller_phone || "No phone"}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Mail className="w-3.5 h-3.5 text-blue-500" />
                                                                <span className="truncate">{selectedInquiry.seller_email}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Buyer */}
                                                <Card className="border-0 shadow-md bg-white rounded-3xl overflow-hidden">
                                                    <CardHeader className="bg-amber-50/50 border-b border-amber-100 py-3">
                                                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                                            <User className="w-3.5 h-3.5" /> Buyer (Requester)
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4 space-y-3">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{selectedInquiry.contact_name}</p>
                                                            <p className="text-xs text-slate-400">{selectedInquiry.user_id ? `Active User (#${selectedInquiry.user_id})` : 'Guest User'}</p>
                                                        </div>
                                                        <div className="space-y-1.5 text-sm">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Phone className="w-3.5 h-3.5 text-amber-500" />
                                                                {selectedInquiry.contact_phone || "No phone"}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Mail className="w-3.5 h-3.5 text-amber-500" />
                                                                <span className="truncate">{selectedInquiry.contact_email}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Inquiry & Action Card */}
                                            <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden">
                                                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-[#103090] font-bold text-sm uppercase tracking-wider">
                                                            <MessageSquare className="w-4 h-4" />
                                                            Inquiry Details
                                                        </div>
                                                        <Badge variant={selectedInquiry.processed ? "outline" : "default"} className={selectedInquiry.processed ? "text-green-600 border-green-200 bg-green-50" : "bg-amber-500"}>
                                                            {selectedInquiry.processed ? "Processed" : "Pending Action"}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-6 space-y-6">
                                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                        <p className="text-xs font-bold text-blue-800 mb-1">Message from Buyer</p>
                                                        <p className="text-sm text-slate-700 italic">"{selectedInquiry.message}"</p>
                                                        <p className="text-[10px] text-blue-400 mt-2 text-right">{new Date(selectedInquiry.created_at).toLocaleString()}</p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <h4 className="text-sm font-bold text-slate-900">Lead Workflow</h4>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                                {selectedInquiry.processed ? "Completed" : "In Progress"}
                                                            </span>
                                                        </div>

                                                        {/* Step 1: Interest Verification */}
                                                        <div className={`p-3 rounded-xl border transition-all ${selectedInquiry.processed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${true ? 'bg-blue-100 text-[#103090]' : 'bg-slate-100 text-slate-400'}`}>
                                                                    <span className="text-sm font-bold">1</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-slate-800 mb-1">Buyer Interest Verification</p>
                                                                    <p className="text-xs text-slate-500 mb-3">Confirm if the buyer is serious and add to "Interested Candidates".</p>

                                                                    <div className="flex gap-2">
                                                                        <Button size="sm" variant="outline" className="h-8 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">
                                                                            <CheckCircle className="w-3 h-3 mr-1.5" />
                                                                            Confimed Interested
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="h-8 text-xs text-slate-600">
                                                                            Not Interested
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Step 2: Inspection Decision (Visual connection) */}
                                                        <div className="flex justify-center -my-2 relative z-10">
                                                            <div className="w-0.5 h-4 bg-slate-200"></div>
                                                        </div>

                                                        {/* Step 3: Inspection */}
                                                        <div className={`p-3 rounded-xl border transition-all ${selectedInquiry.processed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${false ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                                                                    <span className="text-sm font-bold">2</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-slate-800 mb-1">Inspection Request</p>
                                                                    <p className="text-xs text-slate-500 mb-3">Does the buyer require a technical inspection?</p>

                                                                    <div className="flex gap-2">
                                                                        <Button size="sm" variant="outline" className="h-8 text-xs text-[#103090] border-blue-200 bg-blue-50 hover:bg-blue-100">
                                                                            Schedule Inspection
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-500">
                                                                            No Inspection Needed
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )
                                })()
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                        <Car className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700">Select an Inquiry</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">Click on an inquiry from the list to view full vehicle details, seller info, and manage the sale process.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
