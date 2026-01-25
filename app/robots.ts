import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/auth/',
                '/*/profile/',
                '/*/admin/',
            ],
        },
        sitemap: 'https://karkey.space/sitemap.xml',
    };
}
