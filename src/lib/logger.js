import { parseDeviceOS } from './device';
import { shouldLogTap, hashIp } from './debounce';
import { createTapLog } from './db';

/**
 * Perform asynchronous, non-blocking tap logging.
 *
 * @param {Object} params
 * @param {string} params.card_id
 * @param {string} params.device_os
 * @param {string} params.user_agent
 * @param {string} [params.ip_hash]
 * @param {number} [params.selected_stars]
 * @returns {Promise<Object|null>}
 */
export async function logTapAsync({
  card_id,
  device_os,
  user_agent,
  ip_hash,
  selected_stars = null,
}) {
  return createTapLog({
    card_id,
    device_os,
    user_agent,
    ip_hash,
    selected_stars,
  }).catch((err) => {
    console.error('[logger] Failed to asynchronously record tap log:', err);
    return null;
  });
}

/**
 * Handle incoming physical tap telemetry with anti-spam debouncing.
 * Non-blocking fire-and-forget: does not block the caller or delay response rendering.
 *
 * @param {Object} params
 * @param {string} params.cardId
 * @param {string} [params.clientIp='']
 * @param {string} [params.userAgent='']
 * @param {number} [params.selectedStars]
 * @returns {boolean} true if tap was accepted and queued for logging, false if debounced
 */
export function handleTapTelemetry({
  cardId,
  clientIp = '',
  userAgent = '',
  selectedStars = null,
}) {
  if (!shouldLogTap(cardId, clientIp, userAgent)) {
    return false; // Suppressed by < 5-second anti-spam debounce
  }

  // Fire and forget asynchronous database insert
  const os = parseDeviceOS(userAgent);
  const ipHash = hashIp(clientIp);

  logTapAsync({
    card_id: cardId,
    device_os: os,
    user_agent: userAgent,
    ip_hash: ipHash,
    selected_stars: selectedStars,
  }).catch((err) => {
    console.error('[logger] Error in fire-and-forget telemetry:', err);
  });

  return true;
}
