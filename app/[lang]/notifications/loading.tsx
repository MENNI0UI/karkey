export default function NotificationsLoading() {
  return (
    <main className="min-h-screen bg-[#FAFBFC] pt-6 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}
