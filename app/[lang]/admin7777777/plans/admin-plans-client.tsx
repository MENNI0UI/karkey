"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Check,
  Zap,
  Crown,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { type Plan } from "@/lib/plans-data"

interface AdminPlansClientProps {
  initialPlans: Plan[]
  adminInfo: { nom: string; prenom: string } | null
}

export default function AdminPlansClient({ initialPlans, adminInfo }: AdminPlansClientProps) {
  const { toast } = useToast()

  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [loading, setLoading] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    currency: "DH",
    duration_days: "30",
    bid_limit: "",
    description: "",
    features: "",
    popular: false,
    priority: "0",
    status: "active" as "active" | "inactive",
    // Translation fields
    name_ar: "",
    name_fr: "",
    name_es: "",
    description_ar: "",
    description_fr: "",
    description_es: "",
    features_ar: "",
    features_fr: "",
    features_es: "",
  })

  const loadPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/plans?all=true")
      const data = await res.json()
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("Failed to load plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({
      name: "",
      price: "",
      currency: "DH",
      duration_days: "30",
      bid_limit: "",
      description: "",
      features: "",
      popular: false,
      priority: "0",
      status: "active",
      // Translation fields
      name_ar: "",
      name_fr: "",
      name_es: "",
      description_ar: "",
      description_fr: "",
      description_es: "",
      features_ar: "",
      features_fr: "",
      features_es: "",
    })
    setEditingPlan(null)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const openEditDialog = (plan: Plan) => {
    setFormData({
      name: plan.name,
      price: String(plan.price),
      currency: plan.currency,
      duration_days: String(plan.duration_days),
      bid_limit: plan.bid_limit != null ? String(plan.bid_limit) : "",
      description: plan.description || "",
      features: (plan.features || []).join("\n"),
      popular: plan.popular,
      priority: String(plan.priority),
      status: plan.status,
      // Translation fields
      name_ar: plan.name_ar || "",
      name_fr: plan.name_fr || "",
      name_es: plan.name_es || "",
      description_ar: plan.description_ar || "",
      description_fr: plan.description_fr || "",
      description_es: plan.description_es || "",
      features_ar: Array.isArray(plan.features_ar) ? plan.features_ar.join("\n") : "",
      features_fr: Array.isArray(plan.features_fr) ? plan.features_fr.join("\n") : "",
      features_es: Array.isArray(plan.features_es) ? plan.features_es.join("\n") : "",
    })
    setEditingPlan(plan)
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const features = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)

      // Parse translation features
      const features_ar = formData.features_ar
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
      const features_fr = formData.features_fr
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
      const features_es = formData.features_es
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)

      const payload = {
        ...(dialogMode === "edit" && editingPlan ? { id: editingPlan.id } : {}),
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        duration_days: parseInt(formData.duration_days) || 30,
        bid_limit: formData.bid_limit ? parseInt(formData.bid_limit) : null,
        description: formData.description || null,
        features,
        popular: formData.popular,
        priority: parseInt(formData.priority) || 0,
        status: formData.status,
        // Translation fields
        name_ar: formData.name_ar || null,
        name_fr: formData.name_fr || null,
        name_es: formData.name_es || null,
        description_ar: formData.description_ar || null,
        description_fr: formData.description_fr || null,
        description_es: formData.description_es || null,
        features_ar: features_ar.length > 0 ? features_ar : null,
        features_fr: features_fr.length > 0 ? features_fr : null,
        features_es: features_es.length > 0 ? features_es : null,
      }

      const method = dialogMode === "create" ? "POST" : "PUT"
      const res = await fetch("/api/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        loadPlans()
        toast({
          title: "Success",
          description: dialogMode === "create" ? "Plan created successfully" : "Plan updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (planId: number) => {
    if (!confirm("Are you sure you want to deactivate this plan?")) return

    setDeleting(planId)
    try {
      const res = await fetch(`/api/plans?id=${planId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        loadPlans()
        toast({
          title: "Success",
          description: "Plan deactivated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to deactivate plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Deactivate error:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate plan",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  const handlePermanentDelete = async (planId: number, planName: string) => {
    const confirmText = prompt(`To permanently delete "${planName}", type DELETE:`)
    if (confirmText !== "DELETE") {
      if (confirmText !== null) {
        toast({
          title: "Cancelled",
          description: "Deletion cancelled. You must type DELETE exactly.",
          variant: "destructive"
        })
      }
      return
    }

    setDeleting(planId)
    try {
      const res = await fetch(`/api/plans?id=${planId}&permanent=true`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        loadPlans()
        toast({
          title: "Success",
          description: "Plan permanently deleted"
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete plan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Permanent delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  const getPlanIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes("prestige") || lower.includes("enterprise")) return <Crown className="w-5 h-5" />
    if (lower.includes("accelerator") || lower.includes("pro")) return <Zap className="w-5 h-5" />
    return <CreditCard className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-[#B8071C] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#B8071C]">Karkey</span>
                <Badge className="bg-[#B8071C] text-white">CEO</Badge>
              </div>
              <span className="text-gray-600 ml-2">{adminInfo ? `${adminInfo.prenom} ${adminInfo.nom}` : ""}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-[#B8071C]" />
              Plans Management
            </h1>
            <p className="text-gray-600 mt-1">Manage subscription plans and pricing</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-[#B8071C] hover:bg-[#910515]">
            <Plus className="w-4 h-4 mr-2" />
            Add New Plan
          </Button>
        </div>

        {/* Toolbar (search only) */}
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search plans by name..."
            className="max-w-sm"
            onChange={(e) => {
              const q = e.target.value.toLowerCase()
              if (!q) return loadPlans()
              setPlans((prev) => prev.filter((p) => p.name.toLowerCase().includes(q)))
            }}
          />
        </div>

        {loading && plans.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#B8071C] mx-auto mb-2" />
            <p className="text-gray-500">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No plans found. Create your first plan!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans
              .sort((a, b) => b.priority - a.priority)
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 transition-all shadow-sm ${
                    plan.status === "inactive" ? "bg-gray-50 opacity-60" : "bg-white hover:shadow-md"
                  } ${plan.popular ? "ring-2 ring-[#B8071C]" : "border border-gray-100"}`}
                >
                  {/* Header: Icon + Name + Price */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-3 rounded-lg shrink-0 ${plan.popular ? "bg-[#B8071C] text-white" : "bg-gray-100 text-gray-600"}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{plan.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{plan.description || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-[#B8071C]">{plan.price} <span className="text-sm">{plan.currency}</span></p>
                      <p className="text-xs text-gray-500">per {plan.duration_days} days</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button size="sm" onClick={() => openEditDialog(plan)} variant="outline" className="border-[#B8071C] text-[#B8071C] hover:bg-[#B8071C] hover:text-white">
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleDeactivate(plan.id)} className="bg-[#B8071C] text-white hover:bg-[#910515]">
                      {deleting === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deactivate"}
                    </Button>
                    <Button size="sm" onClick={() => handlePermanentDelete(plan.id, plan.name)} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map((feature, idx) => (
                          <span key={idx} className="inline-flex items-center text-xs bg-blue-50 text-[#B8071C] px-2 py-1 rounded">
                            <Check className="w-3 h-3 mr-1" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === "create" ? (
                <>
                  <Plus className="w-5 h-5 text-[#B8071C]" />
                  Create New Plan
                </>
              ) : (
                <>
                  <Pencil className="w-5 h-5 text-[#B8071C]" />
                  Edit Plan: {editingPlan?.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name & Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter, Pro, Enterprise"
                />
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="199"
                    className="flex-1"
                  />
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="DH"
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Duration & Bid Limit Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="bid_limit">Bid/Auction Limit (empty = unlimited)</Label>
                <Input
                  id="bid_limit"
                  type="number"
                  value={formData.bid_limit}
                  onChange={(e) => setFormData({ ...formData, bid_limit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {/* Priority & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority (higher = first)</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                  />
                  <Label>Mark as Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "active" : "inactive" })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this plan..."
                rows={2}
              />
            </div>

            {/* Features */}
            <div>
              <Label htmlFor="features">Features (one per line) - English</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Up to 3 active auctions&#10;Basic analytics&#10;Email support"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">Enter each feature on a new line</p>
            </div>

            {/* Translations Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🌐 Translations
              </h3>
              
              {/* Arabic Translations */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-3">العربية (Arabic)</h4>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="name_ar">Name (Arabic)</Label>
                    <Input
                      id="name_ar"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      placeholder="اسم الخطة بالعربية"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_ar">Description (Arabic)</Label>
                    <Textarea
                      id="description_ar"
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      placeholder="وصف الخطة بالعربية..."
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="features_ar">Features (Arabic - one per line)</Label>
                    <Textarea
                      id="features_ar"
                      value={formData.features_ar}
                      onChange={(e) => setFormData({ ...formData, features_ar: e.target.value })}
                      placeholder="حتى 3 مزادات نشطة&#10;تحليلات أساسية&#10;دعم عبر البريد"
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* French Translations */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Français (French)</h4>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="name_fr">Name (French)</Label>
                    <Input
                      id="name_fr"
                      value={formData.name_fr}
                      onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                      placeholder="Nom du plan en français"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_fr">Description (French)</Label>
                    <Textarea
                      id="description_fr"
                      value={formData.description_fr}
                      onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                      placeholder="Description du plan en français..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features_fr">Features (French - one per line)</Label>
                    <Textarea
                      id="features_fr"
                      value={formData.features_fr}
                      onChange={(e) => setFormData({ ...formData, features_fr: e.target.value })}
                      placeholder="Jusqu'à 3 enchères actives&#10;Analyses de base&#10;Support par email"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Spanish Translations */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Español (Spanish)</h4>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="name_es">Name (Spanish)</Label>
                    <Input
                      id="name_es"
                      value={formData.name_es}
                      onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                      placeholder="Nombre del plan en español"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_es">Description (Spanish)</Label>
                    <Textarea
                      id="description_es"
                      value={formData.description_es}
                      onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                      placeholder="Descripción del plan en español..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features_es">Features (Spanish - one per line)</Label>
                    <Textarea
                      id="features_es"
                      value={formData.features_es}
                      onChange={(e) => setFormData({ ...formData, features_es: e.target.value })}
                      placeholder="Hasta 3 subastas activas&#10;Análisis básico&#10;Soporte por correo"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.price} className="bg-[#B8071C] hover:bg-[#910515]">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : dialogMode === "create" ? (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
