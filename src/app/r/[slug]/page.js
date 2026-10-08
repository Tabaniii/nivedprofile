import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCardBySlug } from '@/lib/db';
import { handleTapTelemetry } from '@/lib/logger';
import RatingClientView from './RatingClientView';
import FallbackView from './FallbackView';

export const instant = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);

  if (!card) {
    return {
      title: 'Card Not Found — Reputation Shield',
      description: 'Physical NFC card review page',
    };
  }

  return {
    title: `${card.store_name} — Rate & Review`,
    description: `Share your experience at ${card.store_name}`,
  };
}

export default async function CardRoutePage({ params }) {
  const { slug } = await params;

  // Retrieve incoming request headers for telemetry
  const headerList = await headers();
  const userAgent = headerList.get('user-agent') || '';
  const clientIp =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    '';

  // 1. Fetch card configuration by slug
  const card = await getCardBySlug(slug);

  // 2. Fallback if card is missing / invalid
  if (!card) {
    return <FallbackView slug={slug} />;
  }

  // 3. Direct Mode (Subscription inactive): HTTP 307 instant redirect to Google Review
  if (!card.is_shield_active) {
    // Fire-and-forget telemetry without blocking redirect
    handleTapTelemetry({
      cardId: card.id,
      clientIp,
      userAgent,
    });

    redirect(card.google_review_url);
  }

  // 4. Shield Mode (Active): Fire-and-forget telemetry and render Rating UI
  handleTapTelemetry({
    cardId: card.id,
    clientIp,
    userAgent,
  });

  return <RatingClientView card={card} />;
}
