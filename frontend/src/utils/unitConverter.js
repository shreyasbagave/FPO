/**
 * Unit conversion utilities
 * All quantities are stored in tons throughout the application
 */

/**
 * Format quantity in ton only
 * @param {number} quantity - Quantity in tons
 * @returns {string} - Formatted quantity in ton
 */
export const formatQuantityAllUnits = (quantity) => {
  if (!quantity && quantity !== 0) return '0 ton';
  
  const ton = parseFloat(quantity).toFixed(2);
  
  return `${ton} ton`;
};

/**
 * Format quantity in ton
 * @param {number} quantity - Quantity in tons
 * @returns {string} - Formatted quantity in ton
 */
export const formatQuantity = (quantity) => {
  if (!quantity && quantity !== 0) return '0 ton';
  
  return `${parseFloat(quantity).toFixed(2)} ton`;
};

