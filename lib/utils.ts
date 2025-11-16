
/**
 * @brief Converts an amount in cents to a formatted USD currency string.
 * @param cents - The amount in cents to convert.
 * @returns A string representing the amount in USD format.
 */
export function centsToUSD(cents: number): string {
    const usd = new Intl.NumberFormat('en-US', 
        { style: 'currency', currency: 'USD' });
    return usd.format(cents / 100)
}

/**
* @brief Formats a time duration given in seconds into a string in the format "mm:ss".
* @param seconds - The time duration in seconds.
* @returns A string representing the formatted time duration.
*/
export function formatTime(seconds: number) {
    const sec = Math.max(0, Math.floor(seconds || 0))
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}
