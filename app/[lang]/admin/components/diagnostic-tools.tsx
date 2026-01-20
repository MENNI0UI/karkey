"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Wrench,
    Database,
    Image as ImageIcon,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { runDiagnostics } from "../actions"

interface DiagnosticResult {
    timestamp: string
    results: {
        vehiclePhotos: {
            totalPending: number
            withoutPhotos: number
            vehicles: Array<{
                id: number
                make: string
                model: string
                year: number
                photoCount: number
                hasPhotos: boolean
                owner: string
            }>
        } | null
        databaseHealth: {
            tables: Record<string, number>
            pending: Record<string, number>
            issues: {
                orphanedVehiclePhotos: number
                orphanedDirectSalePhotos: number
            }
        } | null
    }
    errors: {
        vehiclePhotos: string | null
        databaseHealth: string | null
    }
}

export function DiagnosticTools() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<DiagnosticResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [vehiclesExpanded, setVehiclesExpanded] = useState(false)

    const handleRunDiagnostics = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await runDiagnostics()
            if (response.success) {
                setResult(response as DiagnosticResult)
            } else {
                setError(response.error || "Failed to run diagnostics")
            }
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    const hasIssues = result && (
        (result.results.vehiclePhotos?.withoutPhotos || 0) > 0 ||
        (result.results.databaseHealth?.issues.orphanedVehiclePhotos || 0) > 0 ||
        (result.results.databaseHealth?.issues.orphanedDirectSalePhotos || 0) > 0
    )

    return (
        <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Wrench className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-[#103090]">Diagnostic Tools</CardTitle>
                            <p className="text-sm text-gray-500">System health checks and data integrity</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRunDiagnostics}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Run Diagnostics
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-6">
                        {/* Timestamp */}
                        <div className="text-sm text-gray-500">
                            Last run: {new Date(result.timestamp).toLocaleString()}
                        </div>

                        {/* Overall Status */}
                        <div className={`p-4 rounded-lg ${hasIssues ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                            <div className="flex items-center gap-2">
                                {hasIssues ? (
                                    <>
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-amber-700">Issues Found</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-green-700">All Systems Healthy</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Database Health */}
                        {result.results.databaseHealth && (
                            <div className="space-y-3">
                                <h4 className="font-semibold text-[#103090] flex items-center gap-2">
                                    <Database className="w-4 h-4" />
                                    Database Health
                                </h4>

                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {Object.entries(result.results.databaseHealth.tables).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-[#103090]">{value}</div>
                                            <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pending Items */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.entries(result.results.databaseHealth.pending).map(([key, value]) => (
                                        <Badge key={key} variant={value > 0 ? "default" : "secondary"} className={value > 0 ? "bg-amber-500" : ""}>
                                            {value} Pending {key}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Issues */}
                                {(result.results.databaseHealth.issues.orphanedVehiclePhotos > 0 ||
                                    result.results.databaseHealth.issues.orphanedDirectSalePhotos > 0) && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                                            <h5 className="font-medium text-red-700 mb-2">Orphaned Records</h5>
                                            <ul className="text-sm text-red-600 list-disc list-inside">
                                                {result.results.databaseHealth.issues.orphanedVehiclePhotos > 0 && (
                                                    <li>{result.results.databaseHealth.issues.orphanedVehiclePhotos} orphaned vehicle photos</li>
                                                )}
                                                {result.results.databaseHealth.issues.orphanedDirectSalePhotos > 0 && (
                                                    <li>{result.results.databaseHealth.issues.orphanedDirectSalePhotos} orphaned direct sale photos</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Vehicle Photos Check */}
                        {result.results.vehiclePhotos && (
                            <div className="space-y-3">
                                <h4 className="font-semibold text-[#103090] flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Pending Vehicles Photo Check
                                </h4>

                                <div className="flex gap-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <div className="text-lg font-bold text-blue-700">{result.results.vehiclePhotos.totalPending}</div>
                                        <div className="text-xs text-blue-600">Total Pending</div>
                                    </div>
                                    <div className={`rounded-lg p-3 text-center ${result.results.vehiclePhotos.withoutPhotos > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                        <div className={`text-lg font-bold ${result.results.vehiclePhotos.withoutPhotos > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                            {result.results.vehiclePhotos.withoutPhotos}
                                        </div>
                                        <div className={`text-xs ${result.results.vehiclePhotos.withoutPhotos > 0 ? 'text-red-600' : 'text-green-600'}`}>Without Photos</div>
                                    </div>
                                </div>

                                {/* Vehicle List (collapsible) */}
                                {result.results.vehiclePhotos.vehicles.length > 0 && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setVehiclesExpanded(!vehiclesExpanded)}
                                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                                        >
                                            {vehiclesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            {vehiclesExpanded ? 'Hide' : 'Show'} vehicle details
                                        </button>

                                        {vehiclesExpanded && (
                                            <div className="mt-2 border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">ID</th>
                                                            <th className="px-3 py-2 text-left">Vehicle</th>
                                                            <th className="px-3 py-2 text-left">Owner</th>
                                                            <th className="px-3 py-2 text-center">Photos</th>
                                                            <th className="px-3 py-2 text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.results.vehiclePhotos.vehicles.map(v => (
                                                            <tr key={v.id} className="border-t">
                                                                <td className="px-3 py-2">{v.id}</td>
                                                                <td className="px-3 py-2">{v.year} {v.make} {v.model}</td>
                                                                <td className="px-3 py-2 text-gray-600">{v.owner}</td>
                                                                <td className="px-3 py-2 text-center">{v.photoCount}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    {v.hasPhotos ? (
                                                                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                                    ) : (
                                                                        <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!result && !error && (
                    <div className="text-center py-8 text-gray-500">
                        <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Click "Run Diagnostics" to check system health</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
