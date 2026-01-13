import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface AppVersionResponse {
  success: boolean;
  data: {
    requiredVersion: string;
    requiredVersionCode: number;
    updateMessage: string;
    isUpdateRequired: boolean;
    playStoreUrl: string;
    updateUrl: string;
  };
}

/**
 * Compare two version strings (e.g., "1.0.0" vs "1.0.1")
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Check if current app version is less than required version
 * Also checks versionCode for Android if provided
 */
export function isVersionOutdated(
  currentVersion: string, 
  requiredVersion: string,
  currentVersionCode?: number,
  requiredVersionCode?: number
): boolean {
  // If versionCode is available and provided, use it as primary check (more reliable for Android)
  if (currentVersionCode !== undefined && requiredVersionCode !== undefined) {
    if (currentVersionCode < requiredVersionCode) {
      return true;
    }
    if (currentVersionCode > requiredVersionCode) {
      return false;
    }
    // If versionCodes are equal, fall through to version string comparison
  }
  
  // Fall back to version string comparison
  return compareVersions(currentVersion, requiredVersion) < 0;
}

/**
 * Get app version requirement from backend
 * React Native Code - API call to get app version (commented out for launch)
 */
/* COMMENTED OUT UPDATE FUNCTIONALITY - START
export async function getAppVersion(): Promise<AppVersionResponse> {
  try {
    const response = await axios.get<AppVersionResponse>(`${API_BASE_URL}/api/mcq/app-version`, {
      params: { _ts: Date.now() }, // Prevent caching
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Failed to fetch app version');
    }
    throw new Error('Failed to fetch app version');
  }
}
COMMENTED OUT UPDATE FUNCTIONALITY - END */