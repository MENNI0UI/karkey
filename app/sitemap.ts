import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://karkey.space';
    const locales = ['en', 'fr', 'ar', 'es'];
    const staticRoutes = ['', '/auctions', '/direct-sales', '/karkey-cars', '/plans', '/about', '/auth/login', '/auth/register'];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Generate Static Route Entries
    locales.forEach((lang) => {
        staticRoutes.forEach((route) => {
            sitemapEntries.push({
                url: `${baseUrl}/${lang}${route}`,
                lastModified: new Date(),
                changeFrequency: route === '' || route === '/auctions' || route === '/direct-sales' ? 'daily' : 'weekly',
                priority: route === '' ? 1.0 : (route === '/auctions' || route === '/direct-sales' ? 0.9 : 0.7),
            });
        });
    });

    try {
        // 2. Fetch All Active Listings
        const [directSales, karkeyCars] = await Promise.all([
            prisma.direct_sales.findMany({
                where: { verification_status: 'approved', sale_status: 'available' },
                select: { id: true, updated_at: true, auction_mode: true }
            }),
            prisma.karkey_cars.findMany({
                where: { is_active: true },
                select: { id: true, updated_at: true }
            })
        ]);

        // 3. Add Dynamic Direct Sales & Auctions
        directSales.forEach((ds) => {
            const path = ds.auction_mode ? '/auctions' : '/direct-sales';
            locales.forEach((lang) => {
                sitemapEntries.push({
                    url: `${baseUrl}/${lang}${path}/${ds.id}`,
                    lastModified: ds.updated_at,
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            });
        });

        // 4. Add Dynamic Karkey Cars
        karkeyCars.forEach((kc) => {
            locales.forEach((lang) => {
                sitemapEntries.push({
                    url: `${baseUrl}/${lang}/karkey-cars/${kc.id}`,
                    lastModified: kc.updated_at,
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            });
        });
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    return sitemapEntries;
}
