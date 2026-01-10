import axios from 'axios';
import { axiosInstance } from './http';

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
