/**
 * Safely converts a string to lowercase using the specified locale.
 * Fallbacks to manual Turkish letter replacement if the JS engine does not support the locale (common in older mobile browsers/webviews).
 */
export function safeLocaleLowerCase(str: string | null | undefined, locale: string = 'tr-TR'): string {
  if (!str) return '';
  try {
    return str.toLocaleLowerCase(locale);
  } catch (e) {
    if (locale === 'tr-TR' || locale.startsWith('tr')) {
      return str
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ğ/g, 'ğ')
        .replace(/Ü/g, 'ü')
        .replace(/Ş/g, 'ş')
        .replace(/Ö/g, 'ö')
        .replace(/Ç/g, 'ç')
        .toLowerCase();
    }
    return str.toLowerCase();
  }
}

/**
 * Normalizes a string for search comparison:
 * 1. Converts to lowercase safely.
 * 2. Replaces Turkish specific characters with their English/ASCII equivalents.
 * 3. Strips redundant whitespace.
 * This guarantees that queries like "omer", "Ömer", "OMER", "ömer" all match each other.
 */
export function normalizeSearchString(str: string | null | undefined): string {
  if (!str) return '';
  const lower = safeLocaleLowerCase(str, 'tr-TR');
  return lower
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();
}
