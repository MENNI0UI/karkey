export const dynamic = "force-dynamic"

import { Card, CardContent } from "@/components/ui/card"
import { Shield, CheckCircle2, Globe, Lock, Users, TrendingUp, Award, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-[#222222] mb-4">About Karkey</h1>
          <p className="text-lg text-[#717171] font-medium mb-3">
            Driving Morocco&apos;s Automotive Future, One Auction at a Time
          </p>
          <p className="text-base text-[#717171] leading-relaxed max-w-4xl mx-auto">
            Karkey is a next-generation Moroccan platform built to revolutionize how people buy and sell cars online.
            Born from the need for trust, security, and transparency, Karkey connects verified buyers and sellers
            through a modern digital auction system — fully managed under the supervision of a bank-controlled escrow
            service.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#222222] mb-4">Our Story</h2>
          <p className="text-base text-[#717171] leading-relaxed mb-3">
            Karkey was created with one mission:{" "}
            <strong>To modernize car trading in Morocco and make it as secure and seamless as possible.</strong>
          </p>
          <p className="text-base text-[#717171] leading-relaxed mb-3">
            In a world where online car marketplaces often lack verification and trust, Karkey steps in to offer
            something new — a verified, bank-integrated, and fully transparent ecosystem that empowers users to sell
            and buy vehicles safely.
          </p>
          <p className="text-base text-[#717171] leading-relaxed">
            We combine the spirit of Moroccan innovation with advanced web technology to deliver a marketplace that
            reflects both our tradition of trust and our digital future.
          </p>
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-md rounded-xl">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h2 className="text-xl font-bold text-[#222222] mb-3">Our Vision</h2>
                <p className="text-sm text-[#717171] leading-relaxed">
                  To become Morocco&apos;s most trusted and innovative car auction platform, offering a transparent,
                  secure, and inclusive digital space where everyone — from private sellers to professional dealers —
                  can trade vehicles with confidence and peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md rounded-xl">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h2 className="text-xl font-bold text-[#222222] mb-3">Our Mission</h2>
                <p className="text-sm text-[#717171] leading-relaxed mb-3">
                  To simplify and secure every car transaction through:
                </p>
                <ul className="space-y-1.5 text-[#717171] text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Verified accounts (Email verification)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Transparent auctions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Escrow-protected payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Real-time bidding and fair competition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span>Admin-supervised verification for every vehicle</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#222222] text-center mb-8">Our Core Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Security First</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  All payments are processed through our partner bank&apos;s escrow system. Buyer and seller deposits
                  protect both sides from fraud.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Transparency Always</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  Every listing is verified. Every auction is open. No hidden offers or fake users.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Simplicity by Design</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  The platform is intuitive — no technical knowledge required. From registration to delivery, each
                  step is guided and clear.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Moroccan Identity</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  Karkey embraces local design, culture, and values. Our interface, colors, and user experience are
                  inspired by Moroccan aesthetics and hospitality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#222222] text-center mb-8">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "1",
                title: "Register and Verify",
                desc: "Create an account and verify your email to get started securely.",
              },
              {
                step: "2",
                title: "List or Bid",
                desc: "Verified users can sell their car or bid on existing listings.",
              },
              {
                step: "3",
                title: "Pay Securely",
                desc: "All deposits and payments are handled by our partner bank through escrow.",
              },
              {
                step: "4",
                title: "Win and Deliver",
                desc: "Once a buyer wins, Karkey ensures a safe delivery process — with or without an inspector.",
              },
              {
                step: "5",
                title: "Funds Released",
                desc: "The bank releases funds only after both sides confirm the successful handover.",
              },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-[#FF385C] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-semibold text-[#222222] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#717171] leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#222222] text-center mb-8">Who We Serve</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Private Sellers</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  Individual car owners who want to reach a large audience safely.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Buyers</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  Everyday drivers, collectors, and car enthusiasts who want to bid transparently.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-5 h-5 text-[#FF385C]" />
                </div>
                <h3 className="text-base font-semibold text-[#222222] mb-2">Dealers & Companies</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
                  Professional car resellers, showrooms, and fleet operators who need reliable, data-backed tools and
                  subscription plans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#222222] mb-4">Our Technology</h2>
          <p className="text-base text-[#717171] leading-relaxed mb-4">
            Karkey is built with cutting-edge technology for performance, scalability, and reliability:
          </p>
          <ul className="space-y-2 text-[#717171] text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Frontend:</strong> Next.js + Tailwind CSS (fast, mobile-first, and PWA optimized)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Backend:</strong> Node.js (Express.js) with MySQL for stability and real-time operations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Security:</strong> HTTPS, JWT authentication, encrypted data storage, and verified accounts
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Hosting:</strong> Cloud-based infrastructure (AWS / OVH Morocco) ensuring 99.5% uptime
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
              <span>
                <strong>Payments:</strong> Fully integrated with Moroccan banks under escrow regulations
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#222222] mb-4">Why Choose Karkey</h2>
          <p className="text-base text-[#717171] leading-relaxed mb-3">Because trust should not be optional.</p>
          <p className="text-sm text-[#717171] leading-relaxed mb-3">
            With Karkey, every step — from listing to payment — is verified, secure, and fully transparent. We don&apos;t
            just connect buyers and sellers — we connect trust with technology.
          </p>
          <p className="text-sm text-[#717171] leading-relaxed">
            Whether you&apos;re selling your first car or managing a fleet of vehicles, Karkey is your partner for safe,
            smart, and successful transactions.
          </p>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#222222] mb-3">Join Karkey Today</h2>
          <p className="text-base text-[#717171] mb-4">
            Experience the future of car auctions in Morocco. Register today and become part of a verified community
            that&apos;s redefining how Morocco buys and sells cars.
          </p>
          <p className="text-lg font-semibold text-[#FF385C]">
            Sell smarter. Buy safer. Drive with confidence — only with Karkey.
          </p>
        </div>
      </section>
    </div>
  )
}
