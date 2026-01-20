"use client"

import { useState } from "react"
import Link from "next/link"

export default function DebugPage() {
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/db-test")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        error: "Failed to run tests",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#222222]">Database Debug Panel</h1>
            <Link href="/" className="text-[#717171] hover:text-[#222222] transition-colors">
              ← Back to Home
            </Link>
          </div>
          <p className="text-[#717171]">Test your database connection and verify all configurations are correct.</p>
        </div>

        {/* Test Button */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-4 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Running Tests..." : "Run Database Tests"}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Environment Variables */}
            {(results as any).environment && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-bold text-[#222222] mb-4">Environment Variables</h2>
                <div className="space-y-2">
                  {Object.entries((results as any).environment).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-mono text-sm text-[#717171]">{key}</span>
                      <span className={`font-mono text-sm ${value === "NOT SET" ? "text-destructive" : "text-green-600"}`}>
                        {value as string}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Results */}
            {Array.isArray((results as any)?.tests) && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-bold text-[#222222] mb-4">Test Results</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Test</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Error</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Code</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(results as any).tests.map((t: Record<string, unknown>, i: number) => (
                        <tr key={i} className={t.status === "FAILED" ? "bg-destructive/10" : ""}>
                          <td className="border px-4 py-2">{String(t.test)}</td>
                          <td className="border px-4 py-2">{String(t.status)}</td>
                          <td className="border px-4 py-2">{t.error ? String(t.error) : ""}</td>
                          <td className="border px-4 py-2">{t.code ? String(t.code) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Display */}
            {(results as any).error && (
              <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-red-700 mb-4">Error</h2>
                <p className="text-destructive font-mono">{(results as any).error}</p>
                {(results as any).message && <p className="text-destructive font-mono mt-2">{(results as any).message}</p>}
              </div>
            )}

            {/* Timestamp */}
            {(results as any).timestamp && (
              <div className="text-center text-sm text-[#717171]">
                Test run at: {new Date((results as any).timestamp).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!results && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Troubleshooting Steps</h2>
            <ol className="space-y-3 text-blue-800">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Make sure XAMPP is running and MySQL service is started</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Verify your .env.local file has the correct database credentials</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>
                  Run <code className="bg-blue-100 px-2 py-1 rounded">npm run db:setup</code> to create the database and
                  tables
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Click the button above to run diagnostic tests</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">5.</span>
                <span>Check the browser console and terminal for detailed error messages</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
