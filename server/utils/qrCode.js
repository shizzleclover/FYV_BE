const QRCode = require('qrcode');

/**
 * Generate a QR code for an event
 * @param {string} eventCode - The unique event code
 * @param {string} baseUrl - The base URL for the application (default: http://localhost:5000)
 * @returns {Promise<string>} - A promise that resolves to a data URL for the QR code
 */
async function generateEventQR(eventCode, baseUrl = 'http://localhost:5000') {
  if (!eventCode) {
    throw new Error('Event code is required');
  }
  
  // Create a URL that will be encoded in the QR code
  const joinUrl = `${baseUrl}/join/${eventCode}`;
  
  try {
    // Generate QR code as a data URL (base64 encoded image)
    const dataUrl = await QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#6c5ce7',  // Purple dots
        light: '#ffffff'  // White background
      }
    });
    
    return {
      dataUrl,
      joinUrl
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

module.exports = {
  generateEventQR
}; 