import { redirect } from "next/navigation";

export default async function CreateAuctionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/direct-sales/create`);
}
