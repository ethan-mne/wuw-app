export function formatPrice(price: number) {
  let formattedPrice;
  if (price >= 1000) {
    const thousands = price / 1000;
    // Check if the division results in a whole number to decide on showing decimals
    formattedPrice =
      thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1);
    return `£${formattedPrice}k`;
  } else {
    return `£${price}`;
  }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-UK', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(value);
