const axios = require('axios');

/**
 * Send OTP via bulksmsplans.com API
 * @param {string} phoneNumber - Phone number in format +91XXXXXXXXXX
 * @param {string} otp - 6-digit OTP to send
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const sendOTP = async (phoneNumber, otp) => {
  const apiId = process.env.BULKSMSPLANS_API_ID;
  const apiPassword = process.env.BULKSMSPLANS_API_PASSWORD;
  const senderId = process.env.BULKSMSPLANS_SENDER_ID;
  const apiUrl = process.env.BULKSMSPLANS_API_URL || 'https://bulksmsplans.com/api/verify';

  if (!apiId || !apiPassword || !senderId) {
    console.error('SMS API credentials not configured');
    return {
      success: false,
      error: 'SMS service not configured. Please check environment variables.',
    };
  }

  try {
    // Format message with OTP
    const message = `Dear user, your OTP for login to Yash Classes is ${otp}. Please do not share this OTP with anyone. This OTP is valid for 10 minutes. - Yash Classes`;
    
    // Clean phone number - remove all non-digits (+ signs, spaces, dashes, etc.)
    const cleanPhoneNumber = phoneNumber.toString().replace(/\D/g, '');
    
    const params = {
      api_id: apiId,
      api_password: apiPassword,
      sms_type: 'Transactional',
      sms_encoding: 'text',
      sender: senderId,
      number: cleanPhoneNumber,
      message: message,
      template_id: '176983',
    };

    console.log(`Sending OTP to ${cleanPhoneNumber} via bulksmsplans.com`);

    const response = await axios.get(apiUrl, {
      params: params,
      timeout: 10000, // 10 second timeout
    });
    
    if (response) {
      console.log('SMS API Response:', response.data);
    }
    
    console.log(`SMS sent to ${cleanPhoneNumber}: ${message}`);

    // Check response based on bulksmsplans.com API format
    // API returns: { code: 200, message: "success", data: {...} } for success
    // API returns: { code: 500, message: "error", data: {...} } for error
    if (response.data && response.data.code === 200) {
      console.log(`OTP sent successfully to ${phoneNumber}`);
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } else {
      console.error('SMS API returned error:', response.data);
      
      // Extract specific error messages from API response
      let errorMessage = response.data?.message || 'Failed to send OTP';
      
      // If there's specific validation error data, include it
      if (response.data?.data) {
        const validationErrors = [];
        Object.keys(response.data.data).forEach((field) => {
          if (Array.isArray(response.data.data[field])) {
            validationErrors.push(...response.data.data[field]);
          }
        });
        
        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join('. ');
          
          // Provide helpful message for sender ID errors
          if (errorMessage.includes('sender') && errorMessage.includes('invalid')) {
            errorMessage = 'Invalid sender ID. Please check your BULKSMSPLANS_SENDER_ID in .env file. The sender ID must be approved in your bulksmsplans.com dashboard.';
          }
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('Error sending SMS via bulksmsplans.com:', error.message);
    
    // Handle different error types
    if (error.response) {
      // API returned an error response
      return {
        success: false,
        error: error.response.data?.message || 'SMS API returned an error',
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'No response from SMS service. Please try again.',
      };
    } else {
      // Error in request setup
      return {
        success: false,
        error: 'Failed to send OTP. Please try again later.',
      };
    }
  }
};

module.exports = {
  sendOTP,
};

