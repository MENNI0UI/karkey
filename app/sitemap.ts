import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://karkey.space';
    const locales = ['en', 'fr', 'ar', 'es'];
    const routes = ['', '/auctions', '/direct-sales', '/karkey-cars', '/plans', '/about'];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    locales.forEach((lang) => {
        routes.forEach((route) => {
            sitemapEntries.push({
                url: `${baseUrl}/${lang}${route}`,
                lastModified: new Date(),
                changeFrequency: route === '' || route === '/auctions' || route === '/direct-sales' ? 'daily' : 'weekly',
                priority: route === '' ? 1.0 : route === '/auctions' || route === '/direct-sales' ? 0.8 : 0.5,
            });
        });
    });

    return sitemapEntries;
}
