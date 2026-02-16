import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import DirectSaleClient from './DirectSaleClient';

interface Props {
  params: Promise<{ id: string; lang: string }>;
}

async function getVehicle(id: string) {
  try {
    const vehicle = await prisma.direct_sales.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        users_direct_sales_user_idTousers: {
          select: {
            first_name: true,
            last_name: true,
            username: true,
            profile_picture: true,
          }
        },
        direct_sale_photos: {
          orderBy: { position_order: 'asc' }
        }
      }
    });

    if (!vehicle || vehicle.auction_mode) return null;

    // Map Prisma relations to the expected structure
    return {
      ...vehicle,
      seller: vehicle.users_direct_sales_user_idTousers ? {
        name: `${vehicle.users_direct_sales_user_idTousers.first_name || ''} ${vehicle.users_direct_sales_user_idTousers.last_name || ''}`.trim() || vehicle.users_direct_sales_user_idTousers.username,
        username: vehicle.users_direct_sales_user_idTousers.username,
        profile_picture: vehicle.users_direct_sales_user_idTousers.profile_picture,
      } : null,
      photos: vehicle.direct_sale_photos?.map(p => p.photo_url) || []
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) return { title: 'Listing Not Found' };

  const title = `Buy ${vehicle.make} ${vehicle.model} (${vehicle.year}) in ${vehicle.location} | Karkey`;
  const description = vehicle.description?.substring(0, 160) || `Explore this ${vehicle.make} ${vehicle.model} available for sale in ${vehicle.location}. Verified seller and high-quality guaranteed.`;

  const photos = vehicle.photos;
  const image = photos.length > 0 ? photos[0] : '/logo.png';

  const localizedTitle = lang === 'ar' ? `اشتري ${vehicle.make} ${vehicle.model} في ${vehicle.location} | كاركي` : title;

  return {
    title: localizedTitle,
    description,
    openGraph: {
      title: localizedTitle,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: localizedTitle,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id, lang } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  const initialVehicle = JSON.parse(JSON.stringify(vehicle));

  // JSON-LD Structured Data for Google/SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
    "description": vehicle.description,
    "image": vehicle.photos,
    "brand": {
      "@type": "Brand",
      "name": vehicle.make
    },
    "model": vehicle.model,
    "modelDate": vehicle.year,
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": vehicle.mileage,
      "unitCode": "KMT"
    },
    "vehicleTransmission": vehicle.transmission,
    "fuelType": vehicle.fuel_type,
    "offers": {
      "@type": "Offer",
      "price": vehicle.price,
      "priceCurrency": "MAD",
      "availability": "https://schema.org/InStock",
      "url": `https://karkey.space/${lang}/direct-sales/${id}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DirectSaleClient
        id={id}
        initialVehicle={initialVehicle}
        language={lang}
      />
    </>
  );
}
