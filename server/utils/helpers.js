// Utility functions for generating anonymous IDs and validating event codes
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique anonymous ID for a participant
 * @returns {string} Anonymous ID in format "Player" + random digits
 */
const generateAnonymousId = () => {
  // Generate a random 3-digit number
  const randomDigits = Math.floor(Math.random() * 900) + 100;
  return `Player${randomDigits}`;
};

/**
 * Validate event code format
 * @param {string} code - Event code to validate
 * @returns {boolean} Whether the code is valid
 */
const validateEventCode = (code) => {
  // Event code should be alphanumeric and 6 characters long
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code);
};

/**
 * Generate a unique event code
 * @returns {string} Unique event code
 */
const generateEventCode = () => {
  // Generate a random 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

module.exports = {
  generateAnonymousId,
  validateEventCode,
  generateEventCode
};
