import { LuxuryLoader } from "@/components/ui/luxury-loader";

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white/50 backdrop-blur-sm">
      <LuxuryLoader size="lg" />
    </main>
  );
}
