export function centsToUSD(cents: number): string {
    const usd = new Intl.NumberFormat('en-US', 
        { style: 'currency', currency: 'USD' });
    return usd.format(cents / 100)
}