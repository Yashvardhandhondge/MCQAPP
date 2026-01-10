import { axiosInstance } from './http';
import { MCQ_BASE_URL } from '../config';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  targetAudience: 'premium' | 'non-premium' | 'all';
  sentBy: {
    _id: string;
    fullName: string;
    email?: string;
  };
  sentTo: string[];
  readBy: string[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
  };
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    notificationId: string;
  };
}

/**
 * Get user notifications
 */
export async function getNotifications(): Promise<NotificationsResponse> {
  try {
    const response = await axiosInstance.get(`${MCQ_BASE_URL}/notifications`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
  }
}

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 */
export async function markNotificationAsRead(notificationId: string): Promise<NotificationResponse> {
  try {
    const response = await axiosInstance.put(`${MCQ_BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
  }
}

/**
 * Register OneSignal player ID with backend
 * @param playerId - OneSignal player ID (subscription ID)
 */
export async function registerDevice(playerId: string): Promise<boolean> {
  try {
    if (!playerId || playerId.trim().length === 0) {
      console.error('❌ [DEVICE REGISTRATION] Invalid playerId provided:', playerId);
      return false;
    }

    console.log('📤 [DEVICE REGISTRATION] Sending registration request to backend...', {
      endpoint: `${MCQ_BASE_URL}/notifications/register-device`,
      playerIdLength: playerId.length,
      playerIdPrefix: playerId.substring(0, 8) + '...',
    });

    const response = await axiosInstance.post(`${MCQ_BASE_URL}/notifications/register-device`, {
      playerId,
    });

    console.log('📥 [DEVICE REGISTRATION] Backend response:', {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    });

    if (response.data.success === true) {
      console.log('✅ [DEVICE REGISTRATION] Device registered successfully in database');
      return true;
    } else {
      console.warn('⚠️ [DEVICE REGISTRATION] Backend returned success=false:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('❌ [DEVICE REGISTRATION] Failed to register device:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      isNetworkError: !error?.response,
    });
    
    // Log more details if available
    if (error?.response?.data?.message) {
      console.error('❌ [DEVICE REGISTRATION] Backend error message:', error.response.data.message);
    }
    
    // Don't throw - device registration failure shouldn't block the app
    return false;
  }
}
