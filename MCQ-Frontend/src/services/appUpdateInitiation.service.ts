/* ============================================
 * UPDATE FUNCTIONALITY TEMPORARILY DISABLED
 * Update facility API calls commented out for launch.
 * Will be re-enabled after launch.
 * ============================================ */

// import axios from 'axios';
// import { axiosInstance } from './http';

// React Native Code - Update initiation service interfaces and API calls commented out
/* COMMENTED OUT UPDATE FUNCTIONALITY - START
export interface InitiateUpdatePayload {
  requiredVersion: string;
  requiredVersionCode: number;
  currentVersion: string;
  currentVersionCode?: number;
  updateUrl?: string;
  playStoreUrl?: string;
  deviceInfo?: {
    platform: string;
    osVersion?: string;
    deviceModel?: string;
  };
}

export interface InitiateUpdateResponse {
  success: boolean;
  message: string;
  data: {
    initiationId: string;
    downloadStatus: string;
    updateUrl: string;
    playStoreUrl: string;
  };
}

export interface UpdateStatusPayload {
  downloadStatus: 'downloading' | 'downloaded' | 'failed' | 'installed';
}

/**
 * Record app update initiation in database
 * React Native Code - API call to initiate app update
 */
export async function initiateAppUpdate(payload: InitiateUpdatePayload): Promise<InitiateUpdateResponse> {
  try {
    const response = await axiosInstance.post<InitiateUpdateResponse>('/api/mcq/app-update/initiate', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to initiate app update');
    }
    throw new Error('Failed to initiate app update');
  }
}

/**
 * Update download status
 * React Native Code - API call to update download status
 */
export async function updateDownloadStatus(
  initiationId: string,
  status: UpdateStatusPayload['downloadStatus']
): Promise<void> {
  try {
    await axiosInstance.put(`/api/mcq/app-update/status/${initiationId}`, {
      downloadStatus: status,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to update download status');
    }
    throw new Error('Failed to update download status');
  }
}
COMMENTED OUT UPDATE FUNCTIONALITY - END */