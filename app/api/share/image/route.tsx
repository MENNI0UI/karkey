import { ImageResponse } from '@vercel/og';
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

// Load fonts from local public directory - cached at module level for speed
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Cairo-Bold.ttf');
const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Cairo-Regular.ttf');

const fontData = fs.readFileSync(fontPath);
const regularFontData = fs.readFileSync(regularFontPath);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ids = searchParams.get("ids")?.split(",") || [];
        const lang = searchParams.get("lang") || "en";
        const isAr = lang === "ar";

        const idList = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (idList.length === 0) {
            return new Response("No IDs provided", { status: 400 });
        }

        // Fetch more details for comprehensive comparison
        const vehicles = await prisma.direct_sales.findMany({
            where: { id: { in: idList } },
            select: {
                id: true,
                make: true,
                model: true,
                price: true,
                year: true,
                mileage: true,
                fuel_type: true,
                transmission: true,
                location: true,
                direct_sale_photos: {
                    take: 1,
                    orderBy: { position_order: 'asc' }
                }
            },
        });

        if (vehicles.length === 0) {
            return new Response("No vehicles found", { status: 404 });
        }

        // Colors - Fakhma Palette
        const primaryColor = "#0A1E5C"; // Deep Navy
        const goldAccent = "#DEB735"; // Karkey Gold
        const silverAccent = "#94A3B8"; // Premium Silver
        const bgLight = "#F8FAFC";
        const bestColor = "#B8071C"; // Winning Red

        // Translations
        const t = {
            title: isAr ? "مقارنة السيارات" : "Car Comparison",
            price: isAr ? "السعر" : "Price",
            year: isAr ? "السنة" : "Year",
            mileage: isAr ? "المسافة" : "Mileage",
            fuel: isAr ? "الوقود" : "Fuel",
            transmission: isAr ? "ناقل الحركة" : "Transmission",
            location: isAr ? "الموقع" : "Location",
            automatic: isAr ? "أوتوماتيك" : "Automatic",
            manual: isAr ? "يدوي" : "Manual",
            diesel: isAr ? "ديزل" : "Diesel",
            gasoline: isAr ? "بنزين" : "Gasoline",
            electric: isAr ? "كهربائي" : "Electric",
            hybrid: isAr ? "هجين" : "Hybrid",
            best: isAr ? "الأفضل" : "Best",
        };

        // Find best values for highlighting
        const prices = vehicles.map(v => Number(v.price));
        const mileages = vehicles.map(v => v.mileage || Infinity);
        const years = vehicles.map(v => v.year);

        const lowestPrice = Math.min(...prices);
        const lowestMileage = Math.min(...mileages);
        const newestYear = Math.max(...years);

        // High-fidelity layout
        const width = 1200;
        const height = 1250; // Increased height for comprehensive table

        return new ImageResponse(
            (
                <div
                    dir={isAr ? "rtl" : "ltr"}
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: bgLight,
                        fontFamily: '"Cairo"',
                        padding: '40px',
                        position: 'relative',
                    }}
                >
                    {/* Decorative Background Pattern */}
                    <div style={{ position: 'absolute', top: 0, ...(isAr ? { left: 0 } : { right: 0 }), width: '400px', height: '100%', background: `linear-gradient(${isAr ? '225deg' : '135deg'}, rgba(16,48,144,0.03) 0%, transparent 100%)`, transform: 'skewX(-15deg)' }} />

                    {/* Premium Header */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: isAr ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '35px',
                            padding: '35px 45px',
                            background: `linear-gradient(135deg, ${primaryColor}, #051030)`,
                            borderRadius: '32px',
                            boxShadow: '0 20px 40px rgba(10,30,92,0.15)',
                            borderBottom: `4px solid ${goldAccent}`,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: isAr ? 'right' : 'left' }}>
                            <div style={{ display: 'flex', fontSize: 44, fontWeight: 'bold', color: 'white', letterSpacing: '-0.02em', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>
                                {t.title}
                            </div>
                            <div style={{ display: 'flex', fontSize: 18, color: goldAccent, fontWeight: 700, opacity: 0.9, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>
                                {vehicles.length} {isAr ? "مركبات تم مقارنتها" : "Comparing Vehicles"} • {new Date().toLocaleDateString(isAr ? 'ar-MA' : 'fr-MA')}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAr ? 'flex-start' : 'flex-end' }}>
                            <div style={{ display: 'flex', fontSize: 32, color: 'white', fontWeight: 'bold' }}>
                                KARKEY<span style={{ color: goldAccent }}>.SPACE</span>
                            </div>
                            <div style={{ display: 'flex', fontSize: 12, color: 'white', opacity: 0.5, letterSpacing: '0.2em' }}>
                                PROFESSIONAL PORTFOLIO
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Hero Cards */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: isAr ? 'row-reverse' : 'row',
                            gap: '20px',
                            marginBottom: '30px'
                        }}
                    >
                        {vehicles.slice(0, 4).map((v) => {
                            const photoUrl = v.direct_sale_photos[0]?.photo_url;
                            const isBestPrice = Number(v.price) === lowestPrice && vehicles.length > 1;

                            return (
                                <div
                                    key={v.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1,
                                        backgroundColor: 'white',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                                        border: isBestPrice ? `2px solid ${bestColor}` : '1px solid #E2E8F0',
                                        position: 'relative',
                                    }}
                                >
                                    {isBestPrice && (
                                        <div style={{ position: 'absolute', top: '12px', ...(isAr ? { left: '15px' } : { right: '15px' }), backgroundColor: bestColor, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>
                                            {isAr ? "أفضل قيمة" : "BEST VALUE"}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', width: '100%', height: '180px', backgroundColor: '#F1F5F9' }}>
                                        {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: silverAccent }}>N/A</div>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', textAlign: isAr ? 'right' : 'left' }}>
                                        <div style={{ display: 'flex', fontSize: 20, fontWeight: 'bold', color: primaryColor, marginBottom: '2px', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>{v.make}</div>
                                        <div style={{ display: 'flex', fontSize: 12, color: silverAccent, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>{v.model}</div>
                                        <div style={{ display: 'flex', padding: '10px', backgroundColor: isBestPrice ? 'rgba(184,7,28,0.03)' : '#F8FAFC', borderRadius: '12px', border: isBestPrice ? `1px solid rgba(184,7,28,0.1)` : '1px solid #F1F5F9', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', fontSize: 18, fontWeight: 'bold', color: isBestPrice ? bestColor : primaryColor }}>
                                                <span style={{ fontSize: 12, margin: '0 4px', opacity: 0.5, marginTop: '6px' }}>MAD</span> {new Intl.NumberFormat(isAr ? "ar-MA" : "fr-MA").format(Number(v.price))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Technical Comparison Table */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            borderRadius: '28px',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            flex: 1,
                            boxShadow: '0 15px 35px rgba(0,0,0,0.03)'
                        }}
                    >
                        {/* Table Header Row */}
                        <div style={{ display: 'flex', flexDirection: isAr ? 'row-reverse' : 'row', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <div style={{ width: '250px', padding: '20px 25px', display: 'flex', alignItems: 'center', borderRight: isAr ? 'none' : '1px solid #E2E8F0', borderLeft: isAr ? '1px solid #E2E8F0' : 'none' }}>
                                <div style={{ display: 'flex', fontSize: 14, fontWeight: 'bold', color: primaryColor, opacity: 0.6 }}>{isAr ? "المواصفات الفنية" : "TECHNICAL SPECS"}</div>
                            </div>
                            {vehicles.map(v => (
                                <div key={v.id} style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: isAr ? 'none' : '1px solid #F1F5F9', borderLeft: isAr ? '1px solid #F1F5F9' : 'none', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', fontSize: 14, fontWeight: 'bold', color: primaryColor }}>{v.make}</div>
                                </div>
                            ))}
                        </div>

                        {/* Data Rows */}
                        {[
                            { label: t.year, key: 'year', suffix: '' },
                            { label: t.mileage, key: 'mileage', suffix: ' KM', format: (v: any) => v.mileage?.toLocaleString() || '0' },
                            {
                                label: t.fuel, key: 'fuel_type', suffix: '', format: (v: any) => {
                                    const fuelMap: any = { diesel: t.diesel, gasoline: t.gasoline, electric: t.electric, hybrid: t.hybrid };
                                    return fuelMap[(v.fuel_type || '').toLowerCase()] || v.fuel_type || t.diesel;
                                }
                            },
                            { label: t.transmission, key: 'transmission', suffix: '', format: (v: any) => (v.transmission || '').toLowerCase().includes('auto') ? t.automatic : t.manual },
                            { label: t.location, key: 'location', suffix: '' }
                        ].map((row, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: isAr ? 'row-reverse' : 'row', borderBottom: idx === 4 ? 'none' : '1px solid #F8FAFC' }}>
                                <div style={{ width: '250px', padding: '18px 25px', display: 'flex', alignItems: 'center', backgroundColor: '#FBFCFE', borderRight: isAr ? 'none' : '1px solid #F1F5F9', borderLeft: isAr ? '1px solid #F1F5F9' : 'none' }}>
                                    <div style={{ display: 'flex', fontSize: 13, fontWeight: 'bold', color: '#64748B' }}>{row.label}</div>
                                </div>
                                {vehicles.map(v => {
                                    const val = row.format ? row.format(v) : (v as any)[row.key];
                                    const isBest = (row.key === 'price' && (v as any).price === lowestPrice) ||
                                        (row.key === 'mileage' && (v as any).mileage === lowestMileage) ||
                                        (row.key === 'year' && (v as any).year === newestYear);

                                    return (
                                        <div key={v.id} style={{ flex: 1, padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: isAr ? 'none' : '1px solid #F8FAFC', borderLeft: isAr ? '1px solid #F8FAFC' : 'none' }}>
                                            <div style={{ display: 'flex', fontSize: 14, fontWeight: isBest ? '900' : '500', color: isBest ? bestColor : primaryColor }}>
                                                {val}{row.suffix}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Premium Footer */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: isAr ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '25px',
                            padding: '24px 40px',
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            border: '1px solid #E2E8F0',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isAr ? 'row-reverse' : 'row' }}>
                            <div style={{ display: 'flex', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: goldAccent }}></div>
                            <div style={{ display: 'flex', fontSize: 13, color: primaryColor, fontWeight: 'bold' }}>
                                {isAr ? "تحليل كركي الاحترافي المعتمد" : "Certified Karkey Professional Analysis"}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexDirection: isAr ? 'row-reverse' : 'row' }}>
                            <div style={{ display: 'flex', fontSize: 14, color: primaryColor, fontWeight: '900' }}>
                                WWW.KARKEY.SPACE
                            </div>
                            <div style={{ display: 'flex', width: '1px', height: '16px', backgroundColor: '#E2E8F0' }}></div>
                            <div style={{ display: 'flex', fontSize: 12, color: silverAccent, fontWeight: 'bold' }}>
                                © {new Date().getFullYear()}
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: width,
                height: height,
                fonts: [
                    {
                        name: 'Cairo',
                        data: fontData,
                        style: 'normal',
                        weight: 700,
                    },
                    {
                        name: 'Cairo',
                        data: regularFontData,
                        style: 'normal',
                        weight: 400,
                    },
                ],
            },
        );
    } catch (e: any) {
        console.error("Image generation error:", e);
        return new Response(`Error: ${e.message}`, { status: 500 });
    }
}
