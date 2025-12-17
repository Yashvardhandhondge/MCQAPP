import { Platform } from 'react-native';

// Determine the correct API URL based on the platform
// For Android Emulator: use 10.0.2.2 (special IP that maps to host's localhost)
// For Physical Device (Expo Go): use your computer's network IP (192.168.1.7)
// For iOS Simulator: use localhost
// For iOS Physical Device: use your computer's network IP

let API_BASE_URL: string;

if (__DEV__) {
  if (Platform.OS === 'android') {
    // For physical Android device via Expo Go, use your network IP
    // Change this to your computer's IP address (found via ipconfig)
    // API_BASE_URL = 'http://192.168.1.7:8000';
    API_BASE_URL = 'http://192.168.29.158:8000';

    // If using Android Emulator instead, use:
    // API_BASE_URL = 'http://10.0.2.2:8000';
  } else {
    // iOS Simulator can use localhost
    API_BASE_URL = 'http://localhost:8000';
    // For physical iOS device via Expo Go, use network IP:
    // API_BASE_URL = 'http://192.168.1.7:8000';
  }
} else {
  // Production - use your production API URL
  API_BASE_URL = 'https://your-production-api.com';
}

export { API_BASE_URL };
export const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;
export const MCQ_BASE_URL = `${API_BASE_URL}/api/mcq`;
