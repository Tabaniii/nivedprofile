/**
 * Clean a phone number string by removing non-digits.
 *
 * @param {string} [phone='']
 * @returns {string}
 */
export function normalizePhoneNumber(phone = '') {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

/**
 * Format a WhatsApp direct chat URL with pre-filled message text.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - Destination WhatsApp phone number
 * @param {string} params.storeName - Name of the store
 * @param {number|string} params.rating - Customer's star rating (1-5)
 * @param {string} [params.feedbackText] - Optional customer feedback message
 * @returns {string|null} Complete WhatsApp link or null if phone number is missing
 */
export function formatWhatsAppUrl({ phoneNumber, storeName, rating, feedbackText }) {
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  if (!cleanPhone) return null;

  const fallbackMsg = 'Saya ingin menyampaikan masukan langsung.';
  const messageBody = feedbackText && feedbackText.trim() ? feedbackText.trim() : fallbackMsg;
  const store = storeName ? storeName.trim() : 'Store';
  const text = `Halo Tim ${store}, saya baru saja berkunjung (Rating ${rating}/5). Masukan saya: ${messageBody}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
