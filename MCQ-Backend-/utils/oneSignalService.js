const axios = require('axios');
require('dotenv').config();

const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Send push notification to specific player IDs
 * @param {string[]} playerIds - Array of OneSignal player IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} additionalData - Additional data to send with notification
 * @returns {Promise<object>} OneSignal API response
 */
async function sendNotificationToPlayers(playerIds, title, message, additionalData = {}) {
  // Check if API key and App ID are configured
  if (!ONESIGNAL_API_KEY || ONESIGNAL_API_KEY.trim() === '') {
    console.error('❌ [ONESIGNAL API] ONESIGNAL_API_KEY is missing or empty in environment variables');
    throw new Error('OneSignal REST API Key is not configured. Please set ONESIGNAL_API_KEY in your .env file');
  }

  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID.trim() === '') {
    console.error('❌ [ONESIGNAL API] ONESIGNAL_APP_ID is missing or empty in environment variables');
    throw new Error('OneSignal App ID is not configured. Please set ONESIGNAL_APP_ID in your .env file');
  }

  if (!playerIds || playerIds.length === 0) {
    throw new Error('No player IDs provided');
  }

  // Filter out any invalid player IDs
  const validPlayerIds = playerIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
  
  if (validPlayerIds.length === 0) {
    throw new Error('No valid player IDs provided after filtering');
  }

  console.log('📤 [ONESIGNAL API] Sending notification:', {
    apiKeySet: ONESIGNAL_API_KEY ? `Yes (length: ${ONESIGNAL_API_KEY.length})` : 'No',
    apiKeyPreview: ONESIGNAL_API_KEY ? ONESIGNAL_API_KEY.substring(0, 10) + '...' : 'Missing',
    appId: ONESIGNAL_APP_ID,
    appIdSet: ONESIGNAL_APP_ID ? 'Yes' : 'No',
    playerIdsCount: validPlayerIds.length,
    firstPlayerId: validPlayerIds[0]?.substring(0, 20) + '...',
    title,
    messageLength: message.length,
  });

  try {
    // For OneSignal REST API v1, use include_player_ids (for older SDK) or include_subscription_ids (for SDK v5+)
    // Try subscription_ids first (SDK v5+), fallback to player_ids (SDK v4)
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      // SDK v5 uses subscription IDs, but the field name in API might still be include_player_ids
      // Let's try both to be safe
      include_player_ids: validPlayerIds, // This should work for both SDK v4 and v5
      headings: { en: title },
      contents: { en: message },
      data: additionalData,
    };

    console.log('📤 [ONESIGNAL API] Notification payload:', {
      app_id: notification.app_id,
      include_player_ids_count: notification.include_player_ids.length,
      headings: notification.headings,
      contents_preview: notification.contents.en.substring(0, 50) + '...',
    });

    // OneSignal REST API uses Basic authentication
    // Format: Authorization: Basic <REST_API_KEY>
    // The REST API Key should be used directly (not base64 encoded for OneSignal)
    const authHeader = `Basic ${ONESIGNAL_API_KEY.trim()}`;
    
    console.log('🔐 [ONESIGNAL API] Using Authorization header:', {
      headerLength: authHeader.length,
      keyLength: ONESIGNAL_API_KEY.trim().length,
      headerPreview: authHeader.substring(0, 25) + '...',
    });

    const response = await axios.post(ONESIGNAL_REST_API_URL, notification, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    console.log('✅ [ONESIGNAL API] Notification sent successfully:', {
      id: response.data.id,
      recipients: response.data.recipients,
      errors: response.data.errors,
    });

    return response.data;
  } catch (error) {
    console.error('❌ [ONESIGNAL API] Error sending notification:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      playerIdsCount: validPlayerIds.length,
      apiKeyConfigured: !!ONESIGNAL_API_KEY,
      apiKeyLength: ONESIGNAL_API_KEY ? ONESIGNAL_API_KEY.length : 0,
      appIdConfigured: !!ONESIGNAL_APP_ID,
    });
    
    // Provide helpful error message for 403 errors
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.errors?.[0] || error.message;
      console.error('❌ [ONESIGNAL API] 403 Forbidden - This usually means:');
      console.error('   1. ONESIGNAL_API_KEY is missing or incorrect in .env file');
      console.error('   2. You need to use the REST API Key (not the App ID)');
      console.error('   3. Get your REST API Key from: https://onesignal.com/apps/YOUR_APP_ID/settings/keys_and_ids');
      console.error('   4. Make sure you\'re using the REST API Key, not the App ID');
      throw new Error(`OneSignal API Authentication Failed (403): ${errorMessage}. Please verify ONESIGNAL_API_KEY in your .env file is the correct REST API Key from OneSignal dashboard.`);
    }
    
    throw new Error(`Failed to send notification: ${error.response?.data?.errors?.[0] || error.message}`);
  }
}

/**
 * Send push notification using filters (subscription status)
 * Note: OneSignal filters can be used for segment-based targeting
 * @param {string} filterField - Field to filter by (e.g., 'tag', 'last_session')
 * @param {string} filterValue - Value to filter by
 * @param {string} filterRelation - Relation type ('=', '!=', '>', '<', 'EXISTS', 'NOT_EXISTS')
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} additionalData - Additional data to send with notification
 * @returns {Promise<object>} OneSignal API response
 */
async function sendNotificationWithFilters(filterField, filterValue, filterRelation, title, message, additionalData = {}) {
  if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
    throw new Error('OneSignal API key or App ID not configured');
  }

  try {
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      filters: [
        {
          field: filterField,
          relation: filterRelation,
          value: filterValue,
        },
      ],
      headings: { en: title },
      contents: { en: message },
      data: additionalData,
    };

    const response = await axios.post(ONESIGNAL_REST_API_URL, notification, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('OneSignal API Error:', error.response?.data || error.message);
    throw new Error(`Failed to send notification: ${error.response?.data?.errors?.[0] || error.message}`);
  }
}

module.exports = {
  sendNotificationToPlayers,
  sendNotificationWithFilters,
};
