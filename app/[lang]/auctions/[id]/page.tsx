import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AuctionBidClient from './AuctionBidClient';

interface Props {
  params: Promise<{ id: string; lang: string }>;
}

async function getAuction(id: string) {
  try {
    const auction = await prisma.direct_sales.findUnique({
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

    if (!auction || !auction.auction_mode) return null;

    // Map Prisma relations to the expected structure
    return {
      ...auction,
      seller: auction.users_direct_sales_user_idTousers ? {
        name: `${auction.users_direct_sales_user_idTousers.first_name || ''} ${auction.users_direct_sales_user_idTousers.last_name || ''}`.trim() || auction.users_direct_sales_user_idTousers.username,
        username: auction.users_direct_sales_user_idTousers.username,
        profile_picture: auction.users_direct_sales_user_idTousers.profile_picture,
      } : null,
      photos: auction.direct_sale_photos?.map(p => p.photo_url) || []
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  const auction = await getAuction(id);

  if (!auction) return { title: 'Auction Not Found' };

  const title = `${auction.make} ${auction.model} (${auction.year}) | Karkey Auction`;
  const description = auction.description?.substring(0, 160) || `Join the auction for this ${auction.make} ${auction.model} in ${auction.location}. High-quality verified vehicle.`;

  const photos = auction.photos;
  const image = photos.length > 0 ? photos[0] : '/logo.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id, lang } = await params;
  const auction = await getAuction(id);

  if (!auction) {
    notFound();
  }

  // Convert to plain object for client component
  const initialAuction = JSON.parse(JSON.stringify(auction));

  // JSON-LD Structured Data for Google/SEO (Auction Type)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": `${auction.make} ${auction.model} ${auction.year}`,
    "description": auction.description,
    "image": auction.photos,
    "brand": {
      "@type": "Brand",
      "name": auction.make
    },
    "model": auction.model,
    "modelDate": auction.year,
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": auction.auction_starting_price,
      "priceCurrency": "MAD",
      "offerCount": auction.auction_bid_count || "1",
      "url": `https://karkey.space/${lang}/auctions/${id}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuctionBidClient
        id={id}
        initialAuction={initialAuction}
      />
    </>
  );
}
