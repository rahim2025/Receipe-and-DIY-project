// Currency formatting utilities

// Approximate exchange rates (update periodically)
const EXCHANGE_RATES = {
  USD_TO_BDT: 120, // 1 USD = 120 BDT (approximate)
};

export const convertUSDtoBDT = (usdAmount) => {
  return Math.round(parseFloat(usdAmount) * EXCHANGE_RATES.USD_TO_BDT);
};

export const getCurrencySymbol = (currency) => {
  const symbols = {
    BDT: '৳',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    INR: '₹',
    JPY: '¥',
    CNY: '¥'
  };
  return symbols[currency] || '৳';
};

export const formatCurrency = (amount, currency = 'BDT', options = {}) => {
  const {
    showDecimals = true,
    compact = false
  } = options;

  if (!amount || amount === 0) return null;

  const symbol = getCurrencySymbol(currency);
  const numericAmount = parseFloat(amount);
  
  if (compact && numericAmount >= 1000) {
    if (numericAmount >= 1000000) {
      return `${symbol}${(numericAmount / 1000000).toFixed(1)}M`;
    } else if (numericAmount >= 1000) {
      return `${symbol}${(numericAmount / 1000).toFixed(1)}K`;
    }
  }
  
  if (showDecimals) {
    return `${symbol}${numericAmount.toFixed(2)}`;
  } else {
    return `${symbol}${Math.round(numericAmount)}`;
  }
};

export const getCurrencyName = (currency) => {
  const names = {
    BDT: 'Bangladeshi Taka',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    INR: 'Indian Rupee',
    JPY: 'Japanese Yen',
    CNY: 'Chinese Yuan'
  };
  return names[currency] || 'Bangladeshi Taka';
};