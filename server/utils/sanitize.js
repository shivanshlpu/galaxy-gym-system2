/**
 * Security utilities — regex sanitization, input capping, and field whitelisting.
 * Used across all controllers to prevent NoSQL injection, ReDoS, and mass-assignment.
 */

/**
 * Escapes special regex characters from user input to prevent ReDoS attacks.
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for use in $regex
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Caps a pagination limit to prevent database dumping.
 * @param {*} value - Raw limit from query string
 * @param {number} defaultVal - Default if missing
 * @param {number} max - Hard maximum
 * @returns {number} Safe integer
 */
const safePaginationLimit = (value, defaultVal = 20, max = 100) => {
  const parsed = parseInt(value);
  if (isNaN(parsed) || parsed < 1) return defaultVal;
  return Math.min(parsed, max);
};

/**
 * Caps a pagination page number.
 * @param {*} value - Raw page from query string
 * @returns {number} Safe integer >= 1
 */
const safePage = (value) => {
  const parsed = parseInt(value);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

/**
 * Picks only allowed fields from an object (prevents mass-assignment).
 * @param {Object} source - Typically req.body
 * @param {string[]} allowedFields - Field names to keep
 * @returns {Object} Sanitized object with only allowed fields
 */
const pickFields = (source, allowedFields) => {
  const result = {};
  for (const field of allowedFields) {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  }
  return result;
};

/**
 * Strips HTML tags from a string to prevent stored XSS.
 * For plain text fields like names, addresses, notes.
 * @param {string} str - Raw input
 * @returns {string} Cleaned string
 */
const stripHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Sanitizes common text fields in an object (fullName, notes, address, email).
 * @param {Object} obj - Object with text fields
 * @param {string[]} fields - Fields to sanitize
 * @returns {Object} Same object with sanitized string fields
 */
const sanitizeTextFields = (obj, fields) => {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      result[field] = stripHtml(result[field]);
    }
  }
  return result;
};

module.exports = {
  escapeRegex,
  safePaginationLimit,
  safePage,
  pickFields,
  stripHtml,
  sanitizeTextFields,
};
