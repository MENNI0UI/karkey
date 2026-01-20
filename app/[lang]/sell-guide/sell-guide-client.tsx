"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Check, X, ChevronRight, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

type SellType = "auction" | "showroom" | "direct-sale";

export default function SellGuideClient({ lang }: { lang: string }) {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'auth' | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const content = {
        title: t("sell_guide.unified.title"),
        subtitle: t("sell_guide.unified.subtitle"),
        description: t("sell_guide.unified.description"),
        steps: [
            { num: "01", title: t("sell_guide.unified.step1_title"), desc: t("sell_guide.unified.step1_desc") },
            { num: "02", title: t("sell_guide.unified.step2_title"), desc: t("sell_guide.unified.step2_desc") },
            { num: "03", title: t("sell_guide.unified.step3_title"), desc: t("sell_guide.unified.step3_desc") }
        ],
        benefits: [
            t("sell_guide.unified.benefit1"),
            t("sell_guide.unified.benefit2"),
            t("sell_guide.unified.benefit3")
        ],
        faqs: [
            { q: t("sell_guide.unified.faq1_q"), a: t("sell_guide.unified.faq1_a") },
            { q: t("sell_guide.unified.faq2_q"), a: t("sell_guide.unified.faq2_a") },
            { q: t("sell_guide.unified.faq3_q"), a: t("sell_guide.unified.faq3_a") }
        ],
        ctaLink: `/${lang}/direct-sales/create`,
        ctaText: t("sell_guide.unified.cta")
    };

    const handleStartClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            setModalType('auth');
            setShowModal(true);
            return;
        }

        router.push(content.ctaLink);
    };

    return (
        <div className="min-h-screen bg-[#FAFBFC]">
            {/* Header Section - Compact */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-10 text-center">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 font-display tracking-tight">
                        {content.title}
                    </h1>
                    <p className="text-base text-gray-500 max-w-lg mx-auto">
                        {content.description}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="grid md:grid-cols-5 gap-8">

                    {/* Steps Section */}
                    <div className="md:col-span-3">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
                            {t("sell_guide.how_it_works")}
                        </h2>
                        <div className="space-y-0">
                            {content.steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`group flex gap-5 py-5 transition-colors hover:bg-gray-50/50 -mx-3 px-3 rounded-lg ${idx < content.steps.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <span className="text-2xl font-bold text-[#B8071C]/15 group-hover:text-[#B8071C]/30 font-display w-10 flex-shrink-0 transition-colors">
                                        {step.num}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-[#B8071C] transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FAQ Section */}
                        <div className="mt-10">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                                {t("sell_guide.faq")}
                            </h2>
                            <div className="space-y-2">
                                {content.faqs.map((faq, idx) => (
                                    <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="text-sm font-medium text-gray-900">{faq.q}</span>
                                            <ChevronDown
                                                size={18}
                                                className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${openFaq === idx ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {openFaq === idx && (
                                            <div className="px-4 pb-4 pt-0">
                                                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Benefits & CTA Section */}
                    <div className="md:col-span-2 space-y-4">
                        {/* Benefits Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-xl shadow-gray-900/10">
                            <h3 className="font-semibold text-sm mb-5 text-gray-100">
                                {t("sell_guide.why_choose_this")}
                            </h3>
                            <ul className="space-y-3 mb-6">
                                {content.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                        <div className="w-4 h-4 rounded-full bg-[#00A651]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check size={10} className="text-[#00A651]" strokeWidth={3} />
                                        </div>
                                        <span className="text-gray-300 text-sm leading-relaxed">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleStartClick}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#B8071C] hover:bg-[#a00618] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B8071C]/25"
                            >
                                {content.ctaText}
                                <ArrowRight size={16} />
                            </button>
                            <p className="text-center text-[11px] text-gray-500 mt-4">
                                {t("sell_guide.signin_verification_required")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        {modalType === 'auth' && (
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-[#B8071C]/10 flex items-center justify-center mx-auto mb-4">
                                    <ArrowRight size={20} className="text-[#B8071C]" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {t("sell_guide.signin_required_title")}
                                </h3>
                                <p className="text-gray-500 mb-5 text-sm">
                                    {t("sell_guide.signin_required_desc")}
                                </p>
                                <div className="space-y-2.5">
                                    <Link
                                        href={`/${lang}/auth/login?redirect=${encodeURIComponent(`/${lang}/direct-sales/create`)}`}
                                        className="block w-full py-3 px-4 rounded-xl bg-[#B8071C] text-white font-semibold hover:bg-[#a00618] transition-colors"
                                    >
                                        {t("auth.login.submit")}
                                    </Link>
                                    <Link
                                        href={`/${lang}/auth/register?redirect=${encodeURIComponent(`/${lang}/direct-sales/create`)}`}
                                        className="block w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        {t("auth.login.signup")}
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
