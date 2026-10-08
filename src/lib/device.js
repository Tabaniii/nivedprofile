/**
 * Parse raw user-agent header into normalized device OS category:
 * 'iOS', 'Android', or 'Other'.
 *
 * @param {string} [userAgent='']
 * @returns {'iOS' | 'Android' | 'Other'}
 */
export function parseDeviceOS(userAgent = '') {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'Other';
  }
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'iOS';
  }
  if (/android/.test(ua)) {
    return 'Android';
  }
  return 'Other';
}
