/**
 * Shared formatting utilities.
 */

/**
 * Format a dollar/rupee amount (not cents) as currency.
 *
 * Example: formatCurrency(1500.5, "USD") → "$1,500.50"
 * Example: formatCurrency(1500.5, "INR") → "₹1,500.50"
 */
export function formatCurrency(
  amount: number,
  currencyCode: "USD" | "INR" = "USD"
): string {
  const locale = currencyCode === "INR" ? "en-IN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert cents (integer) to a display-friendly currency string.
 *
 * Example: centsToDisplay(150025, "USD") → "$1,500.25"
 */
export function centsToDisplay(
  cents: number,
  currencyCode: "USD" | "INR" = "USD"
): string {
  return formatCurrency(cents / 100, currencyCode);
}
